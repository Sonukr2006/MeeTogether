import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import ProjectCard from "../Project/ProjectCard";
import { fetchProjects } from "../../store/projectsSlice";

const Home = () => {
  const dispatch = useDispatch();
  const projectItems = useSelector((state) => state.projects.items);
  const visibleProjects = useMemo(() => projectItems, [projectItems]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  return (
    <div className="min-h-screen p-4 scroll-smooth text-slate-900 dark:text-slate-100">
      <div className="mx-auto mb-5 max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Proof-of-work collaboration
        </p>
        <h1 className="mt-1 text-xl font-semibold">MeeTogether Build Network</h1>
      </div>

      {visibleProjects.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-4 gap-y-0 max-w-5xl mx-auto md:grid-cols-2">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">No live build rooms yet</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            The feed is now backend-first. Once projects are created in the API, they will show up here.
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
