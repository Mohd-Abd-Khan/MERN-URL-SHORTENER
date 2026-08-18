import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

/**
 * Login page — user authentication form.
 * Features equal-height input fields, password show/hide eye toggle,
 * unified purple focus ring theme, and mobile-responsive layout.
 */
const LoginPage = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage] = useState(location.state?.message || "");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect already-authenticated users to /shorten
  if (!loading && user) {
    return <Navigate to="/shorten" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerification(false);

    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }

    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate("/shorten");
    } catch (err) {
      const msg = err.response?.data?.error || "Login failed. Please check your credentials.";
      setError(msg);
      if (err.response?.data?.needsVerification) {
        setNeedsVerification(true);
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
              Welcome Back
            </h2>
            <p className="text-sm text-base-content/60 mt-1">
              Sign in to access your shortened links dashboard
            </p>
          </div>

          {infoMessage && (
            <div className="alert alert-info text-sm mb-4 p-3 rounded-lg">
              <span>{infoMessage}</span>
            </div>
          )}

          {error && (
            <div className="alert alert-error text-sm mb-4 flex flex-col items-start gap-1 p-3 rounded-lg">
              <span>{error}</span>
              {needsVerification && (
                <button
                  type="button"
                  onClick={() => navigate("/verify-otp", { state: { email } })}
                  className="btn btn-xs btn-outline mt-1"
                >
                  Verify Email Now
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Email Field Container */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
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
                  id="login-email"
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

            {/* Password Field Container */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
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
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  className="w-full h-12 pl-10 pr-10 bg-base-100 border border-base-300 rounded-lg text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-base-300/30"
                  placeholder="••••••••"
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
                  tabIndex={0}
                >
                  {showPassword ? (
                    /* Eye-off Icon */
                    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye Icon */
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
              id="login-submit"
              type="submit"
              className="btn btn-primary h-12 w-full text-base font-semibold rounded-lg shadow-md hover:shadow-primary/25 transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Login"
              )}
            </button>
          </form>

          <div className="divider text-xs text-base-content/50 my-4">OR</div>

          <p className="text-center text-sm text-base-content/70">
            Don't have an account?{" "}
            <Link to="/register" className="link link-primary font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
