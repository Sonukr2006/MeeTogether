import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { apiRequest } from "../../lib/api";
import { useAlert } from "../../contexts/AlertProvider";
import AuthWith from "./AuthWith";

export default function VerifyEmail() {
  const { showAlert } = useAlert();
  const { accessToken, currentUser } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const initialToken = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [verificationPreview, setVerificationPreview] = useState(null);

  const handleVerify = async (overrideToken) => {
    const tokenToVerify = (overrideToken ?? token).trim();
    if (!tokenToVerify) {
      showAlert("Verification token is required.", "error");
      return;
    }

    setLoading(true);

    try {
      await apiRequest("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: tokenToVerify }),
      });

      setVerified(true);
      showAlert("Email verified successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Email verification failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!accessToken) {
      showAlert("Sign in first to resend verification.", "error");
      return;
    }

    setResending(true);
    try {
      const response = await apiRequest("/auth/resend-verification", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setVerificationPreview(response.verification ?? null);
      showAlert(response.message || "Verification link prepared.", "success");
    } catch (error) {
      showAlert(error.message || "Could not resend verification.", "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden flex-col gap-2">
      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl w-[380px] relative z-10">
        <h2 className="text-3xl font-bold dark:text-white text-center tracking-wide">
          Meetogether
        </h2>
        <p className="text-center text-gray-400 mb-8">Verify your email</p>

        {verified ? (
          <div className="space-y-4 text-center text-sm text-slate-200">
            <p>Your email is verified now.</p>
            <Link to={currentUser?.username ? `/profile/${currentUser.username}` : "/sign-in"} className="text-indigo-300 hover:underline">
              Continue
            </Link>
          </div>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleVerify();
              }}
              className="space-y-6"
            >
              <div className="relative">
                <input
                  type="text"
                  name="token"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  required
                  className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Verification token"
                />
                <label className="absolute left-4 top-2 text-gray-400 text-sm transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:top-0.5 peer-focus:text-sm peer-focus:text-indigo-200">
                  Verification token
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
                    Verifying...
                  </>
                ) : (
                  "Verify email"
                )}
              </button>
            </form>

            <button
              type="button"
              disabled={resending}
              onClick={() => void handleResend()}
              className="mt-4 w-full flex items-center justify-center gap-2 border border-white/10 bg-white/5 text-white py-2 rounded-lg transition disabled:opacity-70"
            >
              {resending ? <Loader2 className="animate-spin" size={18} /> : null}
              Resend verification
            </button>

            {verificationPreview ? (
              <div className="mt-5 rounded-xl border border-indigo-500/30 bg-slate-900/60 p-4 text-sm text-slate-200">
                <p className="font-semibold text-indigo-300">Development verification preview</p>
                <p className="mt-2 break-all">{verificationPreview.token}</p>
              </div>
            ) : null}
          </>
        )}

        <div className="mt-4 text-center text-sm">
          <Link to="/sign-in" className="text-purple-400 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
      <AuthWith type="Verify email" />
    </div>
  );
}
