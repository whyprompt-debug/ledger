"use client";

import { useState } from "react";
import { formatPKR, formatDate } from "@/lib/utils";

interface Repayment {
  id: string;
  amount: number;
  date: string;
  notes: string;
}

interface Loan {
  id: string;
  type: "employee" | "partner";
  borrowerId: string;
  borrowerName: string;
  amount: number;
  date: string;
  purpose: string;
  repayments: Repayment[];
  totalRepaid: number;
  remaining: number;
}

interface Props {
  initialLoans: Loan[];
  employees: { id: string; name: string }[];
  partners: { id: string; name: string }[];
}

export default function LoansClient({ initialLoans, employees, partners }: Props) {
  const [loans, setLoans] = useState(initialLoans);
  const [showModal, setShowModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "employee" | "partner">("all");
  const [form, setForm] = useState({
    type: "employee" as "employee" | "partner",
    borrowerId: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    purpose: "",
  });
  const [repayForm, setRepayForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const filtered = loans.filter((l) => filterType === "all" || l.type === filterType);
  const totalLoaned = loans.reduce((s, l) => s + l.amount, 0);
  const totalOutstanding = loans.reduce((s, l) => s + l.remaining, 0);
  const totalRepaid = loans.reduce((s, l) => s + l.totalRepaid, 0);

  const borrowerOptions = form.type === "employee" ? employees : partners;

  function openCreate() {
    setForm({ type: "employee", borrowerId: employees[0]?.id ?? "", amount: "", date: new Date().toISOString().split("T")[0], purpose: "" });
    setShowModal(true);
  }

  function openRepay(loan: Loan) {
    setSelectedLoan(loan);
    setRepayForm({ amount: String(loan.remaining), date: new Date().toISOString().split("T")[0], notes: "" });
    setShowRepayModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = { ...form, amount: parseFloat(form.amount) };
    const endpoint = form.type === "employee" ? "/api/loans" : "/api/partner-loans";
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      await refreshLoans();
      setShowModal(false);
    }
    setLoading(false);
  }

  async function handleRepaySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLoan) return;
    setLoading(true);
    const body = { ...repayForm, amount: parseFloat(repayForm.amount), loanId: selectedLoan.id };
    const endpoint = selectedLoan.type === "employee" ? "/api/loan-repayments" : "/api/partner-loan-repayments";
    const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      await refreshLoans();
      setShowRepayModal(false);
    }
    setLoading(false);
  }

  async function refreshLoans() {
    const [emp, part] = await Promise.all([
      (await fetch("/api/loans")).json(),
      (await fetch("/api/partner-loans")).json(),
    ]);
    setLoans([...emp, ...part]);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-subtitle">Track loans given to employees and partners with repayments</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Issue Loan</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Loaned</p>
          <p className="text-2xl font-bold text-sky-400">{formatPKR(totalLoaned)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Total Repaid</p>
          <p className="text-2xl font-bold text-green-400">{formatPKR(totalRepaid)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Outstanding Balance</p>
          <p className="text-2xl font-bold text-orange-400">{formatPKR(totalOutstanding)}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-card p-4 flex gap-3">
        {(["all", "employee", "partner"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="px-4 py-2 rounded-xl text-sm capitalize transition-all"
            style={
              filterType === t
                ? { background: "rgba(56,189,248,0.15)", color: "#38bdf8", border: "1px solid rgba(56,189,248,0.25)" }
                : { background: "transparent", color: "#94a3b8", border: "1px solid transparent" }
            }
          >
            {t === "all" ? "All Loans" : `${t.charAt(0).toUpperCase() + t.slice(1)} Loans`}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500">No loans found</div>
        ) : (
          filtered.map((loan) => {
            const repayPercent = loan.amount > 0 ? Math.min((loan.totalRepaid / loan.amount) * 100, 100) : 0;
            const isFullyRepaid = loan.remaining <= 0;

            return (
              <div key={loan.id} className="glass-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{
                        background: loan.type === "employee" ? "rgba(56,189,248,0.1)" : "rgba(167,139,250,0.1)",
                        border: `1px solid ${loan.type === "employee" ? "rgba(56,189,248,0.2)" : "rgba(167,139,250,0.2)"}`,
                      }}
                    >
                      {loan.borrowerName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{loan.borrowerName}</p>
                      <p className="text-xs text-slate-500">
                        <span className={`badge ${loan.type === "employee" ? "badge-blue" : "badge-purple"} mr-2`}>
                          {loan.type}
                        </span>
                        Issued {formatDate(loan.date)}
                        {loan.purpose && ` · ${loan.purpose}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Total Loan</p>
                      <p className="font-bold text-sky-400">{formatPKR(loan.amount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Remaining</p>
                      <p className={`font-bold ${isFullyRepaid ? "text-green-400" : "text-orange-400"}`}>
                        {isFullyRepaid ? "✓ Paid" : formatPKR(loan.remaining)}
                      </p>
                    </div>
                    {!isFullyRepaid && (
                      <button onClick={() => openRepay(loan)} className="btn-success text-xs">
                        + Repayment
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full rounded-full h-1.5 mb-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${repayPercent}%`, background: isFullyRepaid ? "#34d399" : "#38bdf8" }}
                  />
                </div>
                <p className="text-xs text-slate-500">{repayPercent.toFixed(0)}% repaid · {loan.repayments.length} payment(s)</p>

                {/* Repayments */}
                {loan.repayments.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {loan.repayments.map((r) => (
                      <div key={r.id} className="text-xs rounded-lg px-3 py-1.5"
                        style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.15)", color: "#34d399" }}>
                        {formatPKR(r.amount)} on {formatDate(r.date)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Issue Loan Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">Issue Loan</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                {(["employee", "partner"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, type: t, borrowerId: (t === "employee" ? employees : partners)[0]?.id ?? "" })}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold capitalize transition-all"
                    style={
                      form.type === t
                        ? { background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8" }
                        : { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Borrower</label>
                <select value={form.borrowerId} onChange={(e) => setForm({ ...form, borrowerId: e.target.value })} className="glass-select">
                  {borrowerOptions.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Amount (PKR)</label>
                  <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="glass-input" required min="0" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="glass-input" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Purpose (optional)</label>
                <input type="text" placeholder="Reason for loan..." value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="glass-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : "Issue Loan"}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repayment Modal */}
      {showRepayModal && selectedLoan && (
        <div className="modal-overlay" onClick={() => setShowRepayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">Record Repayment</h2>
            <p className="text-sm text-slate-400 mb-5">
              {selectedLoan.borrowerName} · Remaining: {formatPKR(selectedLoan.remaining)}
            </p>
            <form onSubmit={handleRepaySubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Amount (PKR)</label>
                  <input type="number" placeholder="0" value={repayForm.amount} onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })} className="glass-input" required min="0" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2">Date</label>
                  <input type="date" value={repayForm.date} onChange={(e) => setRepayForm({ ...repayForm, date: e.target.value })} className="glass-input" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Notes (optional)</label>
                <input type="text" placeholder="Payment notes..." value={repayForm.notes} onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })} className="glass-input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : "Record Repayment"}</button>
                <button type="button" onClick={() => setShowRepayModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
