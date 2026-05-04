import { prisma } from "@/lib/prisma";
import { formatPKR, getMonthName } from "@/lib/utils";
import DashboardCharts from "@/components/charts/DashboardCharts";

async function getDashboardData() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
  const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

  const [
    totalClients,
    activeClients,
    totalEmployees,
    totalPartners,
    monthlyRevenue,
    monthlyExpenses,
    recentExpenses,
    recentCashEntries,
    monthlyTrend,
  ] = await Promise.all([
    prisma.client.count(),
    prisma.client.count({ where: { isActive: true } }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.partner.count({ where: { isActive: true } }),
    prisma.clientRevenue.aggregate({
      where: { month: currentMonth, year: currentYear },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { client: { select: { name: true } } },
    }),
    prisma.cashEntry.findMany({
      take: 5,
      orderBy: { date: "desc" },
    }),
    // Last 6 months trend
    Promise.all(
      Array.from({ length: 6 }, (_, i) => {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        return Promise.all([
          prisma.clientRevenue.aggregate({
            where: { month: m, year: y },
            _sum: { amount: true },
          }),
          prisma.expense.aggregate({
            where: {
              date: {
                gte: new Date(y, m - 1, 1),
                lte: new Date(y, m, 0, 23, 59, 59),
              },
            },
            _sum: { amount: true },
          }),
        ]).then(([rev, exp]) => ({
          month: getMonthName(m).slice(0, 3),
          year: y,
          revenue: rev._sum.amount ?? 0,
          expenses: exp._sum.amount ?? 0,
          profit: (rev._sum.amount ?? 0) - (exp._sum.amount ?? 0),
        }));
      })
    ),
  ]);

  const revenue = monthlyRevenue._sum.amount ?? 0;
  const expenses = monthlyExpenses._sum.amount ?? 0;
  const netProfit = revenue - expenses;

  return {
    stats: { totalClients, activeClients, totalEmployees, totalPartners, revenue, expenses, netProfit },
    recentExpenses,
    recentCashEntries,
    trend: monthlyTrend.reverse(),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { stats, recentExpenses, recentCashEntries, trend } = data;

  const profitMargin = stats.revenue > 0 ? ((stats.netProfit / stats.revenue) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of Whyprompt financial performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Monthly Revenue"
          value={formatPKR(stats.revenue)}
          icon="💰"
          color="blue"
          trend="+12% vs last month"
        />
        <StatCard
          label="Monthly Expenses"
          value={formatPKR(stats.expenses)}
          icon="📤"
          color="red"
          trend="Total outflow"
        />
        <StatCard
          label="Net Profit"
          value={formatPKR(stats.netProfit)}
          icon="📈"
          color={stats.netProfit >= 0 ? "green" : "red"}
          trend={`${profitMargin}% margin`}
        />
        <StatCard
          label="Active Clients"
          value={String(stats.activeClients)}
          icon="🏢"
          color="purple"
          trend={`${stats.totalClients} total`}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.15)" }}>
            👥
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.totalEmployees}</p>
            <p className="text-xs text-slate-400">Active Employees</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.15)" }}>
            🤝
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{stats.totalPartners}</p>
            <p className="text-xs text-slate-400">Partners</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.15)" }}>
            ⚡
          </div>
          <div>
            <p className="text-2xl font-bold neon-text-green">{profitMargin}%</p>
            <p className="text-xs text-slate-400">Profit Margin</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <DashboardCharts trend={trend} />

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <div className="glass-card">
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <h3 className="font-semibold text-white">Recent Expenses</h3>
            <a href="/expenses" className="text-xs text-sky-400 hover:underline">View all →</a>
          </div>
          <div>
            {recentExpenses.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-500 text-sm">No expenses recorded yet</p>
            ) : (
              recentExpenses.map((exp) => (
                <div key={exp.id} className="table-row flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{exp.description}</p>
                    <p className="text-xs text-slate-500">{exp.category} {exp.client ? `· ${exp.client.name}` : ""}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-400">{formatPKR(exp.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Cash Entries */}
        <div className="glass-card">
          <div className="px-6 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <h3 className="font-semibold text-white">Recent Cash Entries</h3>
            <a href="/cashbook" className="text-xs text-sky-400 hover:underline">View all →</a>
          </div>
          <div>
            {recentCashEntries.length === 0 ? (
              <p className="px-6 py-8 text-center text-slate-500 text-sm">No cash entries yet</p>
            ) : (
              recentCashEntries.map((entry) => (
                <div key={entry.id} className="table-row flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white font-medium">{entry.description}</p>
                    <p className="text-xs text-slate-500">{entry.category}</p>
                  </div>
                  <span className={`text-sm font-semibold ${entry.type === "INFLOW" ? "text-green-400" : "text-red-400"}`}>
                    {entry.type === "INFLOW" ? "+" : "-"}{formatPKR(entry.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  trend,
}: {
  label: string;
  value: string;
  icon: string;
  color: "blue" | "red" | "green" | "purple";
  trend: string;
}) {
  const colorMap = {
    blue: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.15)", text: "#38bdf8" },
    red: { bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.15)", text: "#f87171" },
    green: { bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.15)", text: "#34d399" },
    purple: { bg: "rgba(167,139,250,0.08)", border: "rgba(167,139,250,0.15)", text: "#a78bfa" },
  };
  const c = colorMap[color];

  return (
    <div className="glass-card p-6 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ color: c.text }}>{value}</p>
      <p className="text-xs text-slate-500">{trend}</p>
    </div>
  );
}
