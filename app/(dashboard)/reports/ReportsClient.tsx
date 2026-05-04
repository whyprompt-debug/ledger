"use client";

import { formatPKR } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

interface TrendPoint {
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ClientStat {
  id: string;
  name: string;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
}

interface CategoryStat {
  category: string;
  total: number;
}

interface Props {
  trendData: TrendPoint[];
  clientData: ClientStat[];
  categoryData: CategoryStat[];
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(15,12,41,0.97)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#f1f5f9",
  },
};

const PIE_COLORS = ["#38bdf8", "#a78bfa", "#34d399", "#f87171", "#fbbf24", "#fb923c", "#e879f9", "#22d3ee", "#4ade80", "#818cf8"];

function formatK(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

export default function ReportsClient({ trendData, clientData, categoryData }: Props) {
  const totalRevenue = clientData.reduce((s, c) => s + c.totalRevenue, 0);
  const totalExpenses = clientData.reduce((s, c) => s + c.totalExpenses, 0);
  const totalProfit = clientData.reduce((s, c) => s + c.profit, 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="page-title">Analytics & Reports</h1>
        <p className="page-subtitle">Financial insights and performance visualizations</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: formatPKR(totalRevenue), color: "#38bdf8" },
          { label: "Total Expenses", value: formatPKR(totalExpenses), color: "#f87171" },
          { label: "Net Profit", value: formatPKR(totalProfit), color: totalProfit >= 0 ? "#34d399" : "#f87171" },
          { label: "Profit Margin", value: `${profitMargin}%`, color: "#a78bfa" },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5">
            <p className="text-xs text-slate-400 mb-2">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue vs Expenses Trend */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-1">12-Month Revenue vs Expenses</h3>
        <p className="text-xs text-slate-500 mb-5">Monthly comparison in PKR</p>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={trendData} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatK} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => formatPKR(v)} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
            <Bar dataKey="revenue" name="Revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Trend */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-1">Net Profit Trend</h3>
        <p className="text-xs text-slate-500 mb-5">12-month profit performance</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatK} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => formatPKR(v)} />
            <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#a78bfa" strokeWidth={2.5}
              dot={{ fill: "#a78bfa", strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Expense by Category */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-1">Expenses by Category</h3>
          <p className="text-xs text-slate-500 mb-5">All-time breakdown</p>
          {categoryData.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} dataKey="total" nameKey="category" cx="50%" cy="50%"
                    outerRadius={80} innerRadius={45} paddingAngle={2}>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.85} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => formatPKR(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1 mt-2">
                {categoryData.slice(0, 5).map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-400">{c.category}</span>
                    </div>
                    <span className="text-slate-300">{formatPKR(c.total)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Client Profitability */}
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-1">Client Profitability</h3>
          <p className="text-xs text-slate-500 mb-5">Revenue vs Profit per client</p>
          {clientData.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">No clients yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={clientData} layout="vertical" barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tickFormatter={formatK} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => formatPKR(v)} />
                <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                <Bar dataKey="totalRevenue" name="Revenue" fill="#38bdf8" radius={[0, 4, 4, 0]} opacity={0.85} />
                <Bar dataKey="profit" name="Profit" fill="#34d399" radius={[0, 4, 4, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
