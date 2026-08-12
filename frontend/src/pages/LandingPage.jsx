import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

/**
 * Page 1 — Public Landing Page.
 * Displays hero section, feature highlights, and call-to-action buttons.
 * Redirects authenticated users directly to Page 2 (/shorten).
 */
const LandingPage = () => {
  const { user, loading } = useAuth();

  // If session check is still in progress, show loading spinner
  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // If user is already authenticated, redirect straight to Page 2 (/shorten)
  if (user) {
    return <Navigate to="/shorten" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center my-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold uppercase tracking-wider mb-6">
          ✨ Fast, Free & Secure Link Management
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">URL Shortener</span>
        </h1>

        <p className="text-lg sm:text-xl text-base-content/70 mb-8 leading-relaxed max-w-2xl mx-auto">
          Transform long, unwieldy web addresses into clean, memorable short URLs with instant QR code generation and real-time click tracking.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/register"
            className="btn btn-primary btn-lg shadow-lg hover:shadow-primary/25 transition-all duration-300"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="btn btn-outline btn-lg"
          >
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="w-full my-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          Everything You Need to Manage Your Links
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card bg-base-200/60 backdrop-blur-md border border-base-300 shadow-md hover:border-primary/50 transition-all duration-300">
            <div className="card-body">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl mb-2">
                ⚡
              </div>
              <h3 className="card-title text-xl">Instant Shortening</h3>
              <p className="text-sm text-base-content/70">
                Convert any long URL into a short, easy-to-share link in less than a second.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card bg-base-200/60 backdrop-blur-md border border-base-300 shadow-md hover:border-secondary/50 transition-all duration-300">
            <div className="card-body">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary text-2xl mb-2">
                📱
              </div>
              <h3 className="card-title text-xl">QR Code Generation</h3>
              <p className="text-sm text-base-content/70">
                Automatically generate downloadable QR codes for every shortened URL instantly.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card bg-base-200/60 backdrop-blur-md border border-base-300 shadow-md hover:border-accent/50 transition-all duration-300">
            <div className="card-body">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent text-2xl mb-2">
                📊
              </div>
              <h3 className="card-title text-xl">Click Analytics</h3>
              <p className="text-sm text-base-content/70">
                Track how many times your links are clicked with real-time analytics dashboards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="w-full my-12 bg-gradient-to-r from-base-200 via-base-300 to-base-200 p-8 sm:p-12 rounded-3xl border border-base-300 text-center relative overflow-hidden shadow-xl">
        <h2 className="text-3xl font-bold mb-4">Ready to simplify your links?</h2>
        <p className="text-base-content/70 max-w-md mx-auto mb-6">
          Create your free account today and start shortening, sharing, and tracking links in seconds.
        </p>
        <Link to="/register" className="btn btn-primary btn-md sm:btn-lg px-8">
          Register for Free
        </Link>
      </section>
    </div>
  );
};

export default LandingPage;
