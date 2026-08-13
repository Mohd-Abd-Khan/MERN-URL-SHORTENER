import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { verifyOtpApi, resendOtpApi } from "../api/authApi";
import { useAuth } from "../context/useAuth";

/**
 * Verify OTP page — accepts a 6-digit OTP to verify user's email.
 * Applies the unified authentication design system with equal-height inputs,
 * purple focus ring, read-only email indicator, and mobile-responsive layout.
 */
const VerifyOtpPage = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Redirect already-authenticated users to /shorten
  if (!loading && user) {
    return <Navigate to="/shorten" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !otp.trim()) {
      setError("Email and OTP code are required");
      return;
    }

    if (otp.trim().length !== 6) {
      setError("OTP must be a 6-digit code");
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyOtpApi({ email: email.trim(), otp: otp.trim() });
      setSuccess(res.message || "Email verified successfully!");
      setTimeout(() => {
        navigate("/login", { state: { email: email.trim() } });
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error || "Verification failed. Please check your code and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Please enter your email address to resend code.");
      return;
    }

    setIsResending(true);
    try {
      const res = await resendOtpApi({ email: email.trim() });
      setSuccess(res.message || "A new 6-digit code has been sent to your email!");
    } catch (err) {
      setError(
        err.response?.data?.error || "Failed to resend code. Please try again."
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="card bg-base-200/80 backdrop-blur-md w-full max-w-md shadow-xl border border-base-300 rounded-2xl">
        <div className="card-body p-6 sm:p-8">
          <div className="text-center mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
              <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Verify Your Email
            </h2>
            <p className="text-sm text-base-content/60 mt-1">
              Enter the 6-digit verification code sent to your inbox
            </p>
          </div>

          {error && (
            <div className="alert alert-error text-sm mb-4 p-3 rounded-lg">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success text-sm mb-4 p-3 rounded-lg flex items-center gap-2">
              <span>✓ {success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            {/* Target Email Field */}
            <div className="flex flex-col gap-1 w-full">
              <div className="flex justify-between items-center">
                <label htmlFor="otp-email" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                  Email Address
                </label>
                {Boolean(location.state?.email) && (
                  <span className="text-[10px] bg-base-300 text-base-content/70 px-2 py-0.5 rounded font-mono">
                    READ-ONLY
                  </span>
                )}
              </div>
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
                  id="otp-email"
                  type="email"
                  className="w-full h-12 pl-10 pr-4 bg-base-100 border border-base-300 rounded-lg text-sm transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-base-300/40 disabled:cursor-not-allowed disabled:opacity-80"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading || Boolean(location.state?.email)}
                  required
                />
              </div>
            </div>

            {/* 6-Digit OTP Code Input */}
            <div className="flex flex-col gap-1 w-full">
              <label htmlFor="otp-code" className="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                6-Digit Verification Code
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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input
                  id="otp-code"
                  type="text"
                  maxLength={6}
                  className="w-full h-12 pl-10 pr-4 bg-base-100 border border-base-300 rounded-lg text-lg font-mono tracking-widest text-center transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none disabled:bg-base-300/30"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="verify-otp-submit"
              type="submit"
              className="btn btn-primary h-12 w-full text-base font-semibold rounded-lg shadow-md hover:shadow-primary/25 transition-all mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Verifying Code...</span>
                </div>
              ) : (
                "Verify Code"
              )}
            </button>
          </form>

          <div className="divider text-xs text-base-content/50 my-4">OR</div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-base-content/70">
            <span>Didn't receive a code?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isResending || isLoading}
              className="btn btn-ghost btn-sm text-primary font-semibold hover:bg-primary/10"
            >
              {isResending ? "Resending..." : "Resend Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
