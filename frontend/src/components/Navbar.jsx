import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

/**
 * Application Navbar component.
 * On Page 1 / Unauthenticated state: displays logo on left, Login & Register buttons on right.
 * On Page 2 / Authenticated state: displays logo on left, user name/avatar & direct Logout button.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="navbar bg-base-200/60 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 px-4 sm:px-8">
      <div className="flex-1">
        <Link
          to={user ? "/shorten" : "/"}
          className="btn btn-ghost text-xl font-bold tracking-tight gap-2"
        >
          <span>🔗</span> URL Shortener
        </Link>
      </div>

      <div className="flex-none gap-3 items-center">
        {user ? (
          <div className="flex items-center gap-3">
            {/* User Avatar & Name */}
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs">
                  <span>
                    {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="font-medium text-sm">{user.name || user.email}</span>
            </div>

            {/* Direct Logout Button */}
            <button
              onClick={handleLogout}
              className="btn btn-ghost btn-sm text-error hover:bg-error/10 font-medium"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">
              Login
            </Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Register
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Navbar;
