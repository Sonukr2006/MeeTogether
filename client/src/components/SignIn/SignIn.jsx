import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAlert } from "../../contexts/AlertProvider";
import AuthWith from "../Auth/AuthWith";
import { signInUser } from "../../store/authSlice";

const SignIn = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { status, currentUser, initialized } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const loading = status === "loading" && initialized;

  useEffect(() => {
    if (currentUser?.username) {
      navigate(currentUser.emailVerified ? `/profile/${currentUser.username}` : "/verify-email");
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await dispatch(
        signInUser({
          identifier: formData.email.trim(),
          password: formData.password,
        })
      ).unwrap();

      showAlert("Signed in successfully.", "success");
    } catch (error) {
      showAlert(error.message || "Sign in failed.", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center from-[#020617] via-[#0f172a] to-[#020617] relative overflow-hidden flex-col gap-2">

      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl w-[360px] relative z-10">
        <h2 className="text-3xl font-bold dark:text-white text-center tracking-wide">
          Meetogether
        </h2>
        <p className="text-center text-gray-400 mb-8">Welcome back 👋</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Field */}
          <div className="relative">
            <input
              type="text"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Email or username"
            />
            <label
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
              peer-placeholder-shown:top-3.5 
              peer-placeholder-shown:text-base 
              peer-placeholder-shown:text-gray-500 
              peer-focus:top-2 
              peer-focus:text-sm 
              peer-focus:text-indigo-400"
            >
              Email or username
            </label>
          </div>

          {/* Password Field */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="peer w-full px-4 pt-5 pb-2 bg-transparent border border-gray-600 rounded-lg text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Password"
            />
            <label
              className="absolute left-4 top-2 text-gray-400 text-sm transition-all 
              peer-placeholder-shown:top-3.5 
              peer-placeholder-shown:text-base 
              peer-placeholder-shown:text-gray-500 
              peer-focus:top-2 
              peer-focus:text-sm 
              peer-focus:text-indigo-400"
            >
              Password
            </label>

            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
          
        </form>

        {/* Links */}
        <div className="mt-6 text-center text-sm">
          <Link
            to="/forgot-password"
            className="text-gray-400 hover:text-white"
          >
            <p className="text-indigo-400 cursor-pointer hover:underline mb-2">
              Forgot Password?
            </p>
          </Link>
        </div>
        <div className="mt-4 text-center text-sm">
          <p className="text-gray-400">
            Don’t have an account?{" "}
            <Link to="/sign-up" className="text-purple-400 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
      <AuthWith type="Sign in" />
    </div>
  );
};

export default SignIn;
