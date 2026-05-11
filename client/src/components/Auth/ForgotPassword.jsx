import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../lib/api";
import { useAlert } from "../../contexts/AlertProvider";
import AuthWith from "./AuthWith";

export default function ForgotPassword() {
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPreview, setResetPreview] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });

      setResetPreview(response.reset ?? null);
      showAlert(response.message || "Reset instructions prepared.", "success");
    } catch (error) {
      showAlert(error.message || "Could not start password reset.", "error");
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
        <p className="text-center text-gray-400 mb-8">
          Reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Email"
            />
            <label className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-200">
              Email
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Preparing reset...
              </>
            ) : (
              "Send reset link"
            )}
          </button>
        </form>

        {resetPreview ? (
          <div className="mt-5 rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4 text-sm text-slate-200">
            <p className="font-semibold text-indigo-300">Development reset preview</p>
            <p className="mt-2 break-all">{resetPreview.token}</p>
            <Link
              to={`/reset-password?token=${encodeURIComponent(resetPreview.token)}`}
              className="mt-3 inline-block text-indigo-300 hover:underline"
            >
              Open reset screen
            </Link>
          </div>
        ) : null}

        <div className="mt-4 text-center text-sm">
          <Link to="/sign-in" className="text-purple-400 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
      <AuthWith type="Recover account" />
    </div>
  );
}
