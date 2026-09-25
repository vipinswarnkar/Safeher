import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineEnvelope,
  HiOutlineCalendar,
} from "react-icons/hi2";

import api from "../services/api";
import useApi from "../hooks/useApi";
import PageLayout, { LoadingState, ErrorState } from "../components/PageLayout";

const inputClass =
  "w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500";

function ProfileForm({ user, onSaved }) {
  // Initialised once from the loaded user; the parent remounts this with a
  // new `key` after a save so the fields always match the server.
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);

  const unchanged = name.trim() === user.name && phone.trim() === user.phone;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await api.put("/user/profile", {
        name: name.trim(),
        phone: phone.trim(),
      });

      // Keep the cached user (used in headers) in sync
      localStorage.setItem("user", JSON.stringify(response.data.user));
      toast.success("Profile updated");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow p-5 space-y-4">
      <h2 className="font-semibold text-slate-900">Personal details</h2>

      <div>
        <label className="text-xs text-slate-500">Full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={`${inputClass} mt-1`}
        />
      </div>

      <div>
        <label className="text-xs text-slate-500">Phone number</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className={`${inputClass} mt-1`}
        />
      </div>

      <button
        type="submit"
        disabled={saving || unchanged}
        className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white py-3 rounded-2xl font-semibold transition"
      >
        {saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    try {
      setSaving(true);
      await api.put("/user/change-password", { oldPassword, newPassword });
      toast.success("Password changed");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow p-5 space-y-4">
      <h2 className="font-semibold text-slate-900">Change password</h2>

      <input
        type="password"
        placeholder="Current password"
        value={oldPassword}
        onChange={(e) => setOldPassword(e.target.value)}
        required
        autoComplete="current-password"
        className={inputClass}
      />
      <input
        type="password"
        placeholder="New password (min 6 characters)"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        autoComplete="new-password"
        className={inputClass}
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
        autoComplete="new-password"
        className={inputClass}
      />

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-2xl font-semibold transition"
      >
        {saving ? "Updating..." : "Update password"}
      </button>
    </form>
  );
}

function Profile() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi("/user/profile");
  const user = data?.user;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out");
    navigate("/", { replace: true });
  };

  return (
    <PageLayout title="Profile" subtitle="Manage your account.">
      {loading ? (
        <LoadingState />
      ) : error || !user ? (
        <ErrorState onRetry={reload} />
      ) : (
        <>
          <div className="bg-white rounded-3xl shadow p-5 flex items-center gap-4">
            <div className="w-16 h-16 shrink-0 rounded-full bg-rose-600 text-white flex items-center justify-center text-2xl font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-900 truncate">{user.name}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                <HiOutlineEnvelope size={14} /> {user.email}
              </p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <HiOutlineCalendar size={14} /> Member since{" "}
                {new Date(user.createdAt).toLocaleDateString([], {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <ProfileForm
            key={`${user.name}-${user.phone}`}
            user={user}
            onSaved={reload}
          />

          <PasswordForm />
        </>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 py-3 rounded-2xl font-semibold hover:bg-red-50 transition"
      >
        <HiOutlineArrowRightOnRectangle size={20} /> Log out
      </button>
    </PageLayout>
  );
}

export default Profile;
