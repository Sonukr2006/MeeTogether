import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Award,
  Camera,
  BookmarkCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Code2,
  Download,
  ExternalLink,
  GitPullRequest,
  GraduationCap,
  Handshake,
  MessageCircle,
  MessageSquareQuote,
  Pencil,
  Rocket,
  Send,
  ShieldCheck,
  Star,
  UserPlus,
  X,
} from "lucide-react";
import { emptyProfile } from "../../lib/uiDefaults";
import { mapApiProfileToUi } from "../../lib/backendMappers";
import { useAlert } from "../../contexts/AlertProvider";
import {
  apiRequest,
  createUploadTarget,
  uploadFileToStorageTarget,
} from "../../lib/api";
import { addRequestFromProfileAction } from "../../store/opportunityRequestsSlice";
import {
  mergeCurrentUser,
  updateCurrentUserAvatar,
} from "../../store/authSlice";
import {
  fetchProfileByUsername,
  updateCachedProfile,
  updateCachedProfileAvatar,
} from "../../store/profilesSlice";
import { hydrateSavedProjects } from "../../store/projectInteractionsSlice";

const profileIconMap = {
  briefcase: BriefcaseBusiness,
  "check-circle": CheckCircle2,
  code: Code2,
  download: Download,
  external: ExternalLink,
  "graduation-cap": GraduationCap,
  handshake: Handshake,
  "message-circle": MessageCircle,
  review: MessageSquareQuote,
  rocket: Rocket,
  shield: ShieldCheck,
  star: Star,
  "user-plus": UserPlus,
};

const emptyProfileForm = {
  name: "",
  title: "",
  bio: "",
  location: "",
  openTo: "",
  headline: "",
  summary: "",
  links: "",
  skills: "",
  trustSignals: "",
};

function serializeLines(items, formatter) {
  return (items ?? []).map(formatter).join("\n");
}

function parsePipeLines(value, mapper) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => mapper(line.split("|").map((part) => part.trim())))
    .filter(Boolean);
}

function inferLinkLabel(value) {
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    const host = url.hostname.replace(/^www\./, "");
    const [name] = host.split(".");
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "Link";
  } catch {
    return "Link";
  }
}

function normalizeExternalUrl(value) {
  if (!value) {
    return "#";
  }

  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

function parseProfileLinks(value) {
  return parsePipeLines(value, ([first, second, iconKey]) => {
    if (first && second) {
      return {
        label: first,
        value: second,
        iconKey: iconKey || "external",
      };
    }

    if (first) {
      return {
        label: inferLinkLabel(first),
        value: first,
        iconKey: "external",
      };
    }

    return null;
  });
}

function parseProfileSkills(value) {
  const hasStructuredLines = value
    .split("\n")
    .some((line) => line.includes("|"));

  if (!hasStructuredLines) {
    return value
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((name) => ({ name }));
  }

  return parsePipeLines(value, ([name, evidence, level]) =>
    name
      ? {
          name,
          evidence,
          level:
            level && Number.isFinite(Number(level)) ? Number(level) : undefined,
        }
      : null,
  );
}

const Profile = () => {
  const { userId } = useParams();
  const [activeAction, setActiveAction] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(emptyProfileForm);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const currentUser = useSelector((state) => state.auth.currentUser);
  const profileEntry = useSelector((state) =>
    userId ? state.profiles.byUsername[userId] : null,
  );
  const profileData = useMemo(
    () =>
      profileEntry?.profile ?? {
        ...emptyProfile,
        username: userId ?? emptyProfile.username,
      },
    [profileEntry?.profile, userId],
  );
  const savedProjectList = useMemo(
    () => profileData.savedProjects ?? [],
    [profileData.savedProjects],
  );
  const ownedProjects = profileData.projects ?? [];
  const isOwnProfile = currentUser?.username === profileData.username;

  useEffect(() => {
    if (userId) {
      dispatch(fetchProfileByUsername(userId));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (isOwnProfile) {
      dispatch(
        hydrateSavedProjects(savedProjectList.map((project) => project.id)),
      );
    }
  }, [dispatch, isOwnProfile, savedProjectList]);

  const openEditProfile = () => {
    setProfileForm({
      name: profileData.name ?? "",
      title: profileData.title ?? "",
      bio: profileData.bio ?? "",
      location: profileData.location ?? "",
      openTo: (profileData.openTo ?? []).join(", "),
      headline: profileData.headline ?? "",
      summary: profileData.summary ?? "",
      links: serializeLines(
        profileData.links,
        (link) =>
          `${link.label ?? ""} | ${link.value ?? ""} | ${link.iconKey ?? ""}`,
      ),
      skills: serializeLines(
        profileData.skills,
        (skill) =>
          `${skill.name ?? ""} | ${skill.evidence ?? ""} | ${skill.level ?? ""}`,
      ),
      trustSignals: serializeLines(
        profileData.trustSignals,
        (signal) =>
          `${signal.label ?? ""} | ${signal.detail ?? ""} | ${signal.iconKey ?? ""}`,
      ),
    });
    setIsEditOpen(true);
  };

  if (profileEntry?.status === "loading" && !profileEntry?.profile) {
    return (
      <div className="mx-auto max-w-6xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading proof profile...
        </p>
      </div>
    );
  }

  const closeAction = () => setActiveAction(null);
  const ActiveActionIcon = activeAction
    ? profileIconMap[activeAction.iconKey] || ShieldCheck
    : null;

  const handleActionContinue = () => {
    if (activeAction?.intent === "resume") {
      navigate(`/resume/${profileData.username}`);
      return;
    }

    dispatch(addRequestFromProfileAction({ intent: activeAction.intent }));
    navigate("/requests");
  };

  const handleAvatarFileChange = async (event) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      showAlert("Use a JPG, PNG, or WebP image.", "error");
      event.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showAlert("Avatar image must be 8 MB or smaller.", "error");
      event.target.value = "";
      return;
    }

    setUploadingAvatar(true);

    try {
      const target = await createUploadTarget({
        entityType: "avatar",
        fileName: file.name,
        contentType: file.type,
        fileSizeBytes: file.size,
      });

      await uploadFileToStorageTarget(target, file);
      const updatedUser = await apiRequest("/users/me/avatar", {
        method: "PATCH",
        body: JSON.stringify({
          avatar: target.cdnUrl,
        }),
      });

      dispatch(updateCurrentUserAvatar(updatedUser.avatar));
      dispatch(
        updateCachedProfileAvatar({
          username: updatedUser.username,
          avatar: updatedUser.avatar,
        }),
      );
      showAlert("Profile photo updated.", "success");
    } catch (error) {
      showAlert(error.message || "Avatar upload failed.", "error");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const handleProfileFieldChange = (field, value) => {
    setProfileForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);

    try {
      await apiRequest("/profiles/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: profileForm.name,
          title: profileForm.title,
          bio: profileForm.bio,
          location: profileForm.location,
          openTo: profileForm.openTo
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });

      const updatedProfileResponse = await apiRequest("/profiles/me/proof", {
        method: "PATCH",
        body: JSON.stringify({
          headline: profileForm.headline,
          summary: profileForm.summary,
          links: parseProfileLinks(profileForm.links),
          skills: parseProfileSkills(profileForm.skills),
          trustSignals: parsePipeLines(
            profileForm.trustSignals,
            ([label, detail, iconKey]) =>
              label && detail
                ? {
                    label,
                    detail,
                    iconKey: iconKey || "shield",
                  }
                : null,
          ),
        }),
      });

      const updatedProfile = mapApiProfileToUi(
        updatedProfileResponse,
        profileData.username,
      );

      dispatch(
        updateCachedProfile({
          username: updatedProfile.username,
          profile: updatedProfile,
        }),
      );
      dispatch(
        mergeCurrentUser({
          name: updatedProfile.name,
          title: updatedProfile.title,
          bio: updatedProfile.bio,
          location: updatedProfile.location,
          openTo: updatedProfile.openTo,
        }),
      );
      setIsEditOpen(false);
      showAlert("Profile updated.", "success");
    } catch (error) {
      showAlert(error.message || "Profile update failed.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="group relative h-28 w-28 shrink-0">
                <img
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="h-28 w-28 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
                {isOwnProfile ? (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/55 text-white opacity-0 transition group-hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed disabled:opacity-100 dark:bg-slate-950/65"
                      aria-label={
                        uploadingAvatar
                          ? "Uploading profile image"
                          : "Change profile image"
                      }
                    >
                      {uploadingAvatar ? (
                        <span className="flex items-center gap-1 rounded-full bg-black/35 px-3 py-1 text-xs font-semibold">
                          <Clock3 size={13} />
                          Uploading
                        </span>
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35">
                          <Camera size={18} />
                        </span>
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </>
                ) : null}
                <div className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-4 border-white bg-emerald-600 text-white dark:border-slate-900">
                  <ShieldCheck size={18} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    Verified proof profile
                  </p>
                  <p className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    @{profileData.username}
                  </p>
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                  {profileData.name}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                  {profileData.title}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {profileData.bio}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {profileData.openTo.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <Handshake size={14} />
                  Open to {item.toLowerCase()}
                </span>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {isOwnProfile ? (
                <button
                  type="button"
                  onClick={openEditProfile}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                >
                  <Pencil size={16} />
                  Edit profile
                </button>
              ) : null}
              {profileData.actions.map((action) => {
                const Icon = profileIconMap[action.iconKey] || ShieldCheck;
                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => setActiveAction(action)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      action.primary
                        ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                    }`}
                  >
                    <Icon size={16} />
                    {action.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {profileData.links.map((link) => {
                const Icon = profileIconMap[link.iconKey] || ExternalLink;
                return (
                  <a
                    key={link.label}
                    href={normalizeExternalUrl(link.value)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Icon
                        className="shrink-0 text-slate-500 dark:text-slate-400"
                        size={18}
                      />
                      <span className="min-w-0">
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {link.label}
                        </span>
                        <span className="block truncate font-medium text-slate-900 dark:text-slate-100">
                          {link.value}
                        </span>
                      </span>
                    </span>
                    <ExternalLink
                      className="shrink-0 text-slate-400"
                      size={16}
                    />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 lg:border-l lg:border-t-0 lg:p-7">
            <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm dark:border-emerald-500/20 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Builder proof score
                  </p>
                  <p className="mt-2 text-5xl font-semibold tracking-normal">
                    {profileData.proofScore}
                  </p>
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Award size={30} />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
                <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                  {profileData.builderLevel}
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  {profileData.rank}
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {profileData.stats.slice(1).map((stat) => {
                const Icon = profileIconMap[stat.iconKey] || ShieldCheck;
                return (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <Icon
                      size={18}
                      className="text-slate-500 dark:text-slate-400"
                    />
                    <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Trust signals
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    Ready for opportunity
                  </h2>
                </div>
                <ShieldCheck
                  className="text-emerald-600 dark:text-emerald-400"
                  size={22}
                />
              </div>
              <div className="mt-4 space-y-3">
                {profileData.trustSignals.map((signal) => {
                  const Icon = profileIconMap[signal.iconKey] || ShieldCheck;
                  return (
                    <div key={signal.label} className="flex gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{signal.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {signal.detail}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Shipped work
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Projects with proof
                </h2>
              </div>
              <Rocket
                className="text-emerald-600 dark:text-emerald-400"
                size={22}
              />
            </div>

            <div className="mt-4 space-y-3">
              {ownedProjects.length > 0 ? (
                ownedProjects.map((project) => (
                  <article
                    key={project.id}
                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{project.title}</h3>
                          <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                            {project.progress >= 100 ? "Shipped" : "Live build"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                          {project.solution ||
                            project.problem ||
                            "Project proof is being assembled from backend records."}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                        {project.progress}% shipped
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <span
                          key={tech}
                          className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    No shipped projects linked yet.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    This panel now reflects backend project ownership instead of
                    local dummy records.
                  </p>
                </div>
              )}
            </div>
          </div>

          {isOwnProfile ? (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Saved projects
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">
                    Build rooms you bookmarked
                  </h2>
                </div>
                <BookmarkCheck
                  className="text-emerald-600 dark:text-emerald-400"
                  size={22}
                />
              </div>

              {savedProjectList.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {savedProjectList.map((project) => (
                    <article
                      key={project.id}
                      className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">{project.title}</h3>
                            <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                              {project.progress}% shipped
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {project.solution}
                          </p>
                        </div>
                        <Link
                          to={`/projects/${project.id}`}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-500/30 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                        >
                          <ExternalLink size={14} />
                          View
                        </Link>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {project.techStack.slice(0, 4).map((tech) => (
                          <span
                            key={tech}
                            className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    No saved build rooms yet.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Save interesting projects from the feed and they will show
                    up here for quick access.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Skills verified by work
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Evidence-based skills
                </h2>
              </div>
              <Code2
                className="text-emerald-600 dark:text-emerald-400"
                size={22}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profileData.skills.length > 0 ? (
                profileData.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="rounded-lg border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">{skill.name}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {skill.evidence}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        {skill.level ?? 0}%
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{ width: `${skill.level ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 sm:col-span-2">
                  No verified skills yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Completed tasks</h2>
              <CheckCircle2
                className="text-emerald-600 dark:text-emerald-400"
                size={21}
              />
            </div>
            <div className="mt-4 space-y-3">
              {profileData.tasks.map((task) => (
                <div key={task} className="flex gap-3 text-sm">
                  <CheckCircle2
                    className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    size={16}
                  />
                  <span className="text-slate-700 dark:text-slate-300">
                    {task}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Mentor reviews</h2>
              <GraduationCap
                className="text-emerald-600 dark:text-emerald-400"
                size={21}
              />
            </div>
            <div className="mt-4 space-y-4">
              {profileData.reviews.map((review) => (
                <article
                  key={review.mentor}
                  className="border-b border-slate-200 pb-4 last:border-0 last:pb-0 dark:border-slate-800"
                >
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: review.rating }).map((_, index) => (
                      <Star key={index} size={14} fill="currentColor" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    "{review.text}"
                  </p>
                  <p className="mt-3 text-sm font-semibold">{review.mentor}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {review.role}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Contribution timeline</h2>
              <Clock3
                className="text-emerald-600 dark:text-emerald-400"
                size={21}
              />
            </div>
            <div className="mt-4 space-y-4">
              {profileData.timeline.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <GitPullRequest size={15} />
                    </div>
                    <div className="mt-2 h-full w-px bg-slate-200 last:hidden dark:bg-slate-800" />
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {item.date}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold">{item.title}</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      {isEditOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Profile editor
                </p>
                <h2 className="mt-1 text-xl font-semibold">
                  Edit proof profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close profile editor"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Name
                <input
                  value={profileForm.name}
                  onChange={(event) =>
                    handleProfileFieldChange("name", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold">
                Title
                <input
                  value={profileForm.title}
                  onChange={(event) =>
                    handleProfileFieldChange("title", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold">
                Location
                <input
                  value={profileForm.location}
                  onChange={(event) =>
                    handleProfileFieldChange("location", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold">
                Open to
                <input
                  value={profileForm.openTo}
                  onChange={(event) =>
                    handleProfileFieldChange("openTo", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <span className="mt-1 block text-xs font-normal text-slate-500 dark:text-slate-400">
                  Separate items with commas.
                </span>
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Bio
                <textarea
                  value={profileForm.bio}
                  onChange={(event) =>
                    handleProfileFieldChange("bio", event.target.value)
                  }
                  rows={3}
                  className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Proof headline
                <input
                  value={profileForm.headline}
                  onChange={(event) =>
                    handleProfileFieldChange("headline", event.target.value)
                  }
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Proof summary
                <textarea
                  value={profileForm.summary}
                  onChange={(event) =>
                    handleProfileFieldChange("summary", event.target.value)
                  }
                  rows={3}
                  className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Links
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  One URL per line, or Label | URL | icon.
                </span>
                <textarea
                  value={profileForm.links}
                  onChange={(event) =>
                    handleProfileFieldChange("links", event.target.value)
                  }
                  rows={4}
                  className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Skills
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  Separate skills with commas, or use Skill | evidence | level.
                </span>
                <textarea
                  value={profileForm.skills}
                  onChange={(event) =>
                    handleProfileFieldChange("skills", event.target.value)
                  }
                  rows={4}
                  className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">
                Trust signals
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  One per line as Label | detail | icon.
                </span>
                <textarea
                  value={profileForm.trustSignals}
                  onChange={(event) =>
                    handleProfileFieldChange("trustSignals", event.target.value)
                  }
                  rows={4}
                  className="mt-1 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs font-normal text-slate-900 outline-none transition focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-700/70"
              >
                <Pencil size={16} />
                {isSavingProfile ? "Saving..." : "Save profile"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {ActiveActionIcon && <ActiveActionIcon size={20} />}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Proof action
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {activeAction.label}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeAction}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Close action"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {activeAction.description}
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm dark:bg-slate-950">
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                Suggested proof package
              </p>
              <div className="mt-3 space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  MeeTogether project evidence
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  Verified skills and mentor reviews
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-600 dark:text-emerald-400"
                  />
                  GitHub and demo links
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeAction}
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActionContinue}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Send size={16} />
                {activeAction.actionLabel || "Continue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
