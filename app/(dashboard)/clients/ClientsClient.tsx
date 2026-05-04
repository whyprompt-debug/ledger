"use client";

import { useState } from "react";
import { formatPKR, formatDate, getMonthName } from "@/lib/utils";

interface Revenue {
  id: string;
  month: number;
  year: number;
  amount: number;
  notes: string;
}

interface Client {
  id: string;
  name: string;
  contactInfo: string;
  isActive: boolean;
  createdAt: string;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  revenues: Revenue[];
}

export default function ClientsClient({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState(initialClients);
  const [showModal, setShowModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", contactInfo: "" });
  const [revenueForm, setRevenueForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    notes: "",
  });

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const totalRevenue = clients.reduce((s, c) => s + c.totalRevenue, 0);
  const totalExpenses = clients.reduce((s, c) => s + c.totalExpenses, 0);
  const totalProfit = clients.reduce((s, c) => s + c.profit, 0);

  function openCreate() {
    setEditingClient(null);
    setForm({ name: "", contactInfo: "" });
    setShowModal(true);
  }

  function openEdit(c: Client) {
    setEditingClient(c);
    setForm({ name: c.name, contactInfo: c.contactInfo });
    setShowModal(true);
  }

  function openRevenue(c: Client) {
    setSelectedClient(c);
    setRevenueForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: "", notes: "" });
    setShowRevenueModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const url = editingClient ? `/api/clients/${editingClient.id}` : "/api/clients";
    const method = editingClient ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const updated = await (await fetch("/api/clients")).json();
      setClients(updated);
      setShowModal(false);
    }
    setLoading(false);
  }

  async function handleRevenueSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    const body = { ...revenueForm, amount: parseFloat(revenueForm.amount), clientId: selectedClient.id };
    const res = await fetch("/api/client-revenues", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const updated = await (await fetch("/api/clients")).json();
      setClients(updated);
      setShowRevenueModal(false);
    }
    setLoading(false);
  }

  async function handleDeleteRevenue(clientId: string, revenueId: string) {
    if (!confirm("Delete this revenue entry?")) return;
    await fetch(`/api/client-revenues/${revenueId}`, { method: "DELETE" });
    const updated = await (await fetch("/api/clients")).json();
    setClients(updated);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Track revenue and profitability per client</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Client</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Clients</p>
          <p className="text-2xl font-bold text-white">{clients.filter((c) => c.isActive).length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Revenue</p>
          <p className="text-2xl font-bold text-sky-400">{formatPKR(totalRevenue)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Client Expenses</p>
          <p className="text-2xl font-bold text-red-400">{formatPKR(totalExpenses)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Profit</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{formatPKR(totalProfit)}</p>
        </div>
      </div>

      {/* Client Cards */}
      <div className="space-y-4">
        {clients.map((client) => (
          <div key={client.id} className="glass-card">
            {/* Client Header */}
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
                  style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(167,139,250,0.1))", border: "1px solid rgba(56,189,248,0.2)" }}>
                  {client.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{client.name}</p>
                  {client.contactInfo && <p className="text-xs text-slate-500">{client.contactInfo}</p>}
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-slate-500">Revenue</p>
                  <p className="font-bold text-sky-400">{formatPKR(client.totalRevenue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Expenses</p>
                  <p className="font-bold text-red-400">{formatPKR(client.totalExpenses)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Profit</p>
                  <p className={`font-bold text-lg ${client.profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                    {formatPKR(client.profit)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openRevenue(client)} className="btn-success text-xs">+ Revenue</button>
                  <button onClick={() => openEdit(client)} className="btn-secondary text-xs">Edit</button>
                </div>
              </div>
            </div>

            {/* Revenue History */}
            {client.revenues.length > 0 && (
              <div className="border-t px-6 pb-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <p className="text-xs text-slate-500 mt-4 mb-3">Revenue History</p>
                <div className="flex gap-3 flex-wrap">
                  {client.revenues.slice(0, 6).map((r) => (
                    <div key={r.id} className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs"
                      style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)" }}>
                      <span className="text-slate-400">{getMonthName(r.month).slice(0, 3)} {r.year}</span>
                      <span className="font-semibold text-sky-400">{formatPKR(r.amount)}</span>
                      <button onClick={() => handleDeleteRevenue(client.id, r.id)} className="text-slate-600 hover:text-red-400 ml-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {clients.length === 0 && (
          <div className="glass-card p-12 text-center text-slate-500">
            <p className="text-4xl mb-3">🏢</p>
            <p className="text-lg font-medium text-slate-400">No clients yet</p>
            <p className="text-sm mt-1">Add your first client to start tracking revenue</p>
          </div>
        )}
      </div>

      {/* Client Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">{editingClient ? "Edit Client" : "Add Client"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Client / Company Name</label>
                <input type="text" placeholder="e.g. TechCorp Pakistan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass-input" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Contact Info (optional)</label>
                <input type="text" placeholder="email or phone" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} className="glass-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : editingClient ? "Update" : "Add Client"}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && selectedClient && (
        <div className="modal-overlay" onClick={() => setShowRevenueModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">Record Revenue</h2>
            <p className="text-sm text-slate-400 mb-5">{selectedClient.name}</p>
            <form onSubmit={handleRevenueSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Month</label>
                  <select value={revenueForm.month} onChange={(e) => setRevenueForm({ ...revenueForm, month: parseInt(e.target.value) })} className="glass-select">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Year</label>
                  <input type="number" value={revenueForm.year} onChange={(e) => setRevenueForm({ ...revenueForm, year: parseInt(e.target.value) })} className="glass-input" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Amount (PKR)</label>
                <input type="number" placeholder="0" value={revenueForm.amount} onChange={(e) => setRevenueForm({ ...revenueForm, amount: e.target.value })} className="glass-input" required min="0" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Notes (optional)</label>
                <input type="text" placeholder="Invoice # or description" value={revenueForm.notes} onChange={(e) => setRevenueForm({ ...revenueForm, notes: e.target.value })} className="glass-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : "Record Revenue"}</button>
                <button type="button" onClick={() => setShowRevenueModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
