import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { AccountState } from '@prisma/client';
import { DiscussionsService } from 'src/modules/discussions/discussions.service';
import { IssuesService } from 'src/modules/issues/issues.service';
import { PermissionService } from 'src/modules/permissions/permission.service';
import { PrismaService } from 'src/prisma/prisma.service';

const testRunId = `permission-${Date.now()}`;
const createdUserIds = new Set<string>();

let prisma: PrismaService;
let discussionsService: DiscussionsService;
let issuesService: IssuesService;
let permissionService: PermissionService;

void describe('Permission matrix integration', () => {
  before(async () => {
    process.env.DATABASE_URL = requireSafeTestDatabaseUrl();

    prisma = new PrismaService();
    await prisma.onModuleInit();
    discussionsService = new DiscussionsService(prisma);
    issuesService = new IssuesService(prisma);
    permissionService = new PermissionService(prisma);
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

  void it('non-member cannot post to private thread', async () => {
    const { outsider, thread } = await createDiscussionFixture({
      visibility: 'private',
    });

    await assert.rejects(
      () =>
        discussionsService.createMessage(thread.id, outsider.id, {
          message: 'This should be rejected',
        }),
      (error: unknown) => {
        // DiscussionsService returns 404 to avoid revealing thread existence to non-members
        const status = getHttpStatus(error);
        assert.ok(status === 403 || status === 404, `Expected 403 or 404, got ${status}`);
        return true;
      },
    );
  });

  void it('project owner can post to their thread', async () => {
    const { owner, thread } = await createDiscussionFixture({
      visibility: 'private',
    });

    const message = await discussionsService.createMessage(thread.id, owner.id, {
      message: 'Owner posting to own thread',
    });

    assert.ok(message.id);
    assert.equal(message.message, 'Owner posting to own thread');
    assert.equal(message.authorUser.id, owner.id);
  });

  void it('member can post to project thread', async () => {
    const { member, thread } = await createDiscussionFixture({
      visibility: 'private',
    });

    const message = await discussionsService.createMessage(thread.id, member.id, {
      message: 'Member posting to thread',
    });

    assert.ok(message.id);
    assert.equal(message.message, 'Member posting to thread');
    assert.equal(message.authorUser.id, member.id);
  });

  void it('non-member can view public project discussions', async () => {
    const { outsider, project, thread } = await createDiscussionFixture({
      visibility: 'public',
    });

    // Owner posts a message first so there is content to view
    const { owner } = await getFixtureUsers(project.id);
    await discussionsService.createMessage(thread.id, owner.id, {
      message: 'Public thread message',
    });

    // Non-member should be able to view threads on a public project
    const threads = await discussionsService.getThreadsForProject(
      project.id,
      outsider.id,
    );

    assert.ok(threads.length > 0, 'Outsider should see public project threads');
    assert.equal(threads[0].id, thread.id);
  });

  void it('non-member cannot view private project discussions', async () => {
    const { outsider, project } = await createDiscussionFixture({
      visibility: 'private',
    });

    await assert.rejects(
      () => discussionsService.getThreadsForProject(project.id, outsider.id),
      (error: unknown) => {
        // DiscussionsService throws NotFoundException (404) for private projects
        assert.equal(getHttpStatus(error), 404);
        return true;
      },
    );
  });

  void it('upload ownership — user cannot access another user project', async () => {
    const { owner, outsider, project } = await createDiscussionFixture({
      visibility: 'private',
    });

    // PermissionService.canEditProject returns true only for the owner
    const ownerCanEdit = await permissionService.canEditProject(owner.id, project.id);
    assert.ok(ownerCanEdit, 'Owner should be able to edit their project');

    const outsiderCanEdit = await permissionService.canEditProject(outsider.id, project.id);
    assert.equal(outsiderCanEdit, false, 'Non-owner should not be able to edit the project');

    // canViewProject returns false for private project non-member
    const outsiderCanView = await permissionService.canViewProject(outsider.id, project.id);
    assert.equal(outsiderCanView, false, 'Non-member should not be able to view private project');
  });

  void it('issues require auth — member can manage, non-member cannot', async () => {
    const { owner, member, outsider, project } = await createDiscussionFixture({
      visibility: 'private',
    });

    // Create an issue in the project
    await prisma.issue.create({
      data: {
        projectId: project.id,
        createdByUserId: owner.id,
        title: `${testRunId} test issue`,
        description: 'Integration test issue',
        status: 'OPEN',
        priority: 'NORMAL',
      },
    });

    // PermissionService.canManageIssue — owner has access
    const ownerCanManage = await permissionService.canManageIssue(owner.id, project.id);
    assert.ok(ownerCanManage, 'Owner should be able to manage issues');

    // PermissionService.canManageIssue — member has access
    const memberCanManage = await permissionService.canManageIssue(member.id, project.id);
    assert.ok(memberCanManage, 'Member should be able to manage issues');

    // PermissionService.canManageIssue — outsider denied
    const outsiderCanManage = await permissionService.canManageIssue(outsider.id, project.id);
    assert.equal(outsiderCanManage, false, 'Non-member should not be able to manage issues');

    // IssuesService.getIssues returns data for the project (publicly queryable endpoint)
    const issuesList = await issuesService.getIssues({ projectId: project.id });
    assert.ok(issuesList.data.length > 0, 'Issues should be retrievable for the project');
    assert.equal(issuesList.data[0].title, `${testRunId} test issue`);
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
      problem: 'Permission matrix integration test problem',
      solution: 'Permission matrix integration test solution',
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

async function getFixtureUsers(projectId: string) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: true },
  });

  const ownerMember = members.find((m) => m.roleLabel === 'Owner');
  if (!ownerMember) {
    throw new Error('Owner not found in project fixture');
  }

  return { owner: ownerMember.user };
}

async function createTestUser(role: string) {
  const uniqueSuffix = `${role}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  const user = await prisma.user.create({
    data: {
      name: `${testRunId} ${role} user`,
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
