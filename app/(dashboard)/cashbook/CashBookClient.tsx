"use client";

import { useState } from "react";
import { formatPKR, formatDate, CASH_CATEGORIES } from "@/lib/utils";

interface CashEntry {
  id: string;
  date: string;
  type: string;
  description: string;
  amount: number;
  category: string;
}

interface Props {
  initialEntries: CashEntry[];
  totalInflow: number;
  totalOutflow: number;
}

export default function CashBookClient({ initialEntries, totalInflow, totalOutflow }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CashEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "INFLOW",
    description: "",
    amount: "",
    category: CASH_CATEGORIES[0],
  });

  const filtered = entries.filter((e) => filterType === "all" || e.type === filterType);
  const balance = entries.reduce((s, e) => (e.type === "INFLOW" ? s + e.amount : s - e.amount), 0);

  function openCreate(type?: string) {
    setEditingEntry(null);
    setForm({
      date: new Date().toISOString().split("T")[0],
      type: type ?? "INFLOW",
      description: "",
      amount: "",
      category: CASH_CATEGORIES[0],
    });
    setShowModal(true);
  }

  function openEdit(entry: CashEntry) {
    setEditingEntry(entry);
    setForm({
      date: entry.date.split("T")[0],
      type: entry.type,
      description: entry.description,
      amount: String(entry.amount),
      category: entry.category,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = { ...form, amount: parseFloat(form.amount) };
    const url = editingEntry ? `/api/cashbook/${editingEntry.id}` : "/api/cashbook";
    const method = editingEntry ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated: CashEntry[] = await (await fetch("/api/cashbook")).json();
      setEntries(updated);
      setShowModal(false);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    await fetch(`/api/cashbook/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Cash Book</h1>
          <p className="page-subtitle">Daily cash inflow and outflow tracking</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => openCreate("OUTFLOW")} className="btn-secondary">- Cash Out</button>
          <button onClick={() => openCreate("INFLOW")} className="btn-primary">+ Cash In</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Inflow</p>
          <p className="text-2xl font-bold text-green-400">{formatPKR(totalInflow)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Outflow</p>
          <p className="text-2xl font-bold text-red-400">{formatPKR(totalOutflow)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Current Balance</p>
          <p className={`text-2xl font-bold ${balance >= 0 ? "text-sky-400" : "text-red-400"}`}>{formatPKR(balance)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 flex gap-3">
        {["all", "INFLOW", "OUTFLOW"].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="px-4 py-2 rounded-xl text-sm transition-all"
            style={
              filterType === t
                ? { background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)" }
                : { background: "transparent", color: "#94a3b8", border: "1px solid transparent" }
            }
          >
            {t === "all" ? "All Entries" : t === "INFLOW" ? "Cash In" : "Cash Out"}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500 self-center">{filtered.length} entries</span>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header grid grid-cols-12 gap-4">
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Date</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Type</span>
          <span className="col-span-3 text-xs text-slate-500 font-medium uppercase tracking-wide">Description</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Category</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide text-right">Amount</span>
          <span className="col-span-1 text-xs text-slate-500 font-medium uppercase tracking-wide text-right">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">No cash entries found</div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="table-row grid grid-cols-12 gap-4 items-center">
              <span className="col-span-2 text-xs text-slate-400">{formatDate(entry.date)}</span>
              <span className="col-span-2">
                <span className={`badge ${entry.type === "INFLOW" ? "badge-green" : "badge-red"}`}>
                  {entry.type === "INFLOW" ? "↑ Cash In" : "↓ Cash Out"}
                </span>
              </span>
              <span className="col-span-3 text-sm text-white">{entry.description}</span>
              <span className="col-span-2 text-xs text-slate-400">{entry.category}</span>
              <span className={`col-span-2 text-right text-sm font-semibold ${entry.type === "INFLOW" ? "text-green-400" : "text-red-400"}`}>
                {entry.type === "INFLOW" ? "+" : "-"}{formatPKR(entry.amount)}
              </span>
              <div className="col-span-1 flex justify-end gap-2">
                <button onClick={() => openEdit(entry)} className="text-slate-400 hover:text-sky-400 transition-colors text-xs">Edit</button>
                <button onClick={() => handleDelete(entry.id)} className="text-slate-400 hover:text-red-400 transition-colors text-xs">Del</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">
              {editingEntry ? "Edit Entry" : "Add Cash Entry"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                {["INFLOW", "OUTFLOW"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t })}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={
                      form.type === t
                        ? {
                            background: t === "INFLOW" ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)",
                            border: `1px solid ${t === "INFLOW" ? "rgba(52,211,153,0.4)" : "rgba(248,113,113,0.4)"}`,
                            color: t === "INFLOW" ? "#34d399" : "#f87171",
                          }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                    }
                  >
                    {t === "INFLOW" ? "↑ Cash In" : "↓ Cash Out"}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="glass-input" required />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Amount (PKR)</label>
                  <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="glass-input" required min="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Description</label>
                <input type="text" placeholder="What is this for?" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="glass-input" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="glass-select">
                  {CASH_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? "Saving..." : editingEntry ? "Update" : "Add Entry"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
