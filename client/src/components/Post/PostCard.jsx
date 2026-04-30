import { useDispatch, useSelector } from "react-redux";
import CommentModal from "./CommentModal";
import PostActions from "./PostActions";
import {
  openComments,
  toggleLike,
  toggleSave,
} from "../../store/postInteractionsSlice";

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { activeCommentsPostId, likedPosts, savedPosts } = useSelector(
    (state) => state.postInteractions
  );

  const liked = Boolean(likedPosts[post.id]);
  const saved = Boolean(savedPosts[post.id]);
  const showComments = activeCommentsPostId === post.id;
  const likes = liked ? post.likes + 1 : post.likes;

  return (
    <>
      <div
        className={`relative rounded-2xl border border-gray-800 bg-white p-4 mb-6 shadow-md transition duration-200 dark:bg-gray-900 dark:text-white dark:border-gray-700 ${
          showComments
            ? "z-40 shadow-xl"
            : "z-0 hover:-translate-y-1 hover:shadow-xl"
        }`}
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
        <div className="relative">
          <PostActions
            comments={post.comments}
            liked={liked}
            likes={likes}
            saved={saved}
            onCommentClick={() => dispatch(openComments(post.id))}
            onLikeClick={() => dispatch(toggleLike(post.id))}
            onSaveClick={() => dispatch(toggleSave(post.id))}
          />

          {showComments && <CommentModal />}
        </div>
      </div>
    </>
  );
}
