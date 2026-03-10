"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { api } from "@/hooks/useFetch";
import { choreEmojis, getAvatarEmoji } from "@/lib/icons";

type Chore = {
  id: string;
  title: string;
  description: string;
  icon: string;
  starValue: number;
  recurringType: string;
  recurringDays: string;
  isShared: boolean;
  isActive: boolean;
  createdAt: string;
};

type Child = {
  id: string;
  name: string;
  avatar: string;
};

type Assignment = {
  id: string;
  status: string;
  chore: { id: string };
  child: { id: string; name: string; avatar: string };
};

const emptyForm = {
  title: "",
  description: "",
  icon: "sparkles",
  starValue: 1,
  recurringType: "none",
  recurringDays: [] as string[],
  isShared: false,
};

const weekdays = [
  { key: "sun", label: "S" },
  { key: "mon", label: "M" },
  { key: "tue", label: "T" },
  { key: "wed", label: "W" },
  { key: "thu", label: "T" },
  { key: "fri", label: "F" },
  { key: "sat", label: "S" },
];

export default function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [assignChildId, setAssignChildId] = useState("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().split("T")[0]);
  const [generating, setGenerating] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, Assignment[]>>({});
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [choresRes, childrenRes, assignRes] = await Promise.all([
      api<Chore[]>("/api/chores"),
      api<Child[]>("/api/children"),
      api<Assignment[]>("/api/assignments"),
    ]);
    if (choresRes.data) setChores(choresRes.data);
    if (childrenRes.data) setChildren(childrenRes.data);
    if (assignRes.data) {
      const grouped: Record<string, Assignment[]> = {};
      for (const a of assignRes.data) {
        if (!grouped[a.chore.id]) grouped[a.chore.id] = [];
        grouped[a.chore.id].push(a);
      }
      setAssignments(grouped);
    }
    setLoading(false);
  }, []);

  const fetchAssignments = useCallback(async () => {
    const { data } = await api<Assignment[]>("/api/assignments");
    if (data) {
      const grouped: Record<string, Assignment[]> = {};
      for (const a of data) {
        if (!grouped[a.chore.id]) grouped[a.chore.id] = [];
        grouped[a.chore.id].push(a);
      }
      setAssignments(grouped);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(chore: Chore) {
    setEditingId(chore.id);
    setForm({
      title: chore.title,
      description: chore.description,
      icon: chore.icon,
      starValue: chore.starValue,
      recurringType: chore.recurringType,
      recurringDays: chore.recurringDays ? chore.recurringDays.split(",").map((d) => d.trim()) : [],
      isShared: chore.isShared,
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

    setSaving(true);
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      icon: form.icon,
      starValue: form.starValue,
      recurringType: form.recurringType,
      recurringDays: form.recurringType === "weekly" ? form.recurringDays.join(",") : "",
      isShared: form.isShared,
    };

    if (editingId) {
      const { error } = await api(`/api/chores/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Chore updated!");
        closeForm();
        fetchData();
      }
    } else {
      const { error } = await api("/api/chores", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (error) {
        toast.error(error);
      } else {
        toast.success("Chore created!");
        closeForm();
        fetchData();
      }
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    const { error } = await api(`/api/chores/${id}`, { method: "DELETE" });
    if (error) {
      toast.error(error);
    } else {
      toast.success("Chore deleted");
      setConfirmDelete(null);
      fetchData();
    }
  }

  async function handleAssign() {
    if (!assignModal || !assignChildId) {
      toast.error("Please select a child");
      return;
    }
    const { error } = await api("/api/assignments", {
      method: "POST",
      body: JSON.stringify({
        choreId: assignModal,
        childId: assignChildId,
        dueDate: assignDate,
      }),
    });
    if (error) {
      toast.error(error);
    } else {
      toast.success("Chore assigned!");
      setAssignModal(null);
      setAssignChildId("");
      fetchAssignments();
    }
  }

  async function handleRemoveAssignment(assignmentId: string, choreId: string) {
    setRemovingId(assignmentId);
    const { error } = await api(`/api/assignments/${assignmentId}`, { method: "DELETE" });
    if (error) {
      toast.error("Failed to remove assignment");
    } else {
      setAssignments((prev) => ({
        ...prev,
        [choreId]: (prev[choreId] || []).filter((a) => a.id !== assignmentId),
      }));
      toast.success("Assignment removed");
    }
    setRemovingId(null);
  }

  async function handleGenerateAssignments() {
    setGenerating(true);
    const { data, error } = await api<{ message: string; created: string[] }>(
      "/api/assignments/generate",
      { method: "POST", body: JSON.stringify({}) }
    );
    setGenerating(false);
    if (error) {
      toast.error(error);
    } else if (data) {
      toast.success(data.message);
      fetchAssignments();
    }
  }

  function toggleDay(day: string) {
    setForm((f) => ({
      ...f,
      recurringDays: f.recurringDays.includes(day)
        ? f.recurringDays.filter((d) => d !== day)
        : [...f.recurringDays, day],
    }));
  }

  function getRecurringLabel(chore: Chore) {
    if (chore.recurringType === "daily") return "Daily";
    if (chore.recurringType === "weekly" && chore.recurringDays) {
      return `Weekly (${chore.recurringDays})`;
    }
    return "One-time";
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Chores</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Create and manage family chores</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateAssignments}
            disabled={generating}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Generate Today
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Chore
          </button>
        </div>
      </div>

      {/* Chore list */}
      {chores.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-12">
          <div className="text-5xl mb-4">&#128203;</div>
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">No chores yet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Create your first chore to get started!</p>
          <button onClick={openAdd} className="btn-primary">Add Chore</button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {chores.map((chore, i) => (
            <motion.div
              key={chore.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-hover"
            >
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {choreEmojis[chore.icon] || choreEmojis.sparkles}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-gray-900 dark:text-white">{chore.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="text-star-gold">&#11088;</span>
                      {chore.starValue} {chore.starValue === 1 ? "star" : "stars"}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span>{getRecurringLabel(chore)}</span>
                    {chore.isShared && (
                      <>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <span className="flex items-center gap-1 text-purple-500 dark:text-purple-400">
                          {"\uD83D\uDC65"} Shared
                        </span>
                      </>
                    )}
                  </div>
                  {chore.description && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{chore.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(chore)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setConfirmDelete(chore.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Today's assignments */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-500 mr-1">Today:</span>
                  {(assignments[chore.id] || []).length === 0 ? (
                    <span className="text-xs text-gray-300 dark:text-gray-600 italic">No assignments</span>
                  ) : (
                    (assignments[chore.id] || []).map((a) => (
                      <div
                        key={a.id}
                        className={`inline-flex items-center gap-1.5 pl-1 pr-1.5 py-0.5 rounded-full text-xs font-medium ${
                          a.status !== "pending"
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <span className="text-sm">{getAvatarEmoji(a.child.avatar)}</span>
                        <span>{a.child.name}</span>
                        {a.status !== "pending" ? (
                          <span className="text-green-500 text-xs">&#x2705;</span>
                        ) : (
                          <button
                            onClick={() => handleRemoveAssignment(a.id, chore.id)}
                            disabled={removingId === a.id}
                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-200 dark:hover:bg-red-900/40 text-red-400 transition-colors disabled:opacity-50"
                            title={`Remove ${a.child.name}`}
                          >
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))
                  )}
                  <button
                    onClick={() => {
                      setAssignModal(chore.id);
                      const choreAssignments = assignments[chore.id] || [];
                      const assignedChildIds = choreAssignments.map((a) => a.child.id);
                      const unassigned = children.filter((c) => !assignedChildIds.includes(c.id));
                      if (unassigned.length > 0) {
                        setAssignChildId(unassigned[0].id);
                      } else if (children.length > 0) {
                        setAssignChildId(children[0].id);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
                    title="Assign to child"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Assign
                  </button>
                </div>
              </div>

              {/* Delete confirmation inline */}
              <AnimatePresence>
                {confirmDelete === chore.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete this chore?
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(null)} className="btn-secondary text-sm py-1.5">
                          Cancel
                        </button>
                        <button onClick={() => handleDelete(chore.id)} className="btn-danger text-sm py-1.5">
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Chore Form Modal */}
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
                    {editingId ? "Edit Chore" : "Add Chore"}
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
                      placeholder="e.g., Make the bed"
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
                      placeholder="Details about this chore"
                    />
                  </div>

                  <div>
                    <label className="label">Icon</label>
                    <div className="grid grid-cols-8 gap-2">
                      {Object.entries(choreEmojis).map(([key, emoji]) => (
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
                    <label className="label">Star Value</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setForm({ ...form, starValue: val })}
                          className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${
                            form.starValue === val
                              ? "bg-star-gold text-white shadow-md scale-110"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="label">Recurring</label>
                    <div className="flex gap-2 mb-3">
                      {[
                        { value: "none", label: "One-time" },
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm({ ...form, recurringType: opt.value })}
                          className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                            form.recurringType === opt.value
                              ? "bg-primary-500 text-white shadow-md"
                              : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {form.recurringType === "weekly" && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        className="overflow-hidden"
                      >
                        <label className="label">Days</label>
                        <div className="flex gap-2">
                          {weekdays.map((day) => (
                            <button
                              key={day.key}
                              type="button"
                              onClick={() => toggleDay(day.key)}
                              className={`w-9 h-9 rounded-full text-sm font-bold transition-all ${
                                form.recurringDays.includes(day.key)
                                  ? "bg-primary-500 text-white"
                                  : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Shared chore toggle */}
                  <div>
                    <label className="label">Shared Chore</label>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, isShared: !form.isShared })}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${
                        form.isShared
                          ? "bg-purple-100 dark:bg-purple-900/40 ring-2 ring-purple-400 text-purple-700 dark:text-purple-300"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                      }`}
                    >
                      <span className="text-xl">{"\uD83D\uDC65"}</span>
                      <div className="text-left flex-1">
                        <div className="font-bold">{form.isShared ? "Shared" : "Individual"}</div>
                        <div className={`text-xs ${form.isShared ? "text-purple-500 dark:text-purple-400" : "text-gray-400 dark:text-gray-500"}`}>
                          {form.isShared
                            ? "Only one child needs to complete this"
                            : "Each child completes independently"}
                        </div>
                      </div>
                      <div className={`w-10 h-6 rounded-full transition-colors relative ${
                        form.isShared ? "bg-purple-500" : "bg-gray-300 dark:bg-slate-600"
                      }`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          form.isShared ? "translate-x-5" : "translate-x-1"
                        }`} />
                      </div>
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeForm} className="flex-1 btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                      {saving && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                      {editingId ? "Save Changes" : "Add Chore"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setAssignModal(null); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">
                Assign Chore
              </h2>

              {(() => {
                const choreAssignments = assignModal ? (assignments[assignModal] || []) : [];
                const assignedChildIds = choreAssignments.map((a) => a.child.id);
                const unassignedChildren = children.filter((c) => !assignedChildIds.includes(c.id));

                if (children.length === 0) return (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No children to assign to.</p>
                    <a href="/parent/children" className="btn-primary text-sm">Add Children</a>
                  </div>
                );

                if (unassignedChildren.length === 0) return (
                  <div className="text-center py-4">
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">All children are already assigned this chore today.</p>
                    <button onClick={() => setAssignModal(null)} className="btn-secondary text-sm">Close</button>
                  </div>
                );

                return (
                <div className="space-y-4">
                  <div>
                    <label className="label">Child</label>
                    <select
                      value={assignChildId}
                      onChange={(e) => setAssignChildId(e.target.value)}
                      className="input"
                    >
                      {unassignedChildren.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Due Date</label>
                    <input
                      type="date"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                      className="input"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button onClick={() => setAssignModal(null)} className="flex-1 btn-secondary">
                      Cancel
                    </button>
                    <button onClick={handleAssign} className="flex-1 btn-primary">
                      Assign
                    </button>
                  </div>
                </div>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
