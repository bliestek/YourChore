"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";
import { getAvatarEmoji, avatars } from "@/lib/icons";

type Child = {
  id: string;
  name: string;
  avatar: string;
  starBalance: number;
  createdAt: string;
};

const emptyForm = { name: "", avatar: "bear", pin: "" };

export default function ChildrenPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [starAdjust, setStarAdjust] = useState<{ childId: string; amount: number; description: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchChildren = useCallback(async () => {
    setLoading(true);
    const { data } = await api<Child[]>("/api/children");
    if (data) setChildren(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(child: Child) {
    setEditingId(child.id);
    setForm({ name: child.name, avatar: child.avatar, pin: "" });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.pin && !/^\d{4}$/.test(form.pin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }

    setSaving(true);
    const body = {
      name: form.name.trim(),
      avatar: form.avatar,
      ...(form.pin && { pin: form.pin }),
    };

    if (editingId) {
      const { error } = await api(`/api/children/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Child updated!");
        closeForm();
        fetchChildren();
      }
    } else {
      const { error } = await api("/api/children", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Child added!");
        closeForm();
        fetchChildren();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await api(`/api/children/${id}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
    } else {
      toast.success("Child removed");
      setConfirmDelete(null);
      fetchChildren();
    }
  }

  async function handleStarAdjust() {
    if (!starAdjust || starAdjust.amount === 0) return;
    const { error } = await api(`/api/children/${starAdjust.childId}/stars`, {
      method: "POST",
      body: JSON.stringify({
        amount: starAdjust.amount,
        description: starAdjust.description || "Manual adjustment",
      }),
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Stars ${starAdjust.amount > 0 ? "added" : "removed"}!`);
      setStarAdjust(null);
      fetchChildren();
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Children</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your family members</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Child
        </button>
      </div>

      {/* Children list */}
      {children.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-12">
          <div className="text-5xl mb-4">&#128118;</div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">No children yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Add your first child to get started!</p>
          <button onClick={openAdd} className="btn-primary">Add Child</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {children.map((child, i) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card-hover relative group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-primary-50 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-3xl">
                  {getAvatarEmoji(child.avatar)}
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">{child.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-star-gold">
                    <span>&#11088;</span>
                    <span className="font-semibold">{child.starBalance} stars</span>
                  </div>
                </div>
              </div>

              {/* Star adjustment */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() =>
                    setStarAdjust({ childId: child.id, amount: -1, description: "" })
                  }
                  className="btn-secondary py-1 px-3 text-sm"
                >
                  - Star
                </button>
                <button
                  onClick={() =>
                    setStarAdjust({ childId: child.id, amount: 1, description: "" })
                  }
                  className="btn-secondary py-1 px-3 text-sm"
                >
                  + Star
                </button>
                <button
                  onClick={() =>
                    setStarAdjust({ childId: child.id, amount: 0, description: "" })
                  }
                  className="btn-secondary py-1 px-3 text-sm"
                >
                  Custom
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(child)}
                  className="flex-1 btn-secondary text-sm py-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(child.id)}
                  className="btn-danger text-sm py-2 px-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Delete confirmation */}
              <AnimatePresence>
                {confirmDelete === child.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 z-10 shadow-lg"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Delete {child.name}?</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">
                      This will remove all their data including star history.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm py-2">
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(child.id)} className="btn-danger text-sm py-2">
                        Delete
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                    {editingId ? "Edit Child" : "Add Child"}
                  </h2>
                  <button onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input"
                      placeholder="Enter child's name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="label">Avatar</label>
                    <div className="grid grid-cols-6 gap-2">
                      {avatars.map((avatar) => (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setForm({ ...form, avatar: avatar.id })}
                          className={`p-2 rounded-xl text-2xl flex items-center justify-center transition-all ${
                            form.avatar === avatar.id
                              ? "bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400 scale-110"
                              : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
                          }`}
                          title={avatar.label}
                        >
                          {avatar.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">PIN (optional)</label>
                    <input
                      type="text"
                      value={form.pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setForm({ ...form, pin: val });
                      }}
                      className="input"
                      placeholder="4-digit PIN for child login"
                      maxLength={4}
                      inputMode="numeric"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Used for the child to log in to their own view
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeForm} className="flex-1 btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                      {editingId ? "Save Changes" : "Add Child"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Star Adjustment Modal */}
      <AnimatePresence>
        {starAdjust && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setStarAdjust(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">
                Adjust Stars
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Amount</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setStarAdjust({ ...starAdjust, amount: starAdjust.amount - 1 })
                      }
                      className="btn-secondary py-2 px-4 text-lg font-bold"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={starAdjust.amount}
                      onChange={(e) =>
                        setStarAdjust({ ...starAdjust, amount: parseInt(e.target.value) || 0 })
                      }
                      className="input text-center text-xl font-bold"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setStarAdjust({ ...starAdjust, amount: starAdjust.amount + 1 })
                      }
                      className="btn-secondary py-2 px-4 text-lg font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Reason (optional)</label>
                  <input
                    type="text"
                    value={starAdjust.description}
                    onChange={(e) =>
                      setStarAdjust({ ...starAdjust, description: e.target.value })
                    }
                    className="input"
                    placeholder="e.g., Bonus for helping"
                  />
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStarAdjust(null)} className="flex-1 btn-secondary">
                    Cancel
                  </button>
                  <button
                    onClick={handleStarAdjust}
                    disabled={starAdjust.amount === 0}
                    className="flex-1 btn-primary"
                  >
                    {starAdjust.amount > 0 ? `Add ${starAdjust.amount}` : starAdjust.amount < 0 ? `Remove ${Math.abs(starAdjust.amount)}` : "Enter amount"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
