import { useState } from "react";
import ContributorStack from "./ContributorStack";

export default function ProjectCard({ project }) {
  const [joined, setJoined] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 text-black dark:text-white rounded-2xl shadow-md hover:shadow-xl transition p-4 flex flex-col h-full border border-gray-800 dark:border-gray-700">
      {/* 👤 User Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={project.user.avatar}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="text-sm font-semibold">{project.user.name}</h3>
          <p className="text-xs text-gray-500">{project.user.bio}</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">{project.time}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
          🚀 Project
        </span>
      </div>

      {/* 🚀 Title */}
      <h2 className="text-lg font-bold mb-2">🚀 {project.title}</h2>

      {/* 📝 Problem */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
        <span className="font-semibold">Problem:</span> {project.problem}
      </p>

      {/* 💡 Solution */}
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        <span className="font-semibold">Solution:</span> {project.solution}
      </p>

      {/* 🖼️ Image */}
      {project.image && (
        <img
          src={project.image}
          className="w-full h-44 object-cover rounded-xl mb-3"
        />
      )}

      {/* 📊 Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span>Progress</span>
          <span>{project.progress}%</span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
          <div
            className="bg-green-500 h-2 rounded-full"
            style={{ width: `${project.progress}%` }}
          ></div>
        </div>
      </div>

      {/* 👥 Contributors */}
      <ContributorStack contributors={project.contributors} />

      {/* 🏷️ Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {project.tags.map((tag, i) => (
          <span
            key={i}
            className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* ⚡ Actions */}
      <div className="flex justify-between items-center mt-auto">
        <button
          onClick={() => setJoined(!joined)}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
            joined
              ? "bg-gray-300 dark:bg-gray-700"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {joined ? "Joined ✔" : "🤝 Join"}
        </button>

        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg">
            💬 Discuss
          </button>

          <button className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg">
            ✨ AI
          </button>
        </div>
      </div>
    </div>
  );
}
