import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import PostCard from "../Post/PostCard";
import ProjectCard from "../Project/ProjectCard";
import PageLoadingState from "../ui/PageLoadingState";
import { fetchPosts } from "../../store/postsSlice";
import { fetchProjects } from "../../store/projectsSlice";

const Home = () => {
  const dispatch = useDispatch();
  const postItems = useSelector((state) => state.posts.items);
  const postsStatus = useSelector((state) => state.posts.status);
  const projectItems = useSelector((state) => state.projects.items);
  const projectsStatus = useSelector((state) => state.projects.status);
  const feedItems = useMemo(() => {
    return [...postItems, ...projectItems].sort((left, right) => {
      const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
      const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
      return rightTime - leftTime;
    });
  }, [postItems, projectItems]);

  useEffect(() => {
    dispatch(fetchProjects());
    dispatch(fetchPosts());
  }, [dispatch]);

  const isInitialLoading =
    (projectsStatus === "loading" || postsStatus === "loading") && feedItems.length === 0;

  return (
    <div className="min-h-screen p-4 scroll-smooth text-slate-900 dark:text-slate-100">
      <div className="mx-auto mb-5 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Proof-of-work collaboration
        </p>
        <h1 className="mt-1 text-xl font-semibold">MeeTogether Build Network</h1>
      </div>

      {isInitialLoading ? (
        <PageLoadingState
          className="max-w-5xl"
          title="Loading the build feed"
          message="We’re pulling live projects and builder updates from the backend."
        />
      ) : feedItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-0 max-w-5xl mx-auto md:grid-cols-2">
          {feedItems.map((item) =>
            item.kind === "post" ? (
              <PostCard key={`post-${item.id}`} post={item} />
            ) : (
              <ProjectCard key={`project-${item.id}`} project={item} />
            ),
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">No live proof in the feed yet</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Once builders publish projects or updates through the API, they’ll show up here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
