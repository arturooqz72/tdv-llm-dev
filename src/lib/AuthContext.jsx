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

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  const hydrateFromSession = useCallback(async (nextSession) => {
    try {
      if (!nextSession?.user) {
        setSession(null);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        return null;
      }

      const profile = await getProfileById(nextSession.user.id);
      const appUser = buildAppUser(nextSession.user, profile);

      setSession(nextSession);
      setUser(appUser);
      setIsAuthenticated(true);
      setAuthError(null);

      return appUser;
    } catch (error) {
      console.error("Error hydrating auth session:", error);
      setSession(null);
      setUser(null);
      setIsAuthenticated(false);
      setAuthError({
        type: "auth_hydration_error",
        message: "No se pudo cargar la sesión actual.",
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

      const appUser = await hydrateFromSession(currentSession);
      return appUser;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [hydrateFromSession]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await checkAppState();
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
        }
      }
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return;

      setIsLoadingAuth(true);
      try {
        await hydrateFromSession(nextSession);
      } finally {
        if (mounted) {
          setIsLoadingAuth(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAppState, hydrateFromSession]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return null;

    setIsLoadingAuth(true);
    try {
      const profile = await getProfileById(session.user.id);
      const appUser = buildAppUser(session.user, profile);

      setUser(appUser);
      setIsAuthenticated(!!appUser);
      setAuthError(null);

      return appUser;
    } catch (error) {
      console.error("Error refreshing profile:", error);
      setAuthError({
        type: "refresh_profile_error",
        message: "No se pudo actualizar el perfil.",
      });
      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  }, [session]);

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
