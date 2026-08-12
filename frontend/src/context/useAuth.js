import { useContext } from "react";
import { AuthContext } from "./AuthContextObject";

/**
 * Hook to access auth context.
 * @returns {{ user: object|null, accessToken: string|null, loading: boolean, login: Function, register: Function, logout: Function }}
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
