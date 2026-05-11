import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, PlusCircle, X } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../../contexts/AlertProvider";
import {
  apiRequest,
  createUploadTarget,
  uploadFileToStorageTarget,
} from "../../lib/api";
import { mapApiPostToCard } from "../../lib/backendMappers";
import { fetchProjects } from "../../store/projectsSlice";
import { prependPostCard } from "../../store/postsSlice";

const postTypes = [
  "Professional Update",
  "Build Log",
  "Help Needed",
  "Mentor Review",
  "Launch",
];
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const initialForm = {
  type: "Professional Update",
  title: "",
  description: "",
  linkLabelInput: "",
  linkUrlInput: "",
  links: [],
  tagInput: "",
  tags: [],
  projectId: "",
};

export default function CreatePostPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const projectItems = useSelector((state) => state.projects.items);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreviewUrl, setPostImagePreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      if (postImagePreviewUrl) {
        URL.revokeObjectURL(postImagePreviewUrl);
      }
    };
  }, [postImagePreviewUrl]);

  const canSubmit = useMemo(
    () =>
      form.title.trim().length >= 3 &&
      form.description.trim().length >= 20 &&
      !submitting &&
      !uploadingImage,
    [form, submitting, uploadingImage],
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

  const addTagValues = () => {
    const values = form.tagInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (values.length === 0) {
      return;
    }

    setForm((current) => {
      const existing = new Set(current.tags.map((item) => item.toLowerCase()));
      const merged = [...current.tags];

      values.forEach((value) => {
        if (!existing.has(value.toLowerCase())) {
          merged.push(value);
          existing.add(value.toLowerCase());
        }
      });

      return {
        ...current,
        tags: merged,
        tagInput: "",
      };
    });
  };

  const addLinkValue = () => {
    const label = form.linkLabelInput.trim();
    const url = form.linkUrlInput.trim();

    if (!label || !url) {
      setErrors((current) => ({
        ...current,
        links: "Add both a link name and a valid URL.",
      }));
      return;
    }

    try {
      new URL(url);
    } catch {
      setErrors((current) => ({
        ...current,
        links: "Use a valid URL for the link.",
      }));
      return;
    }

    setForm((current) => ({
      ...current,
      links: [...current.links, { label, url }],
      linkLabelInput: "",
      linkUrlInput: "",
    }));
    setErrors((current) => ({
      ...current,
      links: undefined,
    }));
  };

  const removeTagValue = (valueToRemove) => {
    setForm((current) => ({
      ...current,
      tags: current.tags.filter((value) => value !== valueToRemove),
    }));
  };

  const removeLinkValue = (indexToRemove) => {
    setForm((current) => ({
      ...current,
      links: current.links.filter((_, index) => index !== indexToRemove),
    }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (form.title.trim().length < 3) {
      nextErrors.title = "Post title should be at least 3 characters.";
    }

    if (form.description.trim().length < 20) {
      nextErrors.description = "Post description should be at least 20 characters.";
    }

    if (postImageFile && !ALLOWED_IMAGE_TYPES.includes(postImageFile.type)) {
      nextErrors.image = "Use a JPG, PNG, or WebP image.";
    }

    if (postImageFile && postImageFile.size > MAX_IMAGE_SIZE_BYTES) {
      nextErrors.image = "Post image must be 8 MB or smaller.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    setErrors((current) => ({
      ...current,
      image: undefined,
    }));

    if (postImagePreviewUrl) {
      URL.revokeObjectURL(postImagePreviewUrl);
    }

    if (!file) {
      setPostImageFile(null);
      setPostImagePreviewUrl("");
      return;
    }

    setPostImageFile(file);
    setPostImagePreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    if (postImagePreviewUrl) {
      URL.revokeObjectURL(postImagePreviewUrl);
    }

    setPostImageFile(null);
    setPostImagePreviewUrl("");
    setErrors((current) => ({
      ...current,
      image: undefined,
    }));
  };

  const uploadImageIfNeeded = async () => {
    if (!postImageFile) {
      return null;
    }

    setUploadingImage(true);

    try {
      const target = await createUploadTarget({
        entityType: "post_image",
        fileName: postImageFile.name,
        contentType: postImageFile.type,
        fileSizeBytes: postImageFile.size,
      });

      await uploadFileToStorageTarget(target, postImageFile);
      return target.cdnUrl;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      showAlert("Please tighten the required post details.", "error");
      return;
    }

    setSubmitting(true);

    try {
      const imageUrl = await uploadImageIfNeeded();
      const created = await apiRequest("/posts", {
        method: "POST",
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim(),
          imageUrl: imageUrl || undefined,
          projectId: form.projectId || undefined,
          links: form.links,
          tags: form.tags,
        }),
      });

      dispatch(prependPostCard(mapApiPostToCard(created)));
      showAlert("Post published successfully.", "success");
      navigate("/");
    } catch (error) {
      showAlert(error.message || "Post creation failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Publish an update
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal">Create Post</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
          Share a build log, ask for help, request mentor review, or announce a launch from real project work.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Post type</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {postTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField("type", type)}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  form.type === type
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Content</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Title</label>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="e.g. OAuth flow shipped for mentor review"
              />
              {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={6}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Describe what changed, what you need, or what you want others to review."
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {form.description.trim().length} / 20+ characters minimum
              </p>
              {errors.description ? (
                <p className="mt-1 text-xs text-rose-600">{errors.description}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Project and media</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Linked project</label>
              <select
                value={form.projectId}
                onChange={(event) => updateField("projectId", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">No linked project</option>
                {projectItems.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Post image</label>
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                {postImagePreviewUrl ? (
                  <div className="space-y-3">
                    <img
                      src={postImagePreviewUrl}
                      alt="Post preview"
                      className="h-56 w-full rounded-md object-cover"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                        <ImagePlus size={16} />
                        Replace image
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-md p-6 text-center text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    <ImagePlus size={22} />
                    <span>Add an image if the update needs context or proof.</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      JPG, PNG, or WebP up to 8 MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              {errors.image ? <p className="mt-1 text-xs text-rose-600">{errors.image}</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Tags</h2>
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <input
                value={form.tagInput}
                onChange={(event) => updateField("tagInput", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="oauth, mobile polish, feedback wanted"
              />
              <button
                type="button"
                onClick={addTagValues}
                className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <PlusCircle size={16} />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {item}
                  <button type="button" onClick={() => removeTagValue(item)}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)_auto]">
              <input
                value={form.linkLabelInput}
                onChange={(event) => updateField("linkLabelInput", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="Link name e.g. Live Demo"
              />
              <input
                value={form.linkUrlInput}
                onChange={(event) => updateField("linkUrlInput", event.target.value)}
                className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950"
                placeholder="https://..."
              />
              <button
                type="button"
                onClick={addLinkValue}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <PlusCircle size={16} />
                Add
              </button>
            </div>
            {errors.links ? (
              <p className="text-xs text-rose-600">{errors.links}</p>
            ) : null}
            <div className="flex flex-col gap-2">
              {form.links.map((link, index) => (
                <div
                  key={`${link.label}-${link.url}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                      {link.label}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {link.url}
                    </p>
                  </div>
                  <button type="button" onClick={() => removeLinkValue(index)}>
                    <X size={14} />
                  </button>
                </div>
              ))}
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
                {uploadingImage ? "Uploading image..." : "Publishing..."}
              </>
            ) : (
              "Publish Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
