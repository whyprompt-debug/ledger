"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface TrendData {
  month: string;
  year: number;
  revenue: number;
  expenses: number;
  profit: number;
}

function formatK(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return String(value);
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl p-3 text-xs"
        style={{
          background: "rgba(15,12,41,0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(10px)",
        }}
      >
        <p className="text-slate-300 font-medium mb-2">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: PKR {p.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardCharts({ trend }: { trend: TrendData[] }) {
  const profitSplit = [
    { name: "Partners (60%)", value: 60 },
    { name: "Company (35%)", value: 35 },
    { name: "Zakat (5%)", value: 5 },
  ];
  const PIE_COLORS = ["#38bdf8", "#a78bfa", "#34d399"];

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Revenue vs Expenses Bar Chart */}
      <div className="glass-card p-6 col-span-2">
        <h3 className="font-semibold text-white mb-1">Revenue vs Expenses</h3>
        <p className="text-xs text-slate-500 mb-5">Last 6 months comparison (PKR)</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trend} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatK} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
            <Bar dataKey="revenue" name="Revenue" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.85} />
            <Bar dataKey="expenses" name="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} opacity={0.85} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Profit Distribution Pie */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-1">Profit Distribution</h3>
        <p className="text-xs text-slate-500 mb-5">Default allocation split</p>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={profitSplit}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {profitSplit.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} opacity={0.85} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [`${value}%`]}
              contentStyle={{
                background: "rgba(15,12,41,0.95)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="space-y-2 mt-2">
          {profitSplit.map((item, i) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                <span className="text-xs text-slate-400">{item.name}</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: PIE_COLORS[i] }}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Profit Trend Line Chart */}
      <div className="glass-card p-6 col-span-3">
        <h3 className="font-semibold text-white mb-1">Profit Trend</h3>
        <p className="text-xs text-slate-500 mb-5">Net profit over last 6 months (PKR)</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatK} tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="profit"
              name="Net Profit"
              stroke="#a78bfa"
              strokeWidth={2.5}
              dot={{ fill: "#a78bfa", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: "#a78bfa" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
