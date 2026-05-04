export const posts = [
  {
    id: 1,
    type: "Build Log",
    user: {
      name: "Aarav Singh",
      bio: "Backend Engineer | APIs",
      avatar: "https://i.pravatar.cc/100?img=15",
    },
    time: "2h ago",
    title: "GitHub import service is ready for review",
    description:
      "Finished OAuth flow, repo sync, and contribution mapping for Campus Skill Graph. Looking for one reviewer before connecting it to profiles.Finished OAuth flow, repo sync, and contribution mapping for Campus Skill Graph. Looking for one reviewer before connecting it to profiles.",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    linkedProject: "Campus Skill Graph",
    tags: ["BuildLog", "GitHubAPI", "Backend"],
    likes: 18,
    comments: 6,
  },
  {
    id: 2,
    type: "Help Needed",
    user: {
      name: "Meera Nair",
      bio: "Student Builder | React",
      avatar: "https://i.pravatar.cc/100?img=5",
    },
    time: "5h ago",
    title: "Need UI help for contribution timeline",
    description:
      "The data is ready, but the timeline needs a clean visual layout for commits, PRs, shipped tasks, and mentor feedback.",
    image: "",
    linkedProject: "Campus Skill Graph",
    tags: ["HelpNeeded", "React", "Portfolio"],
    likes: 11,
    comments: 9,
  },
  {
    id: 3,
    type: "Mentor Review",
    user: {
      name: "Neha Kapoor",
      bio: "SDE-II | Mentor",
      avatar: "https://i.pravatar.cc/100?img=32",
    },
    time: "1d ago",
    title: "Review request: issue claiming flow",
    description:
      "Before students claim open-source issues, should we require an approach note and estimated task split? Need opinions from maintainers.",
    image:
      "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
    linkedProject: "Open Source Issue Triage Room",
    tags: ["MentorReview", "OpenSource", "Workflow"],
    likes: 24,
    comments: 14,
  },
  {
    id: 4,
    type: "Launch",
    user: {
      name: "Ishan Rao",
      bio: "DevOps Learner | Cloud",
      avatar: "https://i.pravatar.cc/100?img=22",
    },
    time: "2d ago",
    title: "Deployed the first triage dashboard",
    description:
      "Added project health, active issues, contributor queue, and PR review status. Next step is GitHub webhook automation.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    linkedProject: "Open Source Issue Triage Room",
    tags: ["Launch", "Dashboard", "DevOps"],
    likes: 31,
    comments: 12,
  },
];
