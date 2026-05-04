export const projects = [
  {
    id: 1,
    user: {
      name: "Sonu Kumar",
      bio: "Student Builder | Full-stack",
      avatar: "https://i.pravatar.cc/100?img=12",
    },
    time: "1d ago",
    title: "Campus Skill Graph",
    problem:
      "Students have projects, GitHub work, and hackathon wins scattered across platforms.Students have projects, GitHub work, and hackathon wins scattered across platforms.",
    solution:
      "Create a proof-of-work profile that turns verified contributions into a hiring signal. ",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    progress: 64,
    contributors: [
      { id: 1, name: "Sonu Kumar" },
      { id: 2, name: "Priya Sharma" },
      { id: 3, name: "Aarav Singh" },
      { id: 4, name: "Meera Nair" },
      { id: 5, name: "Rahul Verma" },
    ],
    techStack: ["React", "Node.js", "MongoDB", "GitHub API"],
    openRoles: ["Backend", "UI Engineer", "Mentor Reviewer"],
    difficulty: "Intermediate",
    timeline: "4 weeks",
    mentorStatus: "Corporate mentor requested",
    github: "https://github.com/",
    demo: "https://example.com/",
    tags: ["ProofOfWork", "Hiring", "StudentBuilders"],
    tasks: [
      {
        id: 1,
        title: "Connect GitHub OAuth and repo sync",
        owner: "Aarav Singh",
        status: "Done",
      },
      {
        id: 2,
        title: "Design contribution timeline UI",
        owner: "Meera Nair",
        status: "In progress",
      },
      {
        id: 3,
        title: "Define mentor review checklist",
        owner: "Priya Sharma",
        status: "Open",
      },
    ],
    milestones: [
      { id: 1, title: "GitHub import MVP", status: "Done" },
      { id: 2, title: "Proof profile dashboard", status: "In progress" },
      { id: 3, title: "Mentor verification flow", status: "Next" },
    ],
    discussions: [
      {
        id: 1,
        author: "Priya Sharma",
        role: "Product Mentor",
        message:
          "Start with GitHub import and manual project verification before adding scoring. Start with GitHub import and manual project verification before adding scoring.",
      },
      {
        id: 2,
        author: "Rahul Verma",
        role: "Backend Contributor",
        message:
          "I can build the contribution API if someone owns the profile timeline UI.",
      },
    ],
  },
  {
    id: 2,
    user: {
      name: "Neha Kapoor",
      bio: "SDE-II | Mentor",
      avatar: "https://i.pravatar.cc/100?img=32",
    },
    time: "3h ago",
    title: "Open Source Issue Triage Room",
    problem:
      "New contributors struggle to find beginner-friendly issues with enough context.",
    solution:
      "Match students with scoped issues, review plans, and mentor feedback before PR submission.",
    image:
      "https://images.unsplash.com/photo-1556075798-4825dfaaf498?auto=format&fit=crop&w=1200&q=80",
    progress: 38,
    contributors: [
      { id: 1, name: "Neha Kapoor" },
      { id: 2, name: "Ishan Rao" },
      { id: 3, name: "Fatima Khan" },
    ],
    techStack: ["Next.js", "PostgreSQL", "Prisma", "GitHub Webhooks"],
    openRoles: ["Frontend", "DevOps", "Student Contributor"],
    difficulty: "Beginner friendly",
    timeline: "6 weeks",
    mentorStatus: "Mentor active",
    github: "https://github.com/",
    demo: "https://example.com/",
    tags: ["OpenSource", "Mentorship", "PRReview"],
    tasks: [
      {
        id: 1,
        title: "Create issue label taxonomy",
        owner: "Ishan Rao",
        status: "In progress",
      },
      {
        id: 2,
        title: "Build claim request form",
        owner: "Fatima Khan",
        status: "Open",
      },
      {
        id: 3,
        title: "Add mentor approval state",
        owner: "Neha Kapoor",
        status: "Open",
      },
    ],
    milestones: [
      { id: 1, title: "Issue discovery board", status: "Done" },
      { id: 2, title: "Claim and review workflow", status: "In progress" },
      { id: 3, title: "GitHub webhook automation", status: "Next" },
    ],
    discussions: [
      {
        id: 1,
        author: "Ishan Rao",
        role: "Student Contributor",
        message:
          "Can we add issue labels for docs-only, API, frontend, and test coverage?",
      },
      {
        id: 2,
        author: "Neha Kapoor",
        role: "Corporate Mentor",
        message:
          "Yes. Also add a required approach note before anyone claims an issue.",
      },
    ],
  },
];
