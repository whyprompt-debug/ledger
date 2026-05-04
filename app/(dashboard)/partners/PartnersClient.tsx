"use client";

import { useState } from "react";
import { formatPKR, formatDate, getMonthName } from "@/lib/utils";

interface Partner {
  id: string;
  name: string;
  sharePercentage: number;
  joinDate: string;
  isActive: boolean;
  outstandingLoan: number;
  totalDistributed: number;
  recentSalaries: { id: string; month: number; year: number; amount: number; isPaid: boolean }[];
}

export default function PartnersClient({ initialPartners }: { initialPartners: Partner[] }) {
  const [partners, setPartners] = useState(initialPartners);
  const [showModal, setShowModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", sharePercentage: "33.33" });
  const [salaryForm, setSalaryForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    isPaid: true,
  });

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function openCreate() {
    setEditingPartner(null);
    setForm({ name: "", sharePercentage: "33.33" });
    setShowModal(true);
  }

  function openEdit(p: Partner) {
    setEditingPartner(p);
    setForm({ name: p.name, sharePercentage: String(p.sharePercentage) });
    setShowModal(true);
  }

  function openSalary(p: Partner) {
    setSelectedPartner(p);
    setSalaryForm({ month: new Date().getMonth() + 1, year: new Date().getFullYear(), amount: "", isPaid: true });
    setShowSalaryModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = { ...form, sharePercentage: parseFloat(form.sharePercentage) };
    const url = editingPartner ? `/api/partners/${editingPartner.id}` : "/api/partners";
    const method = editingPartner ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const updated = await (await fetch("/api/partners")).json();
      setPartners(updated);
      setShowModal(false);
    }
    setLoading(false);
  }

  async function handleSalarySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPartner) return;
    setLoading(true);
    const body = { ...salaryForm, amount: parseFloat(salaryForm.amount), partnerId: selectedPartner.id };
    const res = await fetch("/api/partner-salaries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowSalaryModal(false);
      alert("Partner salary recorded!");
    }
    setLoading(false);
  }

  const totalShares = partners.reduce((s, p) => s + p.sharePercentage, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Partners</h1>
          <p className="page-subtitle">Manage partnership stakes and profit distributions</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Partner</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Partners</p>
          <p className="text-2xl font-bold text-white">{partners.filter((p) => p.isActive).length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Partners' Profit Share</p>
          <p className="text-2xl font-bold text-purple-400">60% of Net Profit</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Distributed (All Time)</p>
          <p className="text-2xl font-bold text-sky-400">{formatPKR(partners.reduce((s, p) => s + p.totalDistributed, 0))}</p>
        </div>
      </div>

      {/* Partner Cards */}
      <div className="grid grid-cols-3 gap-4">
        {partners.map((partner, idx) => {
          const colors = ["#38bdf8", "#a78bfa", "#34d399"];
          const color = colors[idx % colors.length];
          return (
            <div key={partner.id} className="glass-card p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${color}33, ${color}11)`, border: `1px solid ${color}44` }}
                >
                  {partner.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{partner.name}</p>
                  <p className="text-xs text-slate-500">Partner since {formatDate(partner.joinDate)}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Equity Share</span>
                  <span className="font-bold" style={{ color }}>{partner.sharePercentage.toFixed(2)}%</span>
                </div>
                <div className="w-full rounded-full h-1.5" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${partner.sharePercentage}%`, background: color }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-slate-500 mb-1">Total Distributed</p>
                  <p className="font-bold text-green-400">{formatPKR(partner.totalDistributed)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-slate-500 mb-1">Outstanding Loan</p>
                  <p className={`font-bold ${partner.outstandingLoan > 0 ? "text-orange-400" : "text-slate-400"}`}>
                    {formatPKR(partner.outstandingLoan)}
                  </p>
                </div>
              </div>

              {partner.recentSalaries.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Recent Drawings</p>
                  {partner.recentSalaries.slice(0, 2).map((s) => (
                    <div key={s.id} className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{getMonthName(s.month)} {s.year}</span>
                      <span className={s.isPaid ? "text-green-400" : "text-yellow-400"}>{formatPKR(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={() => openSalary(partner)} className="btn-success flex-1 text-xs">Record Drawing</button>
                <button onClick={() => openEdit(partner)} className="btn-secondary flex-1 text-xs">Edit</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Partner Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">{editingPartner ? "Edit Partner" : "Add Partner"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Full Name</label>
                <input type="text" placeholder="Partner name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass-input" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Equity Share (%)</label>
                <input type="number" placeholder="33.33" step="0.01" value={form.sharePercentage} onChange={(e) => setForm({ ...form, sharePercentage: e.target.value })} className="glass-input" required min="0" max="100" />
              </div>
              <p className="text-xs text-slate-500">Current total shares: {totalShares.toFixed(2)}%</p>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : editingPartner ? "Update" : "Add Partner"}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawing Modal */}
      {showSalaryModal && selectedPartner && (
        <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">Record Partner Drawing</h2>
            <p className="text-sm text-slate-400 mb-5">{selectedPartner.name}</p>
            <form onSubmit={handleSalarySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Month</label>
                  <select value={salaryForm.month} onChange={(e) => setSalaryForm({ ...salaryForm, month: parseInt(e.target.value) })} className="glass-select">
                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Year</label>
                  <input type="number" value={salaryForm.year} onChange={(e) => setSalaryForm({ ...salaryForm, year: parseInt(e.target.value) })} className="glass-input" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Amount (PKR)</label>
                <input type="number" placeholder="0" value={salaryForm.amount} onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })} className="glass-input" required min="0" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : "Record Drawing"}</button>
                <button type="button" onClick={() => setShowSalaryModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
