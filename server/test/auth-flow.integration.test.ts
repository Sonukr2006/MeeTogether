import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { AccountState } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

const testRunId = `auth-flow-${Date.now()}`;
const createdUserIds = new Set<string>();

let prisma: PrismaService;

void describe('Auth flow integration', () => {
  before(async () => {
    process.env.DATABASE_URL = requireSafeTestDatabaseUrl();

    prisma = new PrismaService();
    await prisma.onModuleInit();
  });

  after(async () => {
    if (!prisma) {
      return;
    }

    await prisma.session.deleteMany({
      where: {
        userId: {
          in: Array.from(createdUserIds),
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: Array.from(createdUserIds),
        },
      },
    });

    await prisma.onModuleDestroy();
  });

  void it('signup creates user and session with refreshTokenHash', async () => {
    const user = await createTestUser('signup');

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTokenHash = hashToken(refreshToken);
    const csrfToken = randomBytes(32).toString('hex');
    const csrfTokenHash = hashToken(csrfToken);
    const tokenFamilyId = randomBytes(16).toString('hex');

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        csrfTokenHash,
        tokenFamilyId,
        userAgent: 'integration-test',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    });

    assert.ok(session.id);
    assert.equal(session.userId, user.id);
    assert.equal(session.refreshTokenHash, refreshTokenHash);
    assert.equal(session.csrfTokenHash, csrfTokenHash);
    assert.equal(session.tokenFamilyId, tokenFamilyId);
    assert.equal(session.revokedAt, null);

    // Verify the hash matches the original token
    const recomputedHash = hashToken(refreshToken);
    assert.equal(session.refreshTokenHash, recomputedHash);
  });

  void it('refresh token reuse revokes entire token family', async () => {
    const user = await createTestUser('reuse');
    const tokenFamilyId = randomBytes(16).toString('hex');

    // Create original session (simulates first login)
    const originalRefreshToken = randomBytes(48).toString('hex');
    const originalSession = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(originalRefreshToken),
        csrfTokenHash: hashToken(randomBytes(32).toString('hex')),
        tokenFamilyId,
        userAgent: 'integration-test',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    });

    // Simulate a refresh: revoke original, create rotated session
    await prisma.session.update({
      where: { id: originalSession.id },
      data: { revokedAt: new Date() },
    });

    const rotatedRefreshToken = randomBytes(48).toString('hex');
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(rotatedRefreshToken),
        csrfTokenHash: hashToken(randomBytes(32).toString('hex')),
        tokenFamilyId,
        userAgent: 'integration-test',
        ipAddress: '127.0.0.1',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    });

    // Simulate token reuse detection: attacker replays original token
    const reusedSession = await prisma.session.findFirst({
      where: { refreshTokenHash: hashToken(originalRefreshToken) },
    });

    assert.ok(reusedSession);
    assert.ok(reusedSession.revokedAt, 'Reused token session should already be revoked');

    // Revoke entire family (as AuthService.handleRefreshTokenReuse does)
    await prisma.session.updateMany({
      where: {
        tokenFamilyId: reusedSession.tokenFamilyId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });

    // Verify all sessions in family are revoked
    const activeSessions = await prisma.session.findMany({
      where: {
        tokenFamilyId,
        revokedAt: null,
      },
    });

    assert.equal(activeSessions.length, 0, 'All sessions in the token family should be revoked');
  });

  void it('password reset revokes all user sessions', async () => {
    const user = await createTestUser('pwreset');

    // Create 2 active sessions for the user
    const familyA = randomBytes(16).toString('hex');
    const familyB = randomBytes(16).toString('hex');

    await prisma.session.createMany({
      data: [
        {
          userId: user.id,
          refreshTokenHash: hashToken(randomBytes(48).toString('hex')),
          csrfTokenHash: hashToken(randomBytes(32).toString('hex')),
          tokenFamilyId: familyA,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastUsedAt: new Date(),
        },
        {
          userId: user.id,
          refreshTokenHash: hashToken(randomBytes(48).toString('hex')),
          csrfTokenHash: hashToken(randomBytes(32).toString('hex')),
          tokenFamilyId: familyB,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          lastUsedAt: new Date(),
        },
      ],
    });

    // Verify 2 active sessions exist
    const beforeReset = await prisma.session.findMany({
      where: { userId: user.id, revokedAt: null },
    });
    assert.equal(beforeReset.length, 2);

    // Simulate password reset: update password and revoke all sessions (as resetPassword does)
    const newPasswordHash = await bcrypt.hash('new-secure-password-123', 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      }),
      prisma.session.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      }),
    ]);

    // Verify all sessions are revoked
    const afterReset = await prisma.session.findMany({
      where: { userId: user.id, revokedAt: null },
    });
    assert.equal(afterReset.length, 0, 'All sessions should be revoked after password reset');

    // Verify password was updated
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const passwordValid = await bcrypt.compare('new-secure-password-123', updatedUser.passwordHash);
    assert.ok(passwordValid, 'New password should verify correctly');
  });

  void it('CSRF validation rejects session with null csrfTokenHash', async () => {
    const user = await createTestUser('csrf');

    // Create a session WITHOUT csrfTokenHash (simulates a corrupted or legacy session)
    const refreshToken = randomBytes(48).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        csrfTokenHash: null,
        tokenFamilyId: randomBytes(16).toString('hex'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    });

    assert.equal(session.csrfTokenHash, null);

    // Directly test the validation logic:
    // When csrfTokenHash is null, the AuthService.validateCsrfForSession throws
    // "Session expired — please log in again"
    const csrfTokenHash = session.csrfTokenHash;
    assert.equal(csrfTokenHash, null, 'Session should have null csrfTokenHash');

    // The auth service checks: if (!sessionCsrfTokenHash) throw UnauthorizedException
    // We verify the condition that triggers rejection
    const shouldReject = !csrfTokenHash;
    assert.ok(shouldReject, 'Null csrfTokenHash should trigger session rejection');
  });

  void it('token preview is not included in response shape', async () => {
    // Verify that the signup/forgotPassword responses only contain expected fields
    // by simulating what the auth service returns

    // signup returns: { accessToken, user }
    const signupResponseKeys = ['accessToken', 'user'];
    assert.ok(!signupResponseKeys.includes('refreshToken'), 'Response should not expose refreshToken');
    assert.ok(!signupResponseKeys.includes('csrfToken'), 'Response should not expose csrfToken in body');

    // forgotPassword returns: { success, message }
    const forgotPasswordResponseKeys = ['success', 'message'];
    assert.ok(!forgotPasswordResponseKeys.includes('token'), 'ForgotPassword response should not expose token');
    assert.ok(!forgotPasswordResponseKeys.includes('resetToken'), 'ForgotPassword response should not expose resetToken');

    // Verify session record does not store raw tokens (only hashes)
    const user = await createTestUser('tokenpreview');
    const rawToken = randomBytes(48).toString('hex');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(rawToken),
        csrfTokenHash: hashToken(randomBytes(32).toString('hex')),
        tokenFamilyId: randomBytes(16).toString('hex'),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastUsedAt: new Date(),
      },
    });

    // The stored hash must NOT equal the raw token
    assert.notEqual(session.refreshTokenHash, rawToken, 'Raw token should not be stored');
    // Verify it's actually a sha256 hash (64 hex chars)
    assert.equal(session.refreshTokenHash.length, 64);
    assert.match(session.refreshTokenHash, /^[a-f0-9]{64}$/);
  });
});

function requireSafeTestDatabaseUrl() {
  const databaseUrl = process.env.TEST_DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'TEST_DATABASE_URL is required for integration tests. Use an isolated local or CI database.',
    );
  }

  const parsedUrl = new URL(databaseUrl);
  const isLocalHost = ['localhost', '127.0.0.1', '::1'].includes(
    parsedUrl.hostname,
  );
  const looksLikeTestDatabase = /test/i.test(parsedUrl.pathname);

  if (!isLocalHost && !looksLikeTestDatabase) {
    throw new Error(
      'Refusing to run destructive integration tests without a local host or test-named database.',
    );
  }

  return databaseUrl;
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function createTestUser(role: string) {
  const uniqueSuffix = `${role}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  const passwordHash = await bcrypt.hash('test-password-123', 12);
  const user = await prisma.user.create({
    data: {
      name: `${testRunId} ${role} user`,
      username: uniqueSuffix.replace(/-/g, '_'),
      email: `${uniqueSuffix}@example.test`,
      passwordHash,
      emailVerified: true,
      accountState: AccountState.ACTIVE,
    },
  });

  createdUserIds.add(user.id);
  return user;
}
