import { emptyProfile, emptyProjectCard, profileActionTemplates } from "./uiDefaults";

function getRelativeProjectTime() {
  return "Live";
}

function getRelativePostTime(createdAt) {
  if (!createdAt) {
    return "Recent";
  }

  const created = new Date(createdAt);
  const diffMinutes = Math.max(1, Math.floor((Date.now() - created.getTime()) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function mapApiProjectToCard(project) {
  return {
    ...emptyProjectCard,
    kind: "project",
    id: project.id,
    createdAt: project.createdAt,
    user: {
      name: project.owner?.name ?? "Unknown builder",
      username: project.owner?.username ?? "",
      bio: project.owner?.title ?? "Builder",
      avatar: project.owner?.avatar ?? "https://i.pravatar.cc/100?img=12",
    },
    time: getRelativeProjectTime(),
    title: project.title,
    problem: project.problem,
    solution: project.solution,
    image: project.image,
    progress: project.progress ?? 0,
    contributors: Array.from(
      { length: project.contributorsCount ?? 0 },
      (_, index) => ({
        id: `${project.id}-contributor-${index + 1}`,
        name: `Builder ${index + 1}`,
      }),
    ),
    techStack: project.techStack ?? [],
    openRoles: project.openRoles ?? [],
    difficulty: project.difficulty ?? "Active room",
    timeline: project.timeline ?? "Open timeline",
    mentorStatus: project.mentorStatus ?? "Mentor status not set",
    github: project.githubUrl ?? "https://github.com/",
    demo: project.demoUrl ?? "https://example.com/",
    tags: project.tags ?? [],
    tasks: [],
    milestones: [],
    discussions: [],
  };
}

export function mapApiPostToCard(post) {
  return {
    kind: "post",
    id: post.id,
    createdAt: post.createdAt,
    type: post.type,
    time: getRelativePostTime(post.createdAt),
    title: post.title,
    description: post.description,
    image: post.image ?? null,
    likes: post.likes ?? 0,
    comments: post.comments ?? 0,
    tags: post.tags ?? [],
    linkedProject: post.linkedProject?.title ?? null,
    linkedProjectId: post.linkedProject?.id ?? null,
    user: {
      name: post.user?.name ?? "Unknown builder",
      username: post.user?.username ?? "",
      bio: post.user?.bio ?? "Builder",
      avatar: post.user?.avatar ?? "https://i.pravatar.cc/100?img=12",
    },
  };
}

export function mapApiProjectToDetail(project, fallbackProject) {
  return {
    ...emptyProjectCard,
    ...fallbackProject,
    ...project,
    user: {
      name: project.owner?.name ?? fallbackProject?.user?.name ?? "Unknown builder",
      username: project.owner?.username ?? fallbackProject?.user?.username ?? "",
      bio: project.owner?.title ?? fallbackProject?.user?.bio ?? "Builder",
      avatar:
        project.owner?.avatar ??
        fallbackProject?.user?.avatar ??
        "https://i.pravatar.cc/100?img=12",
    },
    contributors:
      project.members?.map((member) => ({
        id: member.id,
        name: member.name,
      })) ??
      fallbackProject?.contributors ??
      [],
    techStack: project.techStack ?? fallbackProject?.techStack ?? [],
    openRoles: project.openRoles ?? fallbackProject?.openRoles ?? [],
    github: project.githubUrl ?? fallbackProject?.github ?? "https://github.com/",
    demo: project.demoUrl ?? fallbackProject?.demo ?? "https://example.com/",
    tags: project.tags ?? fallbackProject?.tags ?? [],
    tasks: fallbackProject?.tasks ?? [],
    milestones: fallbackProject?.milestones ?? [],
    discussions: fallbackProject?.discussions ?? [],
    time: fallbackProject?.time ?? getRelativeProjectTime(),
  };
}

export function mapApiProfileToUi(profileResponse, username) {
  const user = profileResponse?.user ?? {};
  const proof = profileResponse?.proofProfile ?? {};

  return {
    ...emptyProfile,
    name: user.name ?? emptyProfile.name,
    username: user.username ?? username ?? emptyProfile.username,
    title: user.title ?? emptyProfile.title,
    headline: proof.headline ?? user.title ?? emptyProfile.headline,
    bio: user.bio ?? emptyProfile.bio,
    summary: proof.summary ?? user.bio ?? emptyProfile.summary,
    location: user.location ?? emptyProfile.location,
    avatar: user.avatar ?? emptyProfile.avatar,
    proofScore: proof.proofScore ?? emptyProfile.proofScore,
    builderLevel: proof.builderLevel ?? emptyProfile.builderLevel,
    rank: proof.rankLabel ?? emptyProfile.rank,
    shippedProjects: proof.shippedProjectsCount ?? emptyProfile.shippedProjects,
    completedTasks: proof.completedTasksCount ?? emptyProfile.completedTasks,
    verifiedSkills: proof.verifiedSkillsCount ?? emptyProfile.verifiedSkills,
    mentorReviews: proof.mentorReviewsCount ?? emptyProfile.mentorReviews,
    openTo: user.openTo?.length ? user.openTo : emptyProfile.openTo,
    links: proof.links?.length ? proof.links : emptyProfile.links,
    trustSignals: proof.trustSignals?.length ? proof.trustSignals : emptyProfile.trustSignals,
    skills: proof.skills?.length ? proof.skills : emptyProfile.skills,
    actions: profileActionTemplates,
    resumeLinks: (proof.links ?? []).map((link) => link.value),
    stats: [
      {
        label: "Proof Score",
        value: String(proof.proofScore ?? emptyProfile.proofScore),
        iconKey: "shield",
      },
      {
        label: "Shipped Projects",
        value: String(proof.shippedProjectsCount ?? emptyProfile.shippedProjects),
        iconKey: "rocket",
      },
      {
        label: "Completed Tasks",
        value: String(proof.completedTasksCount ?? emptyProfile.completedTasks),
        iconKey: "check-circle",
      },
      {
        label: "Mentor Reviews",
        value: String(proof.mentorReviewsCount ?? emptyProfile.mentorReviews),
        iconKey: "review",
      },
    ],
  };
}
