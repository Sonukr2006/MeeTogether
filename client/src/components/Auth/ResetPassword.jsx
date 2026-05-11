import { useMemo, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { useAlert } from "../../contexts/AlertProvider";
import AuthWith from "./AuthWith";

export default function ResetPassword() {
  const { showAlert } = useAlert();
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      await apiRequest("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token.trim(),
          newPassword: password,
        }),
      });

      setDone(true);
      showAlert("Password reset successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Password reset failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden flex-col gap-2">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl w-[380px] relative z-10">
        <h2 className="text-3xl font-bold dark:text-white text-center tracking-wide">
          Meetogether
        </h2>
        <p className="text-center text-gray-400 mb-8">Create a new password</p>

        {done ? (
          <div className="space-y-4 text-center text-sm text-slate-200">
            <p>Your password has been updated.</p>
            <Link to="/sign-in" className="text-indigo-300 hover:underline">
              Go to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <input
                type="text"
                name="token"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
                className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Reset token"
              />
              <label className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-200">
                Reset token
              </label>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="New password"
              />
              <label className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-200">
                New password
              </label>

              <span
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Updating password...
                </>
              ) : (
                "Reset password"
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-center text-sm">
          <Link to="/sign-in" className="text-purple-400 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
      <AuthWith type="Reset password" />
    </div>
  );
}
