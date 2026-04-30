import React from "react";

const Profile = () => {
  const profile = {
    name: "Mr. Sonuk5",
    username: "Sonukr2006",
    pronouns: "he/him",
    bio: "Sikho aisa ki kuchh kamal kr pao!!!",
    followers: 0,
    following: 4,
    location: "Gopalganj-(Bihar)",
    time: "15:47 (UTC +05:30)",
    email: "sonukr96710@gmail.com",
    organization: "T",
    avatar: "/sonuPi.jpeg",
  };

  return (
    <>
      <div className="m-2 w-full max-w-sm rounded-xl border border-slate-300 bg-white/85 p-5 text-slate-900 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80 dark:text-white">
        <div className="flex flex-col">
          <div className="relative mx-auto w-fit">
            <img
              src={profile.avatar}
              alt={profile.name}
              className="h-72 w-72 rounded-full border-2 border-slate-300 object-cover dark:border-white/10"
            />
            {/* <div className="absolute bottom-6 right-2 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-lg text-indigo-300 shadow-lg">
              ☁
            </div> */}
          </div>

          <div className="mt-5">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {profile.name}
            </h2>
            <p className="mt-1 text-2xl font-normal text-slate-500 dark:text-slate-400">
              {profile.username}
              <span className="mx-2 text-slate-500">·</span>
              {profile.pronouns}
            </p>
          </div>

          <p className="mt-6 text-xl leading-8 text-slate-700 dark:text-slate-200">{profile.bio}</p>

          <button
            type="button"
            className="mt-6 rounded-md border border-slate-300 bg-slate-100 px-4 py-2.5 text-base font-medium text-slate-800 transition hover:bg-slate-200 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            Edit profile
          </button>

          <div className="mt-6 flex items-center gap-2 text-base text-slate-600 dark:text-slate-300">
            <span className="text-slate-500 dark:text-slate-400">⌘</span>
            <span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {profile.followers}
              </span>{" "}
              followers
            </span>
            <span className="text-slate-500">·</span>
            <span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {profile.following}
              </span>{" "}
              following
            </span>
          </div>

          <div className="mt-6 space-y-3 text-base text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400">⌖</span>
              <span>{profile.location}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400">◷</span>
              <span>{profile.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400">✉</span>
              <span>{profile.email}</span>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-300 pt-5 dark:border-white/10">
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Organizations
            </h3>
            <div className="mt-4 flex h-12 w-12 items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-2xl font-bold text-indigo-500 dark:border-white/10 dark:bg-white/5 dark:text-indigo-300">
              {profile.organization}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
