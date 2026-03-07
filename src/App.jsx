import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import NavigationTracker from "@/lib/NavigationTracker";
import { pagesConfig } from "./pages.config";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import Login from "@/pages/Login";

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : () => null;

const LayoutWrapper = ({ children, currentPageName }) =>
  Layout ? (
    <Layout currentPageName={currentPageName}>{children}</Layout>
  ) : (
    <>{children}</>
  );

const PUBLIC_PAGES = new Set(["Home", "Radio", "Login"]);

const ADMIN_PAGES = new Set([
  "AdminChatRooms",
  "AdminEscuchaYGana",
  "AdminNotifications",
  "AdminSaludos",
  "AdminTrivia",
  "AdminVideos",
  "AppStats",
  "ConflictsManager",
  "GoLive",
  "Moderation",
  "RadioDashboard",
  "RadioEvents",
  "RadioStats",
  "RoleManagement",
  "StartLiveRadio",
  "Users",
]);

const SPECIAL_ROOM_PAGES = new Set(["TeamDesveladosRoom"]);

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/20">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const AuthenticatedRoute = ({ children }) => {
  const {
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  return children;
};

const AdminRoute = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

const SpecialRoomRoute = ({ children }) => {
  const {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
  } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <LoadingScreen />;
  }

  if (authError?.type === "user_not_registered") {
    return <UserNotRegisteredError />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/Login" replace />;
  }

  const canAccessSpecialRoom =
    user?.role === "admin" || user?.canAccessTeamDesveladosRoom === true;

  if (!canAccessSpecialRoom) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        }
      />

      <Route path="/Login" element={<Login />} />
      <Route path="/login" element={<Navigate to="/Login" replace />} />
      <Route path="/Home" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />

      {Object.entries(Pages)
        .filter(([path]) => path !== mainPageKey && path !== "Login")
        .map(([path, Page]) => {
          const isPublicPage = PUBLIC_PAGES.has(path);
          const isAdminPage = ADMIN_PAGES.has(path);
          const isSpecialRoomPage = SPECIAL_ROOM_PAGES.has(path);

          const pageElement = (
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          );

          let wrappedElement = pageElement;

          if (isAdminPage) {
            wrappedElement = <AdminRoute>{pageElement}</AdminRoute>;
          } else if (isSpecialRoomPage) {
            wrappedElement = <SpecialRoomRoute>{pageElement}</SpecialRoomRoute>;
          } else if (!isPublicPage) {
            wrappedElement = (
              <AuthenticatedRoute>{pageElement}</AuthenticatedRoute>
            );
          }

          return (
            <Route
              key={path}
              path={`/${path}`}
              element={wrappedElement}
            />
          );
        })}

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <NavigationTracker />
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
