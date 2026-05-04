"use client";

import { useState } from "react";
import { formatPKR, formatDate } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  salary: number;
  joinDate: string;
  isActive: boolean;
  lastSalaryPaid: string | null;
  outstandingLoan: number;
}

export default function EmployeesClient({ initialEmployees }: { initialEmployees: Employee[] }) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [showModal, setShowModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", salary: "", isActive: true });
  const [salaryForm, setSalaryForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    isPaid: true,
  });

  const totalSalaries = employees.filter((e) => e.isActive).reduce((s, e) => s + e.salary, 0);
  const totalOutstandingLoans = employees.reduce((s, e) => s + e.outstandingLoan, 0);

  function openCreate() {
    setEditingEmployee(null);
    setForm({ name: "", salary: "", isActive: true });
    setShowModal(true);
  }

  function openEdit(emp: Employee) {
    setEditingEmployee(emp);
    setForm({ name: emp.name, salary: String(emp.salary), isActive: emp.isActive });
    setShowModal(true);
  }

  function openSalary(emp: Employee) {
    setSelectedEmployee(emp);
    setSalaryForm({
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: String(emp.salary),
      isPaid: true,
    });
    setShowSalaryModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = { ...form, salary: parseFloat(form.salary) };
    const url = editingEmployee ? `/api/employees/${editingEmployee.id}` : "/api/employees";
    const method = editingEmployee ? "PUT" : "POST";

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      const updated = await (await fetch("/api/employees")).json();
      setEmployees(updated);
      setShowModal(false);
    }
    setLoading(false);
  }

  async function handleSalarySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmployee) return;
    setLoading(true);
    const body = { ...salaryForm, amount: parseFloat(salaryForm.amount), employeeId: selectedEmployee.id };

    const res = await fetch("/api/salaries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      setShowSalaryModal(false);
      alert("Salary recorded successfully!");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Deactivate this employee?")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: false } : e)));
  }

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">Manage staff salaries and employment records</p>
        </div>
        <button onClick={openCreate} className="btn-primary">+ Add Employee</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Active Employees</p>
          <p className="text-2xl font-bold text-white">{employees.filter((e) => e.isActive).length}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Monthly Salary Commitment</p>
          <p className="text-2xl font-bold text-sky-400">{formatPKR(totalSalaries)}</p>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-slate-400 mb-1">Outstanding Loans</p>
          <p className="text-2xl font-bold text-orange-400">{formatPKR(totalOutstandingLoans)}</p>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-2 gap-4">
        {employees.map((emp) => (
          <div key={emp.id} className="glass-card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold"
                  style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}>
                  {emp.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-white">{emp.name}</p>
                  <p className="text-xs text-slate-500">Joined {formatDate(emp.joinDate)}</p>
                </div>
              </div>
              <span className={`badge ${emp.isActive ? "badge-green" : "badge-red"}`}>
                {emp.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs text-slate-500">Monthly Salary</p>
                <p className="text-sm font-bold text-sky-400">{formatPKR(emp.salary)}</p>
              </div>
              <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs text-slate-500">Outstanding Loan</p>
                <p className={`text-sm font-bold ${emp.outstandingLoan > 0 ? "text-orange-400" : "text-green-400"}`}>
                  {formatPKR(emp.outstandingLoan)}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => openSalary(emp)} className="btn-success flex-1 text-xs">Record Salary</button>
              <button onClick={() => openEdit(emp)} className="btn-secondary flex-1 text-xs">Edit</button>
              {emp.isActive && (
                <button onClick={() => handleDelete(emp.id)} className="btn-danger text-xs px-3">
                  Deactivate
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Employee Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-5">{editingEmployee ? "Edit Employee" : "Add Employee"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Full Name</label>
                <input type="text" placeholder="Employee name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="glass-input" required />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Monthly Salary (PKR)</label>
                <input type="number" placeholder="0" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} className="glass-input" required min="0" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm text-slate-300">Currently active</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : editingEmployee ? "Update" : "Add Employee"}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {showSalaryModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-white mb-1">Record Salary Payment</h2>
            <p className="text-sm text-slate-400 mb-5">{selectedEmployee.name}</p>
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
                <input type="number" value={salaryForm.amount} onChange={(e) => setSalaryForm({ ...salaryForm, amount: e.target.value })} className="glass-input" required min="0" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={salaryForm.isPaid} onChange={(e) => setSalaryForm({ ...salaryForm, isPaid: e.target.checked })} className="w-4 h-4" />
                <span className="text-sm text-slate-300">Mark as paid</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="btn-primary flex-1" disabled={loading}>{loading ? "Saving..." : "Record Salary"}</button>
                <button type="button" onClick={() => setShowSalaryModal(false)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
