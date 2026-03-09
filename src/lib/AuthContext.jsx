import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

async function getProfileById(userId) {
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, role, can_access_team_desvelados_room, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error loading profile:", error);
    return null;
  }

  return data;
}

function buildAppUser(sessionUser, profile) {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id,
    email: profile?.email || sessionUser.email || "",
    name:
      profile?.full_name ||
      sessionUser.user_metadata?.full_name ||
      sessionUser.user_metadata?.name ||
      (sessionUser.email ? sessionUser.email.split("@")[0] : "Usuario"),
    photoURL:
      profile?.avatar_url ||
      sessionUser.user_metadata?.avatar_url ||
      sessionUser.user_metadata?.picture ||
      "",
    role: profile?.role || "user",
    canAccessTeamDesveladosRoom: !!profile?.can_access_team_desvelados_room,
    createdAt: profile?.created_at || null,
    updatedAt: profile?.updated_at || null,
    rawAuthUser: sessionUser,
    rawProfile: profile || null,
  };
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  const loadProfileFromSession = useCallback(async (nextSession) => {
    if (!nextSession?.user) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(null);
      return null;
    }

    try {
      const profile = await getProfileById(nextSession.user.id);
      const appUser = buildAppUser(nextSession.user, profile);

      setUser(appUser);
      setIsAuthenticated(true);
      setAuthError(null);

      return appUser;
    } catch (error) {
      console.error("Error loading auth profile:", error);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: "profile_load_error",
        message: "No se pudo cargar el perfil.",
      });
      return null;
    }
  }, []);

  const checkAppState = useCallback(async () => {
    setIsLoadingAuth(true);

    try {
      const {
        data: { session: currentSession },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session:", error);
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: "get_session_error",
          message: "No se pudo obtener la sesión.",
        });
        return null;
      }

      setSession(currentSession);
      return await loadProfileFromSession(currentSession);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [loadProfileFromSession]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await checkAppState();
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);

      // Evita meter consultas pesadas dentro del callback de auth
      setTimeout(() => {
        if (!mounted) return;
        checkAppState();
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAppState]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return null;

    setIsLoadingAuth(true);
    try {
      return await loadProfileFromSession(session);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [session, loadProfileFromSession]);

  const logout = useCallback(
    async (shouldRedirect = true) => {
      setIsLoadingAuth(true);

      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Error signing out:", error);
          setAuthError({
            type: "logout_error",
            message: "No se pudo cerrar sesión.",
          });
          return false;
        }

        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);

        if (shouldRedirect) {
          navigate(createPageUrl("Login"), { replace: true });
        }

        return true;
      } finally {
        setIsLoadingAuth(false);
      }
    },
    [navigate]
  );

  const navigateToLogin = useCallback(() => {
    navigate(createPageUrl("Login"), { replace: true });
  }, [navigate]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        logout,
        navigateToLogin,
        checkAppState,
        refreshProfile,
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
