import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

/**
 * Registration page — name, email, password form.
 * Shares the unified authentication design system with equal-height inputs,
 * password eye toggle, purple focus ring, and mobile-responsive layout.
 */
const RegisterPage = () => {
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect already-authenticated users to /shorten
  if (!loading && user) {
    return <Navigate to="/shorten" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/verify-otp", { state: { email: email.trim() } });
    } catch (err) {
      if (err.response?.status === 409) {
        // Account already verified — redirect to login with context
        navigate("/login", {
          state: {
            email: email.trim(),
            message: err.response.data?.error,
          },
        });
      } else {
        setError(
          err.response?.data?.error || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="card bg-base-200/80 backdrop-blur-md w-full max-w-md shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body p-6 sm:p-8">
          <div className="text-center mb-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Create Account
            </h2>
            <p className="text-sm text-base-content/60 mt-1">
              Sign up to track your shortened links
            </p>
          </div>

          {error && (
            <div className="alert alert-error text-sm mb-4 p-3 rounded-lg">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Full Name Field */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="register-name" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                Full Name
              </label>
              <div className="relative w-full">
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="register-name"
                  type="text"
                  className="w-full h-12 pl-10 pr-4 bg-base-100 border border-base-300 rounded-lg text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-base-300/30"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="register-email" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                Email Address
              </label>
              <div className="relative w-full">
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <input
                  id="register-email"
                  type="email"
                  className="w-full h-12 pl-10 pr-4 bg-base-100 border border-base-300 rounded-lg text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-base-300/30"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="register-password" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                Password
              </label>
              <div className="relative w-full">
                <svg
                  className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full h-12 pl-10 pr-10 bg-base-100 border border-base-300 rounded-lg text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-base-300/30"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-primary transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.274 4.057 5.065 7 9.542 7 4.477 0 8.268-2.943 9.542-7-1.274-4.057-5.065-7-9.542-7-4.477 0-8.268 2.943-9.542 7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="register-submit"
              type="submit"
              className="btn btn-primary h-12 w-full text-base font-semibold rounded-lg shadow-md hover:shadow-primary/25 transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="divider text-xs text-base-content/50 my-4">OR</div>

          <p className="text-center text-sm text-base-content/70">
            Already have an account?{" "}
            <Link to="/login" className="link link-primary font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
