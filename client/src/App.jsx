import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Journey from "./pages/Journey";
import Contacts from "./pages/Contacts";
import History from "./pages/History";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";

import { Toaster } from "react-hot-toast";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Authentication */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Main Pages */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/journey" element={<Journey />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
          <Route
           path="/dashboard"
           element={
          <ProtectedRoute>
          <Dashboard />
          </ProtectedRoute>
            }
            />
                        <Route
              path="/journey"
              element={
                <ProtectedRoute>
                  <Journey />
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <Contacts />
                </ProtectedRoute>
              }
            />

            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />


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