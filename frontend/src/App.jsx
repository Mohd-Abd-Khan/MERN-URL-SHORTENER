import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./routes/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import ShortenPage from "./pages/ShortenPage";

/**
 * Root Application Component.
 * Wraps the routing tree in AuthProvider, global Navbar, and DaisyUI Footer.
 */
const App = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-base-100 text-base-content">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* Page 1: Public Landing Page (redirects logged-in users to /shorten) */}
            <Route path="/" element={<LandingPage />} />

            {/* Existing Public Auth Routes */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Page 2: Protected URL Shortener Page */}
            <Route element={<ProtectedRoute />}>
              <Route path="/shorten" element={<ShortenPage />} />
              <Route path="/dashboard" element={<Navigate to="/shorten" replace />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
};

export default App;