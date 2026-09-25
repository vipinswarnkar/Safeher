import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages are loaded on demand so the login screen opens fast
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Journey = lazy(() => import("./pages/Journey"));
const Contacts = lazy(() => import("./pages/Contacts"));
const History = lazy(() => import("./pages/History"));
const Profile = lazy(() => import("./pages/Profile"));
const SOS = lazy(() => import("./pages/SOS"));
const Safety = lazy(() => import("./pages/Safety"));
const Track = lazy(() => import("./pages/Track"));

// Pages that need the user to be logged in
const protectedPages = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/journey", element: <Journey /> },
  { path: "/contacts", element: <Contacts /> },
  { path: "/history", element: <History /> },
  { path: "/profile", element: <Profile /> },
  { path: "/sos", element: <SOS /> },
  { path: "/safety", element: <Safety /> },
];

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-500 font-medium">
      Loading...
    </div>
  );
}

function App() {
  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Authentication */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Public live-tracking link for trusted contacts (no login) */}
            <Route path="/track/:token" element={<Track />} />

            {/* Main Pages (each path declared once, always protected) */}
            {protectedPages.map(({ path, element }) => (
              <Route key={path} path={path} element={<ProtectedRoute>{element}</ProtectedRoute>} />
            ))}

            {/* Unknown URLs go to the dashboard (or login if logged out) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
        }}
      />
    </>
  );
}

export default App;
