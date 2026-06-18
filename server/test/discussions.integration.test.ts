import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { AccountState } from '@prisma/client';
import { DiscussionsService } from 'src/modules/discussions/discussions.service';
import { PrismaService } from 'src/prisma/prisma.service';

const testRunId = `discussion-${Date.now()}`;
const createdUserIds = new Set<string>();

let prisma: PrismaService;
let discussionsService: DiscussionsService;

void describe('DiscussionsService integration', () => {
  before(async () => {
    process.env.DATABASE_URL = requireSafeTestDatabaseUrl();

    prisma = new PrismaService();
    await prisma.onModuleInit();
    discussionsService = new DiscussionsService(prisma);
  });

  after(async () => {
    if (!prisma) {
      return;
    }

    await prisma.user.deleteMany({
      where: {
        id: {
          in: Array.from(createdUserIds),
        },
      },
    });
    await prisma.onModuleDestroy();
  });

  void it('creates contiguous sequence numbers during sequential message sends', async () => {
    const { member, owner, thread } = await createDiscussionFixture({
      visibility: 'private',
    });
    const messageCount = 5;

    for (let i = 0; i < messageCount; i++) {
      await discussionsService.createMessage(thread.id, member.id, {
        message: `Sequential message ${i + 1}`,
      });
    }

    const messages = await prisma.discussionMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { sequenceNumber: 'asc' },
      select: {
        sequenceNumber: true,
      },
    });

    assert.deepEqual(
      messages.map((message) => message.sequenceNumber),
      Array.from({ length: messageCount }, (_, index) => index + 1),
    );

    const uniqueSequenceNumbers = new Set(
      messages.map((message) => message.sequenceNumber),
    );
    assert.equal(uniqueSequenceNumbers.size, messageCount);

    const updatedThread = await prisma.discussionThread.findUniqueOrThrow({
      where: { id: thread.id },
      select: { lastMessageAt: true },
    });
    assert.ok(updatedThread.lastMessageAt);

    const authorState = await prisma.threadParticipantState.findUniqueOrThrow({
      where: {
        threadId_userId: {
          threadId: thread.id,
          userId: member.id,
        },
      },
      select: { unreadCountSnapshot: true },
    });
    assert.equal(authorState.unreadCountSnapshot, 0);

    const ownerState = await prisma.threadParticipantState.findUniqueOrThrow({
      where: {
        threadId_userId: {
          threadId: thread.id,
          userId: owner.id,
        },
      },
      select: { unreadCountSnapshot: true },
    });
    assert.equal(ownerState.unreadCountSnapshot, messageCount);
  });

  void it('rejects message creation by a non-member on a visible project thread', async () => {
    const { outsider, thread } = await createDiscussionFixture({
      visibility: 'public',
    });

    await assert.rejects(
      () =>
        discussionsService.createMessage(thread.id, outsider.id, {
          message: 'This should not be accepted',
        }),
      (error: unknown) => {
        assert.equal(getHttpStatus(error), 403);
        return true;
      },
    );
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

async function createDiscussionFixture({
  visibility,
}: {
  visibility: string;
}) {
  const [owner, member, outsider] = await Promise.all([
    createTestUser('owner'),
    createTestUser('member'),
    createTestUser('outsider'),
  ]);

  const project = await prisma.project.create({
    data: {
      ownerUserId: owner.id,
      title: `${testRunId} ${visibility} project`,
      problem: 'Discussion integration test problem',
      solution: 'Discussion integration test solution',
      visibility,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        userId: owner.id,
        roleLabel: 'Owner',
      },
      {
        projectId: project.id,
        userId: member.id,
        roleLabel: 'Member',
      },
    ],
  });

  const thread = await prisma.discussionThread.create({
    data: {
      projectId: project.id,
      title: `${testRunId} ${visibility} thread`,
      kind: 'default',
      createdByUserId: owner.id,
    },
  });

  await prisma.threadParticipantState.create({
    data: {
      threadId: thread.id,
      userId: owner.id,
    },
  });

  return {
    member,
    outsider,
    owner,
    project,
    thread,
  };
}

async function createTestUser(role: string) {
  const uniqueSuffix = `${role}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  const user = await prisma.user.create({
    data: {
      name: `${role} user`,
      username: uniqueSuffix.replace(/-/g, '_'),
      email: `${uniqueSuffix}@example.test`,
      passwordHash: 'integration-test-password-hash',
      emailVerified: true,
      accountState: AccountState.ACTIVE,
    },
  });

  createdUserIds.add(user.id);
  return user;
}

function getHttpStatus(error: unknown) {
  if (hasHttpStatus(error)) {
    return error.getStatus();
  }

  return undefined;
}

function hasHttpStatus(error: unknown): error is { getStatus: () => number } {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return typeof (error as { getStatus?: unknown }).getStatus === 'function';
}
