export const proofProfile = {
  name: "Sonu Kumar",
  username: "sonu",
  title: "Student builder · MERN learner · community collaborator",
  headline: "Student builder · MERN learner · proof-of-work collaborator",
  bio: "Building MeeTogether as a proof-of-work network for students and early engineers.",
  summary:
    "Building MeeTogether as a proof-of-work network where students and early engineers can show shipped projects, verified skills, mentor reviews, and collaboration history.",
  location: "Gopalganj, Bihar",
  avatar: "/sonuPi.jpeg",
  proofScore: 842,
  builderLevel: "Level 7 Builder",
  rank: "Top 8% in student builders",
  shippedProjects: 4,
  completedTasks: 31,
  verifiedSkills: 9,
  mentorReviews: 6,
  openTo: ["Collaboration", "Mentorship", "Internship", "Hiring"],
  links: [
    { label: "GitHub", value: "github.com/Sonukr2006", iconKey: "code" },
    { label: "Live demos", value: "meetogether.dev/sonu", iconKey: "external" },
  ],
  resumeLinks: [
    "github.com/Sonukr2006",
    "meetogether.dev/sonu",
    "meetogether.dev/profile/sonu",
  ],
  actions: [
    {
      label: "Invite to Project",
      intent: "collaboration",
      iconKey: "user-plus",
      primary: true,
      description: "Send Sonu a project invite with role, stack, and expected contribution.",
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
  ],
  trustSignals: [
    {
      label: "Identity checked",
      detail: "Student builder profile verified",
      iconKey: "shield",
    },
    {
      label: "Work evidence",
      detail: "3 shipped artifacts linked",
      iconKey: "rocket",
    },
    {
      label: "Review quality",
      detail: "6 mentor reviews with ratings",
      iconKey: "star",
    },
    {
      label: "Response fit",
      detail: "Open to 4 opportunity types",
      iconKey: "handshake",
    },
  ],
  stats: [
    { label: "Proof Score", value: "842", iconKey: "shield" },
    { label: "Shipped Projects", value: "4", iconKey: "rocket" },
    { label: "Completed Tasks", value: "31", iconKey: "check-circle" },
    { label: "Mentor Reviews", value: "6", iconKey: "review" },
  ],
  projects: [
    {
      name: "MeeTogether",
      status: "Live build",
      proof: "Designed feed, project room, contribution flow, and proof profile.",
      resumeProof:
        "Designed the core proof-of-work loop across feed, project room, profile, requests, and resume views.",
      stack: ["React", "Redux", "Tailwind", "Vite"],
      score: "+286",
      impact: "+286 proof points",
    },
    {
      name: "Project Room",
      status: "Shipped",
      proof: "Added role cards, task context, mentor notes, and collaboration surface.",
      resumeProof:
        "Created a collaboration workspace for roles, task context, mentor notes, and contribution visibility.",
      stack: ["React Router", "State", "UI"],
      resumeStack: ["React Router", "State", "UI systems"],
      score: "+174",
      impact: "+174 proof points",
    },
    {
      name: "Build Feed",
      status: "Shipped",
      proof: "Converted static posts into proof-of-work discovery with project cards.",
      resumeProof:
        "Converted static posts into proof-of-work discovery with filters, project cards, and build updates.",
      stack: ["Components", "Data model", "UX"],
      resumeStack: ["Components", "Data modeling", "Product UX"],
      score: "+141",
      impact: "+141 proof points",
    },
  ],
  tasks: [
    "Connected profile route with builder identity",
    "Built proof-of-work feed filters",
    "Created project room dashboard",
    "Added mentor review and open role signals",
    "Modeled dummy posts and projects data",
  ],
  skills: [
    { name: "React components", evidence: "12 shipped UI pieces", level: 92 },
    { name: "Product thinking", evidence: "3 core MeeTogether loops", level: 86 },
    { name: "Collaboration UX", evidence: "Project room workflows", level: 82 },
    { name: "Data modeling", evidence: "Posts, projects, proof data", level: 78 },
    { name: "Tailwind CSS", evidence: "Responsive app screens", level: 84 },
    { name: "GitHub workflow", evidence: "Linked build artifacts", level: 74 },
  ],
  reviews: [
    {
      mentor: "Ananya Sharma",
      role: "Frontend mentor",
      text: "Sonu turns rough platform ideas into usable screens quickly and keeps the user journey visible.",
      rating: 5,
    },
    {
      mentor: "Rahul Verma",
      role: "Open-source reviewer",
      text: "Strong proof mindset. The project room work shows ownership beyond just UI polish.",
      rating: 5,
    },
  ],
  timeline: [
    {
      date: "Today",
      title: "Proof Profile dashboard",
      detail: "Mapped shipped work, verified skills, mentor reviews, and hiring signals.",
    },
    {
      date: "Yesterday",
      title: "Project Room shipped",
      detail: "Added collaboration context for roles, tasks, and mentor notes.",
    },
    {
      date: "This week",
      title: "Build Feed upgraded",
      detail: "Made work discovery stronger with project cards and proof filters.",
    },
    {
      date: "Earlier",
      title: "MeeTogether foundation",
      detail: "Set up auth screens, navigation, theme support, and core app shell.",
    },
  ],
};

export const initialOpportunityRequests = [
  {
    id: 1,
    type: "Project",
    title: "Invite to build StudySprint dashboard",
    from: "Aarav Mehta",
    role: "Project owner",
    time: "12 min ago",
    status: "New",
    iconKey: "project",
    unread: true,
    message:
      "We need a React builder for a student productivity dashboard. Your MeeTogether project room work matches the collaboration flow we need.",
    proof: ["React components", "Project Room shipped", "Collaboration UX"],
  },
  {
    id: 2,
    type: "Mentor",
    title: "Mentor review request for build feed",
    from: "Neha Singh",
    role: "Frontend mentor",
    time: "38 min ago",
    status: "Waiting",
    iconKey: "mentor",
    unread: true,
    message:
      "Can you review my build-feed implementation and point out where the proof signal can be stronger?",
    proof: ["Build Feed upgraded", "Product thinking", "Mentor review history"],
  },
  {
    id: 3,
    type: "Internship",
    title: "Frontend internship conversation",
    from: "StackPilot Labs",
    role: "Hiring team",
    time: "2 hr ago",
    status: "High intent",
    iconKey: "internship",
    unread: true,
    message:
      "Your proof profile shows consistent shipping. We would like to discuss a frontend internship focused on internal tools.",
    proof: ["Proof Score 842", "4 shipped projects", "GitHub workflow"],
  },
  {
    id: 4,
    type: "Message",
    title: "Collaboration message",
    from: "Riya Verma",
    role: "Student builder",
    time: "Yesterday",
    status: "Reply",
    iconKey: "message",
    unread: false,
    message:
      "I am building a mentor matching flow. Want to collaborate on proof-based profiles and task evidence?",
    proof: ["Open to collaboration", "Verified skills", "MeeTogether foundation"],
  },
  {
    id: 5,
    type: "Resume",
    title: "Proof resume downloaded",
    from: "Campus Hiring Board",
    role: "Recruiter view",
    time: "Yesterday",
    status: "Viewed",
    iconKey: "resume",
    unread: false,
    message:
      "Your proof resume was downloaded with projects, verified skills, mentor reviews, and demo links.",
    proof: ["Proof resume", "Demo links", "Mentor reviews"],
  },
];

export const actionRequestTemplates = {
  collaboration: {
    type: "Project",
    title: "Project invite sent from Proof Profile",
    from: "You",
    role: "Builder outreach",
    status: "Sent",
    iconKey: "project",
    message:
      "A project invite was created with Sonu's shipped work, verified skills, and project evidence attached.",
  },
  mentorship: {
    type: "Mentor",
    title: "Mentor review request created",
    from: "You",
    role: "Mentor workflow",
    status: "Sent",
    iconKey: "mentor",
    message:
      "A mentor review request was attached to the latest shipped work and sent with proof context.",
  },
  internship: {
    type: "Internship",
    title: "Internship offer drafted",
    from: "You",
    role: "Hiring outreach",
    status: "Sent",
    iconKey: "internship",
    message:
      "An internship opportunity was created from Sonu's proof score, projects, and verified skills.",
  },
  conversation: {
    type: "Message",
    title: "Collaboration message started",
    from: "You",
    role: "Direct message",
    status: "Sent",
    iconKey: "message",
    message:
      "A conversation was opened with Sonu's proof profile context attached.",
  },
};

export const requestProofPackage = [
  "MeeTogether project evidence",
  "Verified skills",
  "Mentor reviews",
];
