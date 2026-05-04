import { prisma } from "@/lib/prisma";
import ReportsClient from "./ReportsClient";
import { getMonthName } from "@/lib/utils";

export default async function ReportsPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Last 12 months analytics
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const [clientsWithRevenue, expensesByCategory, trendData] = await Promise.all([
    prisma.client.findMany({
      include: {
        revenues: true,
        expenses: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.expense.groupBy({
      by: ["category"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    }),
    Promise.all(
      months.reverse().map(async ({ month, year }) => {
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);
        const [rev, exp, sal] = await Promise.all([
          prisma.clientRevenue.aggregate({ where: { month, year }, _sum: { amount: true } }),
          prisma.expense.aggregate({ where: { date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
          prisma.salary.aggregate({ where: { month, year }, _sum: { amount: true } }),
        ]);
        const revenue = rev._sum.amount ?? 0;
        const expenses = (exp._sum.amount ?? 0) + (sal._sum.amount ?? 0);
        return {
          label: `${getMonthName(month).slice(0, 3)} ${year}`,
          month,
          year,
          revenue,
          expenses,
          profit: revenue - expenses,
        };
      })
    ),
  ]);

  const clientData = clientsWithRevenue.map((c) => ({
    id: c.id,
    name: c.name,
    totalRevenue: c.revenues.reduce((s, r) => s + r.amount, 0),
    totalExpenses: c.expenses.reduce((s, e) => s + e.amount, 0),
    profit: c.revenues.reduce((s, r) => s + r.amount, 0) - c.expenses.reduce((s, e) => s + e.amount, 0),
  }));

  const categoryData = expensesByCategory.map((e) => ({
    category: e.category,
    total: e._sum.amount ?? 0,
  }));

  return (
    <ReportsClient
      trendData={trendData}
      clientData={clientData}
      categoryData={categoryData}
    />
  );
}
