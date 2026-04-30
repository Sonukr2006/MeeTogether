import { useState } from "react";

export default function PostCard({ post }) {
  const [likes, setLikes] = useState(post.likes);

  return (
    <div
      className="bg-white dark:bg-gray-900 dark:text-white rounded-2xl shadow-md p-4 mb-6   hover:shadow-xl dark:border-gray-700
border border-gray-800 hover:-translate-y-1  transition duration-200"
    >
      {/* 👤 User Info */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={post.user.avatar}
          alt="dp"
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <h3 className="font-semibold text-sm">{post.user.name}</h3>
          <p className="text-xs text-gray-500">{post.user.bio}</p>
        </div>
        <span className="ml-auto text-xs text-gray-400">{post.time}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
          💡 Idea
        </span>
      </div>

      {/* 💡 Title */}
      <h2 className="text-xl font-semibold mb-2">💡 {post.title}</h2>

      {/* 📝 Description */}
      <p className="text-gray-400 text-sm mb-3 line-clamp-3">
        {post.description}
      </p>

      {/* 🖼️ Image */}
      {post.image && (
        <img
          src={post.image}
          alt="post"
          className="w-full h-56 object-cover rounded-xl mb-3"
        />
      )}

      {/* 🏷️ Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags.map((tag, i) => (
          <span
            key={i}
            className="text-xs bg-gray-100 px-2 py-1 rounded-full dark:bg-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* ⚡ Actions */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <button
            onClick={() => setLikes(likes + 1)}
            className="hover:text-blue-500"
          >
            👍 {likes}
          </button>

          <button className="hover:text-blue-500">💬 {post.comments}</button>
        </div>

        <div className="flex gap-2">
          <button className="px-3 py-1 text-xs bg-purple-100 text-purple-600 rounded-lg">
            ✨ AI
          </button>

          <button className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg">
            🚀 Start
          </button>
        </div>
      </div>
    </div>
  );
}
