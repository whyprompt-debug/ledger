"use client";

import { useState } from "react";
import { formatPKR, formatDate, EXPENSE_CATEGORIES } from "@/lib/utils";

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  isRecurring: boolean;
  clientId: string | null;
  client: { id: string; name: string } | null;
}

interface Client {
  id: string;
  name: string;
}

interface Props {
  initialExpenses: Expense[];
  clients: Client[];
  totalExpenses: number;
  topCategory: [string, number] | null;
}

export default function ExpensesClient({ initialExpenses, clients, totalExpenses, topCategory }: Props) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    category: EXPENSE_CATEGORIES[0],
    description: "",
    amount: "",
    isRecurring: false,
    clientId: "",
  });

  const filtered = expenses.filter((e) => {
    const matchCat = filterCategory === "all" || e.category === filterCategory;
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  function openCreate() {
    setEditingExpense(null);
    setForm({
      date: new Date().toISOString().split("T")[0],
      category: EXPENSE_CATEGORIES[0],
      description: "",
      amount: "",
      isRecurring: false,
      clientId: "",
    });
    setShowModal(true);
  }

  function openEdit(exp: Expense) {
    setEditingExpense(exp);
    setForm({
      date: exp.date.split("T")[0],
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      isRecurring: exp.isRecurring,
      clientId: exp.clientId ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = {
      ...form,
      amount: parseFloat(form.amount),
      clientId: form.clientId || null,
    };

    const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
    const method = editingExpense ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const updated: Expense[] = await (await fetch("/api/expenses")).json();
      setExpenses(updated);
      setShowModal(false);
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Expenses</h1>
          <p className="page-subtitle">Track daily operational costs and overheads</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Expense</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">{formatPKR(totalExpenses)}</p>
          <p className="text-xs text-slate-500 mt-1">All time</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Filtered Total</p>
          <p className="text-2xl font-bold text-orange-400">{formatPKR(filteredTotal)}</p>
          <p className="text-xs text-slate-500 mt-1">{filtered.length} entries shown</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Top Category</p>
          <p className="text-xl font-bold text-white">{topCategory ? topCategory[0] : "—"}</p>
          <p className="text-xs text-slate-500 mt-1">{topCategory ? formatPKR(topCategory[1]) : "No expenses"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex gap-4">
        <input
          type="text"
          placeholder="Search expenses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="glass-input flex-1"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="glass-select w-48"
        >
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="table-header grid grid-cols-12 gap-4">
          <span className="col-span-1 text-xs text-slate-500 font-medium uppercase tracking-wide">Date</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Category</span>
          <span className="col-span-4 text-xs text-slate-500 font-medium uppercase tracking-wide">Description</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Client</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide text-right">Amount</span>
          <span className="col-span-1 text-xs text-slate-500 font-medium uppercase tracking-wide text-right">Actions</span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-500 text-sm">No expenses found</div>
        ) : (
          filtered.map((exp) => (
            <div key={exp.id} className="table-row grid grid-cols-12 gap-4 items-center">
              <span className="col-span-1 text-xs text-slate-400">{formatDate(exp.date)}</span>
              <span className="col-span-2">
                <span className="badge badge-blue">{exp.category}</span>
              </span>
              <div className="col-span-4">
                <p className="text-sm text-white">{exp.description}</p>
                {exp.isRecurring && <span className="text-xs text-purple-400">↻ Recurring</span>}
              </div>
              <span className="col-span-2 text-xs text-slate-400">{exp.client?.name ?? "—"}</span>
              <span className="col-span-2 text-right text-sm font-semibold text-red-400">{formatPKR(exp.amount)}</span>
              <div className="col-span-1 flex justify-end gap-2">
                <button onClick={() => openEdit(exp)} className="text-slate-400 hover:text-sky-400 transition-colors text-xs">
                  Edit
                </button>
                <button onClick={() => handleDelete(exp.id)} className="text-slate-400 hover:text-red-400 transition-colors text-xs">
                  Del
                </button>
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
              {editingExpense ? "Edit Expense" : "Add Expense"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="glass-input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Amount (PKR)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="glass-input"
                    required
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="glass-select"
                >
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Description</label>
                <input
                  type="text"
                  placeholder="Describe the expense..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="glass-input"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Client (optional)</label>
                <select
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="glass-select"
                >
                  <option value="">— Not client-specific —</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isRecurring}
                  onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-slate-300">Recurring expense</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>
                  {loading ? "Saving..." : editingExpense ? "Update" : "Add Expense"}
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
