"use client";

import { useState } from "react";
import { formatPKR, getMonthName } from "@/lib/utils";

interface MonthData {
  month: number;
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  netProfit: number;
  partnersShare: number;
  companyShare: number;
  zakatShare: number;
  isClosed: boolean;
  closedId: string | null;
  notes: string;
}

interface Partner {
  id: string;
  name: string;
  sharePercentage: number;
}

interface Props {
  monthsData: MonthData[];
  partners: Partner[];
}

export default function MonthlyClient({ monthsData, partners }: Props) {
  const [months, setMonths] = useState(monthsData);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");

  function openClose(m: MonthData) {
    setSelectedMonth(m);
    setNotes(m.notes);
  }

  async function handleClose() {
    if (!selectedMonth) return;
    setLoading(true);

    const body = {
      month: selectedMonth.month,
      year: selectedMonth.year,
      totalRevenue: selectedMonth.totalRevenue,
      totalExpenses: selectedMonth.totalExpenses,
      totalSalaries: selectedMonth.totalSalaries,
      netProfit: selectedMonth.netProfit,
      partnersShare: selectedMonth.partnersShare,
      companyShare: selectedMonth.companyShare,
      zakatShare: selectedMonth.zakatShare,
      notes,
      distributions: partners.map((p) => ({
        partnerId: p.id,
        amount: (selectedMonth.partnersShare * p.sharePercentage) / 100,
      })),
    };

    const res = await fetch("/api/monthly-close", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setMonths((prev) =>
        prev.map((m) =>
          m.month === selectedMonth.month && m.year === selectedMonth.year
            ? { ...m, isClosed: true, notes }
            : m
        )
      );
      setSelectedMonth(null);
      alert("Month closed successfully!");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-title">Monthly Closing</h1>
        <p className="page-subtitle">Review financial summary and close months with profit distribution</p>
      </div>

      {/* Distribution Info */}
      <div className="glass-card p-5">
        <p className="text-sm font-semibold text-white mb-3">Profit Distribution Formula</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)" }}>
            <p className="text-2xl font-bold text-sky-400">60%</p>
            <p className="text-xs text-slate-400 mt-1">Partners</p>
            <p className="text-xs text-slate-500">Split by equity stake</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" }}>
            <p className="text-2xl font-bold text-purple-400">35%</p>
            <p className="text-xs text-slate-400 mt-1">Company Reserve</p>
            <p className="text-xs text-slate-500">Retained earnings</p>
          </div>
          <div className="rounded-xl p-4 text-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)" }}>
            <p className="text-2xl font-bold text-green-400">5%</p>
            <p className="text-xs text-slate-400 mt-1">Zakat</p>
            <p className="text-xs text-slate-500">Charitable obligation</p>
          </div>
        </div>
      </div>

      {/* Monthly Table */}
      <div className="table-container">
        <div className="table-header grid grid-cols-12 gap-3">
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Period</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Revenue</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Expenses</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Net Profit</span>
          <span className="col-span-2 text-xs text-slate-500 font-medium uppercase tracking-wide">Partners (60%)</span>
          <span className="col-span-1 text-xs text-slate-500 font-medium uppercase tracking-wide">Status</span>
          <span className="col-span-1 text-xs text-slate-500 font-medium uppercase tracking-wide">Action</span>
        </div>
        {months.map((m) => (
          <div key={`${m.month}-${m.year}`} className="table-row grid grid-cols-12 gap-3 items-center">
            <div className="col-span-2">
              <p className="text-sm font-semibold text-white">{getMonthName(m.month)}</p>
              <p className="text-xs text-slate-500">{m.year}</p>
            </div>
            <span className="col-span-2 text-sm font-medium text-sky-400">{formatPKR(m.totalRevenue)}</span>
            <span className="col-span-2 text-sm font-medium text-red-400">{formatPKR(m.totalExpenses + m.totalSalaries)}</span>
            <span className={`col-span-2 text-sm font-bold ${m.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {formatPKR(m.netProfit)}
            </span>
            <span className="col-span-2 text-sm text-purple-400">{formatPKR(m.partnersShare)}</span>
            <span className="col-span-1">
              {m.isClosed ? (
                <span className="badge badge-green text-xs">Closed</span>
              ) : (
                <span className="badge badge-yellow text-xs">Open</span>
              )}
            </span>
            <div className="col-span-1">
              {!m.isClosed && m.totalRevenue > 0 ? (
                <button
                  onClick={() => openClose(m)}
                  className="text-xs text-sky-400 hover:text-sky-300 transition-colors"
                >
                  Close →
                </button>
              ) : (
                <span className="text-xs text-slate-600">—</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Close Month Modal */}
      {selectedMonth && (
        <div className="modal-overlay" onClick={() => setSelectedMonth(null)}>
          <div className="modal-content max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">
              Close {getMonthName(selectedMonth.month)} {selectedMonth.year}
            </h2>
            <p className="text-sm text-slate-400 mb-6">Review and confirm monthly financial summary</p>

            {/* Summary */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-sm text-slate-400">Total Revenue</span>
                <span className="text-sm font-semibold text-sky-400">{formatPKR(selectedMonth.totalRevenue)}</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-sm text-slate-400">Operating Expenses</span>
                <span className="text-sm font-semibold text-red-400">{formatPKR(selectedMonth.totalExpenses)}</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <span className="text-sm text-slate-400">Total Salaries</span>
                <span className="text-sm font-semibold text-red-400">{formatPKR(selectedMonth.totalSalaries)}</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <span className="text-base font-semibold text-white">Net Profit</span>
                <span className={`text-base font-bold ${selectedMonth.netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {formatPKR(selectedMonth.netProfit)}
                </span>
              </div>
            </div>

            {/* Distribution */}
            {selectedMonth.netProfit > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold text-white mb-3">Profit Distribution</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center rounded-xl p-3" style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.12)" }}>
                    <span className="text-sm text-slate-300">Partners Pool (60%)</span>
                    <span className="font-bold text-sky-400">{formatPKR(selectedMonth.partnersShare)}</span>
                  </div>
                  {/* Per-partner breakdown */}
                  {partners.map((p) => (
                    <div key={p.id} className="flex justify-between items-center pl-6 text-xs text-slate-500">
                      <span>{p.name} ({p.sharePercentage}%)</span>
                      <span className="text-slate-400">{formatPKR((selectedMonth.partnersShare * p.sharePercentage) / 100)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center rounded-xl p-3" style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.12)" }}>
                    <span className="text-sm text-slate-300">Company Reserve (35%)</span>
                    <span className="font-bold text-purple-400">{formatPKR(selectedMonth.companyShare)}</span>
                  </div>
                  <div className="flex justify-between items-center rounded-xl p-3" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.12)" }}>
                    <span className="text-sm text-slate-300">Zakat (5%)</span>
                    <span className="font-bold text-green-400">{formatPKR(selectedMonth.zakatShare)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-2">Closing Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="glass-input resize-none"
                rows={2}
                placeholder="Add any notes for this month's closing..."
              />
            </div>

            <div className="flex gap-3">
              <button onClick={handleClose} className="btn-primary flex-1" disabled={loading}>
                {loading ? "Closing..." : `Confirm & Close ${getMonthName(selectedMonth.month)}`}
              </button>
              <button onClick={() => setSelectedMonth(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
