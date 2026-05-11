export const profileActionTemplates = [
  {
    label: "Invite to Project",
    intent: "collaboration",
    iconKey: "user-plus",
    primary: true,
    description: "Send a project invite with role, stack, and expected contribution.",
  },
  {
    label: "Request Mentor Review",
    intent: "mentorship",
    iconKey: "graduation-cap",
    description: "Ask for a mentor-backed review on recent shipped work.",
  },
  {
    label: "Offer Internship",
    intent: "internship",
    iconKey: "briefcase",
    description: "Start an internship conversation based on verified proof signals.",
  },
  {
    label: "Message",
    intent: "conversation",
    iconKey: "message-circle",
    description: "Open a direct conversation about collaboration or hiring.",
  },
  {
    label: "Download Proof Resume",
    intent: "resume",
    iconKey: "download",
    actionLabel: "Open resume",
    description: "Generate a proof resume with projects, skills, reviews, and links.",
  },
];

export const actionRequestTemplates = {
  collaboration: {
    type: "Project",
    title: "Project invitation prepared",
    from: "MeeTogether",
    role: "System",
    status: "Sent",
    iconKey: "project",
    message:
      "A builder invite was created from the profile surface. Backend delivery will attach the final collaborator and project context.",
  },
  mentorship: {
    type: "Mentor",
    title: "Mentor review request prepared",
    from: "MeeTogether",
    role: "System",
    status: "Sent",
    iconKey: "mentor",
    message:
      "A mentor review request was created from the proof profile action surface.",
  },
  internship: {
    type: "Internship",
    title: "Internship conversation started",
    from: "MeeTogether",
    role: "System",
    status: "Sent",
    iconKey: "internship",
    message:
      "An internship conversation request was prepared using the profile proof signals.",
  },
  conversation: {
    type: "Message",
    title: "Direct conversation prepared",
    from: "MeeTogether",
    role: "System",
    status: "Reply",
    iconKey: "message",
    message:
      "A conversation request was created from the proof profile surface.",
  },
  resume: {
    type: "Resume",
    title: "Proof resume access requested",
    from: "MeeTogether",
    role: "System",
    status: "Sent",
    iconKey: "resume",
    message:
      "A proof resume access event was recorded from the profile surface.",
  },
};

export const requestProofPackage = [
  "Shipped work",
  "Verified skills",
  "Builder profile",
];

export const emptyProfile = {
  name: "Builder",
  username: "builder",
  title: "Proof profile",
  headline: "Proof-of-work builder profile",
  bio: "This profile will fill in as backend data becomes available.",
  summary: "No profile summary has been added yet.",
  location: "Location not set",
  avatar: "https://i.pravatar.cc/100?img=12",
  proofScore: 0,
  builderLevel: "Level 1 Builder",
  rank: "New builder",
  shippedProjects: 0,
  completedTasks: 0,
  verifiedSkills: 0,
  mentorReviews: 0,
  openTo: [],
  links: [],
  resumeLinks: [],
  actions: profileActionTemplates,
  trustSignals: [],
  stats: [
    { label: "Proof Score", value: "0", iconKey: "shield" },
    { label: "Shipped Projects", value: "0", iconKey: "rocket" },
    { label: "Completed Tasks", value: "0", iconKey: "check-circle" },
    { label: "Mentor Reviews", value: "0", iconKey: "review" },
  ],
  projects: [],
  tasks: [],
  skills: [],
  reviews: [],
  timeline: [],
};

export const emptyProjectCard = {
  id: "",
  user: {
    name: "Unknown builder",
    bio: "Builder",
    avatar: "https://i.pravatar.cc/100?img=12",
  },
  time: "Live",
  title: "Untitled project",
  problem: "",
  solution: "",
  image: "",
  progress: 0,
  contributors: [],
  techStack: [],
  openRoles: [],
  difficulty: "Active room",
  timeline: "Open timeline",
  mentorStatus: "Mentor status not set",
  github: "https://github.com/",
  demo: "https://example.com/",
  likes: 0,
  comments: 0,
  tags: [],
  tasks: [],
  milestones: [],
  discussions: [],
};
