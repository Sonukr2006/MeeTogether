const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { URL } = require('url');

const serverDir = path.resolve(__dirname, '..');

function waitForPort(port, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const socket = new (require('net').Socket)();
      socket.setTimeout(1000);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 250);
        }
      });
      socket.on('timeout', () => {
        socket.destroy();
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 250);
        }
      });
      socket.connect(port, '127.0.0.1');
    }

    check();
  });
}

function httpRequest(url, options = {}, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bodyString = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode, headers: res.headers, body: bodyString });
      });
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function spawnServer(env) {
  const proc = spawn('npm', ['run', 'start:dev'], {
    cwd: serverDir,
    env: Object.assign({}, process.env, env),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (chunk) => {
    process.stdout.write(`[server ${env.PORT}] ${chunk}`);
  });
  proc.stderr.on('data', (chunk) => {
    process.stderr.write(`[server ${env.PORT}] ${chunk}`);
  });

  return proc;
}

async function run() {
  console.log('Running production cookie validation tests...');

  const validPort = 4500;
  const invalidPort = 4501;

  const validEnv = {
    NODE_ENV: 'production',
    PORT: String(validPort),
    AUTH_COOKIE_DOMAIN: 'example.com',
    AUTH_COOKIE_SAME_SITE: 'none',
    CLIENT_ORIGIN: 'http://localhost:5173',
  };

  const validServer = spawnServer(validEnv);
  try {
    await waitForPort(validPort, 25000);
    console.log('Valid production server listening on port', validPort);

    const signupBody = JSON.stringify({
      name: 'Prod Cookie Test',
      username: `prod_cookie_test_${Date.now()}`,
      email: `prod_cookie_test_${Date.now()}@example.com`,
      password: 'Passw0rd123',
    });

    const result = await httpRequest(`http://127.0.0.1:${validPort}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'http://localhost:5173',
      },
    }, signupBody);

    if (result.status !== 201) {
      throw new Error(`Expected 201 signup response, got ${result.status}: ${result.body}`);
    }

    const setCookie = result.headers['set-cookie'];
    if (!Array.isArray(setCookie)) {
      throw new Error('Expected Set-Cookie header array in signup response');
    }

    const refreshCookie = setCookie.find((value) => value.startsWith('mt_refresh_token='));
    const csrfCookie = setCookie.find((value) => value.startsWith('mt_csrf_token='));

    if (!refreshCookie || !csrfCookie) {
      throw new Error('Expected both mt_refresh_token and mt_csrf_token cookies');
    }

    ['Domain=example.com', 'Secure', 'SameSite=None'].forEach((expected) => {
      if (!refreshCookie.includes(expected)) {
        throw new Error(`mt_refresh_token missing expected attribute: ${expected}`);
      }
      if (!csrfCookie.includes(expected)) {
        throw new Error(`mt_csrf_token missing expected attribute: ${expected}`);
      }
    });

    console.log('✔ Cookie headers are correct for production mode');
  } finally {
    if (!validServer.killed) {
      validServer.kill('SIGINT');
    }
  }

  console.log('Checking startup failure when AUTH_COOKIE_DOMAIN is missing...');

  const invalidEnv = {
    NODE_ENV: 'production',
    PORT: String(invalidPort),
    AUTH_COOKIE_SAME_SITE: 'none',
    CLIENT_ORIGIN: 'http://localhost:5173',
  };

  const invalidServer = spawnServer(invalidEnv);
  let exited = false;
  let failReason = '';
  invalidServer.on('exit', (code) => {
    exited = true;
    if (code === 0) {
      failReason = 'Server exited with code 0 even though AUTH_COOKIE_DOMAIN was missing';
    }
  });
  invalidServer.on('error', (err) => {
    exited = true;
    failReason = err.message;
  });

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!exited) {
        invalidServer.kill('SIGINT');
        reject(new Error('Expected server to fail startup when AUTH_COOKIE_DOMAIN is missing, but it did not exit quickly')); 
      }
    }, 10000);

    invalidServer.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      if (/AUTH_COOKIE_DOMAIN must be set/i.test(text)) {
        clearTimeout(timeout);
        exited = true;
        resolve();
      }
    });

    invalidServer.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        resolve();
      } else {
        reject(new Error('Server exited with code 0 even though AUTH_COOKIE_DOMAIN was missing')); 
      }
    });
  });

  if (!invalidServer.killed) {
    invalidServer.kill('SIGINT');
  }

  console.log('✔ Production startup validation works when AUTH_COOKIE_DOMAIN is missing');
  console.log('All production cookie/domain tests passed.');
}

run().catch((err) => {
  console.error('Production cookie config test failed:');
  console.error(err);
  process.exit(1);
});
