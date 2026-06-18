const { spawnSync } = require('node:child_process');
const { readdirSync, statSync } = require('node:fs');
const { join } = require('node:path');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  console.error(
    'TEST_DATABASE_URL is required for integration tests. Use an isolated local or CI database.',
  );
  process.exit(1);
}

const parsedUrl = new URL(testDatabaseUrl);
const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(
  parsedUrl.hostname,
);
const looksLikeTestDatabase = /test/i.test(parsedUrl.pathname);

if (!isLocalHost && !looksLikeTestDatabase) {
  console.error(
    'Refusing to run destructive integration tests without a local host or test-named database.',
  );
  process.exit(1);
}

const testFiles = findTestFiles('test');

if (testFiles.length === 0) {
  console.error('No integration test files found.');
  process.exit(1);
}

for (const testFile of testFiles) {
  const result = spawnSync(
    process.execPath,
    ['-r', 'ts-node/register', '-r', 'tsconfig-paths/register', testFile],
    {
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
      },
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.exit(0);

function findTestFiles(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const filePath = join(directory, entry);
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      return findTestFiles(filePath);
    }

    if (filePath.endsWith('.test.ts')) {
      return [filePath];
    }

    return [];
  });
}
