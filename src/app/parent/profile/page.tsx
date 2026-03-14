"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";
import { avatars, getAvatarEmoji, isEmoji } from "@/lib/icons";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  darkMode: boolean;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await api<User>("/api/auth/me");
      if (error || !data || data.role !== "parent") {
        router.push("/login");
        return;
      }
      setUser(data);
      setName(data.name);
      setEmail(data.email);
      setAvatar(data.avatar || "");
      setLoading(false);
    }
    fetchUser();
  }, [router]);

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (!email.trim()) {
      toast.error("Email cannot be empty");
      return;
    }

    setSavingProfile(true);
    const { data, error } = await api<User>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    });

    if (error) {
      toast.error(error);
    } else if (data) {
      setUser(data);
      toast.success("Profile updated!");
      window.dispatchEvent(new CustomEvent("profile-update"));
    }
    setSavingProfile(false);
  };

  const handleSaveAvatar = async (newAvatar: string) => {
    setAvatar(newAvatar);
    setSavingAvatar(true);
    const { data, error } = await api<User>("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ avatar: newAvatar }),
    });

    if (error) {
      toast.error(error);
    } else if (data) {
      setUser(data);
      toast.success("Avatar updated!");
      window.dispatchEvent(new CustomEvent("profile-update"));
    }
    setSavingAvatar(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setSavingPassword(true);
    const { error } = await api("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (error) {
      toast.error(error);
    } else {
      toast.success("Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await api("/api/auth/logout", { method: "POST" });
    toast.success("Signed out!");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) return null;

  const currentAvatarDisplay = avatar
    ? getAvatarEmoji(avatar)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
          Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account settings
        </p>
      </motion.div>

      {/* Avatar Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card"
      >
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
          Avatar
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
            {currentAvatarDisplay ? (
              <span className="text-5xl">{currentAvatarDisplay}</span>
            ) : (
              <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentAvatarDisplay ? "Tap an emoji below to change" : "Choose an avatar"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
          {avatars.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => handleSaveAvatar(a.id)}
              disabled={savingAvatar}
              className={`p-2 rounded-xl text-2xl flex items-center justify-center transition-all ${
                avatar === a.id
                  ? "bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400 scale-110"
                  : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
              }`}
              title={a.label}
            >
              {a.emoji}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            placeholder="Or paste any emoji..."
            value={!avatars.find((a) => a.id === avatar) && avatar ? avatar : ""}
            onChange={(e) => {
              const val = e.target.value.trim();
              if (val && isEmoji(val)) handleSaveAvatar(val);
            }}
            className="input flex-1 text-center text-xl"
            maxLength={4}
          />
          {isEmoji(avatar) && (
            <span className="text-2xl p-2 bg-primary-100 dark:bg-primary-900/40 rounded-xl ring-2 ring-primary-400">
              {avatar}
            </span>
          )}
        </div>
        {avatar && (
          <button
            onClick={() => handleSaveAvatar("")}
            className="mt-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            Remove avatar
          </button>
        )}
      </motion.div>

      {/* Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
          Personal Info
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="your@email.com"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || (name === user.name && email === user.email)}
            className="btn-primary disabled:opacity-50"
          >
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </motion.div>

      {/* Change Password */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card"
      >
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
          Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input"
              placeholder="Re-enter new password"
            />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={savingPassword || !currentPassword || !newPassword}
            className="btn-primary disabled:opacity-50"
          >
            {savingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </motion.div>

      {/* Sign Out */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-4">
          Session
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Sign out of your account on this device.
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50"
        >
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </motion.div>
    </div>
  );
}
