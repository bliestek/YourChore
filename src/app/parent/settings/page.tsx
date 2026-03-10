"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { api } from "@/hooks/useFetch";

type User = {
  id: string;
  name: string;
  email: string;
  darkMode: boolean;
  role: string;
};

type FamilyMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
};

type FamilyInfo = {
  id: string;
  name: string;
  inviteCode: string;
  autoGenerateChores: boolean;
  members: FamilyMember[];
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<FamilyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    const { data } = await api<User>("/api/auth/me");
    if (data) {
      setUser(data);
      setDarkMode(data.darkMode ?? false);
      if (data.darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    setLoading(false);
  }, []);

  const fetchFamily = useCallback(async () => {
    const { data } = await api<FamilyInfo>("/api/family");
    if (data) {
      setFamily(data);
      setFamilyName(data.name);
    }
  }, []);

  useEffect(() => {
    fetchUser();
    fetchFamily();
  }, [fetchUser, fetchFamily]);

  async function toggleDarkMode() {
    const newValue = !darkMode;
    setDarkMode(newValue);

    if (newValue) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    toast.success(newValue ? "Dark mode enabled" : "Dark mode disabled");
  }

  async function toggleAutoGenerate() {
    if (!family) return;
    const newValue = !family.autoGenerateChores;
    setFamily({ ...family, autoGenerateChores: newValue });

    const { error } = await api("/api/family", {
      method: "PATCH",
      body: JSON.stringify({ autoGenerateChores: newValue }),
    });
    if (error) {
      setFamily({ ...family, autoGenerateChores: !newValue });
      toast.error("Failed to update setting");
    } else {
      toast.success(
        newValue
          ? "Chores will auto-generate each day"
          : "Auto-generate disabled"
      );
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    const { error } = await api("/api/auth/logout", { method: "POST" });
    if (error) {
      toast.error("Failed to log out");
      setLoggingOut(false);
      return;
    }
    toast.success("Logged out successfully");
    router.push("/login");
  }

  async function handleSaveFamilyName() {
    if (!familyName.trim()) return;
    setSavingName(true);
    const { error } = await api("/api/family", {
      method: "PATCH",
      body: JSON.stringify({ name: familyName.trim() }),
    });
    if (error) {
      toast.error("Failed to update family name");
    } else {
      toast.success("Family name updated!");
      setEditingName(false);
      fetchFamily();
    }
    setSavingName(false);
  }

  async function handleRegenerateCode() {
    setRegenerating(true);
    const { data, error } = await api<{ inviteCode: string }>("/api/family/invite", {
      method: "POST",
    });
    if (error) {
      toast.error("Failed to regenerate code");
    } else if (data) {
      toast.success("New invite code generated!");
      fetchFamily();
    }
    setRegenerating(false);
  }

  function copyInviteCode() {
    if (family?.inviteCode) {
      navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and family</p>
      </div>

      {/* Account info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Account</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center">
              <svg className="w-7 h-7 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Family */}
      {family && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card"
        >
          <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">
            <span className="mr-2">👨‍👩‍👧‍👦</span> Family
          </h2>
          <div className="space-y-5">
            {/* Family name */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Family Name</label>
              {editingName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="input flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveFamilyName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setFamilyName(family.name);
                      }
                    }}
                  />
                  <button
                    onClick={handleSaveFamilyName}
                    disabled={savingName}
                    className="btn-primary text-sm px-3"
                  >
                    {savingName ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingName(false);
                      setFamilyName(family.name);
                    }}
                    className="btn-secondary text-sm px-3"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">{family.name}</p>
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-primary-500 hover:text-primary-600 text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Invite code */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">Invite Code</label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                Share this code with another parent to let them join your family
              </p>
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 dark:bg-slate-700 rounded-xl px-4 py-2.5 font-mono text-lg font-bold tracking-wider text-primary-600 dark:text-primary-400 select-all">
                  {family.inviteCode}
                </div>
                <button
                  onClick={copyInviteCode}
                  className="btn-secondary text-sm px-3 py-2.5"
                  title="Copy code"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  )}
                </button>
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="btn-secondary text-sm px-3 py-2.5"
                  title="Generate new code"
                >
                  {regenerating ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500" />
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                </button>
              </div>
              <button
                onClick={() => {
                  const url = `${window.location.origin}/join?code=${family.inviteCode}`;
                  navigator.clipboard.writeText(url);
                  setCopiedLink(true);
                  toast.success("Invite link copied!");
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="mt-2 text-sm text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                {copiedLink ? "Link copied!" : "Copy invite link to share"}
              </button>
            </div>

            {/* Members list */}
            <div>
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                Family Members ({family.members.length})
              </label>
              <div className="space-y-2">
                {family.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {member.name}
                          {member.userId === user?.id && (
                            <span className="ml-2 text-xs text-primary-500 font-normal">(you)</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">
                      {member.role === "admin" ? "Creator" : "Member"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card"
      >
        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Preferences</h2>
        <div className="space-y-4">
          {/* Dark mode toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {darkMode ? "Currently using dark theme" : "Currently using light theme"}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                darkMode
                  ? "bg-primary-500"
                  : "bg-gray-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  darkMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Auto-generate chores toggle */}
          {family && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Auto-Generate Chores</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {family.autoGenerateChores
                      ? "Recurring chores are created automatically each day"
                      : "Use the button on the dashboard to generate chores"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleAutoGenerate}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  family.autoGenerateChores
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    family.autoGenerateChores ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">Session</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Sign out of your account on this device.
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="btn-danger flex items-center gap-2"
        >
          {loggingOut ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
          Log Out
        </button>
      </motion.div>
    </div>
  );
}
