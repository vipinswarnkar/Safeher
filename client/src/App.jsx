import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Journey from "./pages/Journey";
import Contacts from "./pages/Contacts";
import History from "./pages/History";
import Profile from "./pages/Profile";
import SOS from "./pages/SOS";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "react-hot-toast";

// Pages that need the user to be logged in
const protectedPages = [
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/journey", element: <Journey /> },
  { path: "/contacts", element: <Contacts /> },
  { path: "/history", element: <History /> },
  { path: "/profile", element: <Profile /> },
  { path: "/sos", element: <SOS /> },
];

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Authentication */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Pages (each path declared once, always protected) */}
          {protectedPages.map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={<ProtectedRoute>{element}</ProtectedRoute>}
            />
          ))}

          {/* Unknown URLs go to the dashboard (or login if logged out) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
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
