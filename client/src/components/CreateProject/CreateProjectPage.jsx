import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, PlusCircle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAlert } from "../../contexts/AlertProvider";
import { apiRequest, createUploadTarget, uploadFileToStorageTarget } from "../../lib/api";
import { mapApiProjectToCard } from "../../lib/backendMappers";
import { upsertProjectCard } from "../../store/projectsSlice";

const initialForm = {
  title: "",
  problemStatement: "",
  solutionApproach: "",
  techInput: "",
  techStack: [],
  difficulty: "",
  timeline: "",
  mentorStatus: "",
  roleInput: "",
  openRoles: [],
  githubUrl: "",
  demoUrl: "",
  visibility: "public",
};

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const CreateProjectPage = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showAlert } = useAlert();

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const canSubmit = useMemo(
    () =>
      form.title.trim().length >= 3 &&
      form.problemStatement.trim().length >= 80 &&
      form.solutionApproach.trim().length >= 80 &&
      !submitting &&
      !uploadingCover,
    [form, submitting, uploadingCover],
  );

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  };

  const addChipValues = (field, inputField) => {
    const raw = form[inputField];
    const values = raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (values.length === 0) {
      return;
    }

    setForm((current) => {
      const existing = new Set(current[field].map((item) => item.toLowerCase()));
      const merged = [...current[field]];

      values.forEach((value) => {
        if (!existing.has(value.toLowerCase())) {
          merged.push(value);
          existing.add(value.toLowerCase());
        }
      });

      return {
        ...current,
        [field]: merged,
        [inputField]: "",
      };
    });
  };

  const removeChipValue = (field, valueToRemove) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].filter((value) => value !== valueToRemove),
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (form.title.trim().length < 3) {
      nextErrors.title = "Project title should be at least 3 characters.";
    }

    if (form.problemStatement.trim().length < 80) {
      nextErrors.problemStatement = "Problem statement should be at least 80 characters.";
    }

    if (form.solutionApproach.trim().length < 80) {
      nextErrors.solutionApproach = "Solution approach should be at least 80 characters.";
    }

    if (coverFile && !ALLOWED_IMAGE_TYPES.includes(coverFile.type)) {
      nextErrors.coverImage = "Use a JPG, PNG, or WebP image.";
    }

    if (coverFile && coverFile.size > MAX_IMAGE_SIZE_BYTES) {
      nextErrors.coverImage = "Cover image must be 8 MB or smaller.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCoverFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    setErrors((current) => ({
      ...current,
      coverImage: undefined,
    }));

    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    if (!file) {
      setCoverFile(null);
      setCoverPreviewUrl("");
      return;
    }

    setCoverFile(file);
    setCoverPreviewUrl(URL.createObjectURL(file));
  };

  const clearCoverFile = () => {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    setCoverFile(null);
    setCoverPreviewUrl("");
    setErrors((current) => ({
      ...current,
      coverImage: undefined,
    }));
  };

  const uploadCoverIfNeeded = async () => {
    if (!coverFile) {
      return null;
    }

    setUploadingCover(true);

    try {
      const target = await createUploadTarget({
        entityType: "project_cover",
        fileName: coverFile.name,
        contentType: coverFile.type,
        fileSizeBytes: coverFile.size,
      });

      await uploadFileToStorageTarget(target, coverFile);
      return target.cdnUrl;
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showAlert("Please tighten the required project details.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrl = await uploadCoverIfNeeded();
      const created = await apiRequest("/projects", {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          problemStatement: form.problemStatement.trim(),
          solutionApproach: form.solutionApproach.trim(),
          imageUrl: imageUrl || undefined,
          techStack: form.techStack,
          difficulty: form.difficulty.trim() || undefined,
          timeline: form.timeline.trim() || undefined,
          mentorStatus: form.mentorStatus.trim() || undefined,
          openRoles: form.openRoles,
          githubUrl: form.githubUrl.trim() || undefined,
          demoUrl: form.demoUrl.trim() || undefined,
          visibility: form.visibility,
        }),
      });

      if (created.project) {
        dispatch(upsertProjectCard(mapApiProjectToCard(created.project)));
      }
      showAlert("Project created successfully.", "success");
      navigate(`/projects/${created.id}`);
    } catch (error) {
      showAlert(error.message || "Project creation failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Start a build space
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Create Project</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Set up the project context clearly so collaborators understand the problem, the solution approach, and where they can help.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Core context</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Project cover image</label>
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                {coverPreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={coverPreviewUrl}
                      alt="Project cover preview"
                      className="h-48 w-full rounded-md object-cover"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                        <ImagePlus size={16} />
                        Replace image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleCoverFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearCoverFile}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md p-6 text-center text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    <ImagePlus size={22} />
                    <span>Add a project cover so the card feels real in the feed.</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      JPG, PNG, or WebP up to 8 MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleCoverFileChange}
                    />
                  </label>
                )}
              </div>
              {errors.coverImage ? (
                <p className="mt-1 text-xs text-rose-600">{errors.coverImage}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Project title</label>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. Campus Skill Graph"
              />
              {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Problem statement</label>
              <textarea
                value={form.problemStatement}
                onChange={(event) => updateField("problemStatement", event.target.value)}
                rows={5}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Describe who faces the problem, what the pain is, and why it matters."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {form.problemStatement.trim().length} / 80+ characters recommended minimum
              </p>
              {errors.problemStatement ? (
                <p className="mt-1 text-xs text-rose-600">{errors.problemStatement}</p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Solution approach</label>
              <textarea
                value={form.solutionApproach}
                onChange={(event) => updateField("solutionApproach", event.target.value)}
                rows={5}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Explain what you are building and how it addresses the problem."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {form.solutionApproach.trim().length} / 80+ characters recommended minimum
              </p>
              {errors.solutionApproach ? (
                <p className="mt-1 text-xs text-rose-600">{errors.solutionApproach}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Build metadata</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">Difficulty</label>
              <input
                value={form.difficulty}
                onChange={(event) => updateField("difficulty", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. Intermediate"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Timeline</label>
              <input
                value={form.timeline}
                onChange={(event) => updateField("timeline", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. 4 weeks"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Mentor status</label>
              <input
                value={form.mentorStatus}
                onChange={(event) => updateField("mentorStatus", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. Looking for mentor review"
              />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Stack and roles</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Tech stack</label>
              <div className="flex gap-2">
                <input
                  value={form.techInput}
                  onChange={(event) => updateField("techInput", event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="React, PostgreSQL, Prisma"
                />
                <button
                  type="button"
                  onClick={() => addChipValues("techStack", "techInput")}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <PlusCircle size={16} />
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.techStack.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                  >
                    {item}
                    <button type="button" onClick={() => removeChipValue("techStack", item)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Open roles</label>
              <div className="flex gap-2">
                <input
                  value={form.roleInput}
                  onChange={(event) => updateField("roleInput", event.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="Backend, UI Engineer, Mentor Reviewer"
                />
                <button
                  type="button"
                  onClick={() => addChipValues("openRoles", "roleInput")}
                  className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <PlusCircle size={16} />
                  Add
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {form.openRoles.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                  >
                    {item}
                    <button type="button" onClick={() => removeChipValue("openRoles", item)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium">GitHub URL</label>
              <input
                value={form.githubUrl}
                onChange={(event) => updateField("githubUrl", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Demo URL</label>
              <input
                value={form.demoUrl}
                onChange={(event) => updateField("demoUrl", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://..."
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {uploadingCover ? "Uploading image..." : "Creating..."}
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
