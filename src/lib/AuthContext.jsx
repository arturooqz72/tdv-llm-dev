import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const AuthContext = createContext();

const USER_STORAGE_KEY = "tdv_current_user";

function readStoredUser() {
  try {
    if (typeof window === "undefined") return null;

    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return parsed;
  } catch (error) {
    console.error("Error reading stored user:", error);
    return null;
  }
}

function writeStoredUser(userData) {
  try {
    if (typeof window === "undefined") return false;

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error("Error saving user:", error);
    return false;
  }
}

function clearStoredUser() {
  try {
    if (typeof window === "undefined") return false;

    localStorage.removeItem(USER_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Error clearing stored user:", error);
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  const checkAppState = useCallback(() => {
    setIsLoadingAuth(true);

    const storedUser = readStoredUser();

    if (storedUser) {
      setUser(storedUser);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
      return storedUser;
    }

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);
    setIsLoadingAuth(false);
    return null;
  }, []);

  useEffect(() => {
    checkAppState();

    const onStorage = (e) => {
      if (e.key === USER_STORAGE_KEY) {
        checkAppState();
      }
    };

    const onAuthChanged = () => {
      checkAppState();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("tdv-auth-changed", onAuthChanged);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tdv-auth-changed", onAuthChanged);
    };
  }, [checkAppState]);

  const login = useCallback((userData, redirectTo = null) => {
    if (!userData || typeof userData !== "object") {
      console.error("login requires a valid user object");
      setAuthError({
        type: "invalid_login_data",
        message: "Invalid login data",
      });
      return false;
    }

    const normalizedUser = {
      id: userData.id || userData.email || "tdv-user",
      name: userData.name || userData.displayName || "Usuario",
      email: userData.email || "",
      photoURL: userData.photoURL || userData.avatar || "",
      role: userData.role || "user",
      ...userData,
    };

    const saved = writeStoredUser(normalizedUser);

    if (!saved) {
      setAuthError({
        type: "storage_error",
        message: "Could not save session",
      });
      return false;
    }

    setUser(normalizedUser);
    setIsAuthenticated(true);
    setAuthError(null);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tdv-auth-changed"));
    }

    if (redirectTo) {
      navigate(redirectTo, { replace: true });
    }

    return true;
  }, [navigate]);

  const logout = useCallback((shouldRedirect = true) => {
    clearStoredUser();

    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("tdv-auth-changed"));
    }

    if (shouldRedirect) {
      navigate(createPageUrl("Login"), { replace: true });
    }
  }, [navigate]);

  const navigateToLogin = useCallback(() => {
    navigate(createPageUrl("Login"), { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        login,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
