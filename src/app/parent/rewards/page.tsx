"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";
import { rewardEmojis } from "@/lib/icons";

type Reward = {
  id: string;
  title: string;
  description: string;
  icon: string;
  starCost: number;
  isEnabled: boolean;
  createdAt: string;
};

const emptyForm = {
  title: "",
  description: "",
  icon: "gift",
  starCost: 5,
};

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    const { data } = await api<Reward[]>("/api/rewards");
    if (data) setRewards(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(reward: Reward) {
    setEditingId(reward.id);
    setForm({
      title: reward.title,
      description: reward.description,
      icon: reward.icon,
      starCost: reward.starCost,
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (form.starCost < 1) {
      toast.error("Star cost must be at least 1");
      return;
    }

    setSaving(true);
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon,
      starCost: form.starCost,
    };

    if (editingId) {
      const { error } = await api(`/api/rewards/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Reward updated!");
        closeForm();
        fetchRewards();
      }
    } else {
      const { error } = await api("/api/rewards", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Reward created!");
        closeForm();
        fetchRewards();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await api(`/api/rewards/${id}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
    } else {
      toast.success("Reward deleted");
      setConfirmDelete(null);
      fetchRewards();
    }
  }

  async function handleToggleEnabled(reward: Reward) {
    const { error } = await api(`/api/rewards/${reward.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isEnabled: !reward.isEnabled }),
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success(reward.isEnabled ? "Reward disabled" : "Reward enabled");
      fetchRewards();
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
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Rewards</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Set up rewards children can earn with stars</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Reward
        </button>
      </div>

      {/* Reward list */}
      {rewards.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-12">
          <div className="text-5xl mb-4">&#127873;</div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">No rewards yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create rewards your kids can earn with their stars!</p>
          <button onClick={openAdd} className="btn-primary">Add Reward</button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward, i) => (
            <motion.div
              key={reward.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`card-hover relative ${!reward.isEnabled ? "opacity-60" : ""}`}
            >
              {/* Enabled toggle */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => handleToggleEnabled(reward)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    reward.isEnabled
                      ? "bg-primary-500"
                      : "bg-gray-300 dark:bg-slate-600"
                  }`}
                  title={reward.isEnabled ? "Disable" : "Enable"}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      reward.isEnabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Content */}
              <div className="flex items-center gap-3 mb-3 pr-14">
                <div className="w-12 h-12 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {rewardEmojis[reward.icon] || rewardEmojis.gift}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white truncate">{reward.title}</h3>
                  <div className="flex items-center gap-1 text-sm text-star-gold">
                    <span>&#11088;</span>
                    <span className="font-semibold">{reward.starCost} stars</span>
                  </div>
                </div>
              </div>

              {reward.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{reward.description}</p>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-2">
                <button
                  onClick={() => openEdit(reward)}
                  className="flex-1 btn-secondary text-sm py-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(reward.id)}
                  className="btn-danger text-sm py-2 px-4"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {/* Delete confirmation */}
              <AnimatePresence>
                {confirmDelete === reward.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute inset-0 bg-white dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 z-10 shadow-lg"
                  >
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Delete this reward?</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center">
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm py-2">
                        Cancel
                      </button>
                      <button onClick={() => handleDelete(reward.id)} className="btn-danger text-sm py-2">
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

      {/* Add/Edit Reward Form Modal */}
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
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
                    {editingId ? "Edit Reward" : "Add Reward"}
                  </h2>
                  <button onClick={closeForm} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">Title</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="input"
                      placeholder="e.g., Extra screen time"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="label">Description (optional)</label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input"
                      placeholder="Details about this reward"
                    />
                  </div>

                  <div>
                    <label className="label">Icon</label>
                    <div className="grid grid-cols-6 gap-2">
                      {Object.entries(rewardEmojis).map(([key, emoji]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setForm({ ...form, icon: key })}
                          className={`p-2 rounded-xl text-xl flex items-center justify-center transition-all ${
                            form.icon === key
                              ? "bg-primary-100 dark:bg-primary-900/40 ring-2 ring-primary-400 scale-110"
                              : "bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600"
                          }`}
                          title={key}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Star Cost</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, starCost: Math.max(1, form.starCost - 1) })}
                        className="btn-secondary py-2 px-4 text-lg font-bold"
                      >
                        -
                      </button>
                      <div className="flex-1 relative">
                        <input
                          type="number"
                          value={form.starCost}
                          onChange={(e) => setForm({ ...form, starCost: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="input text-center text-xl font-bold"
                          min={1}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-star-gold">&#11088;</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, starCost: form.starCost + 1 })}
                        className="btn-secondary py-2 px-4 text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    {/* Quick presets */}
                    <div className="flex gap-2 mt-2">
                      {[3, 5, 10, 15, 20, 25].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm({ ...form, starCost: val })}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            form.starCost === val
                              ? "bg-star-gold text-white"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeForm} className="flex-1 btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                      {editingId ? "Save Changes" : "Add Reward"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
