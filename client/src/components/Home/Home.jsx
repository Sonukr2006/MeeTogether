import { useMemo } from "react";
import PostCard from "../Post/PostCard";
import { posts } from "../../data/posts";
import ProjectCard from "../Project/ProjectCard";
import { projects } from "../../data/projects";

const Home = () => {
  const visiblePosts = useMemo(() => posts, []);
  const visibleProjects = useMemo(() => projects, []);

  return (
    <div className="min-h-screen p-4 scroll-smooth text-slate-900 dark:text-slate-100">
      <div className="mx-auto mb-5 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Proof-of-work collaboration
        </p>
        <h1 className="mt-1 text-xl font-semibold">MeeTogether Build Network</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0 max-w-5xl mx-auto">
        {visiblePosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {visibleProjects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
};

export default Home;
