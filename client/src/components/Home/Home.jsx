import React from "react";
import PostCard from "../Post/PostCard";
import { posts } from "../../data/posts";
import ProjectCard from "../Project/ProjectCard";
import { projects } from "../../data/projects";

const Home = () => {
  return (
    <div className="min-h-screen p-4 scroll-smooth text-slate-900 dark:text-slate-100">
      <h1 className="mb-4 text-xl font-bold">Meetogether Feed</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0 max-w-5xl mx-auto">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
        {projects.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </div>
  );
};

export default Home;
