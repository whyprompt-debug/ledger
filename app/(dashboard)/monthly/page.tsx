import { prisma } from "@/lib/prisma";
import MonthlyClient from "./MonthlyClient";

export default async function MonthlyPage() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Build last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, currentMonth - 1 - i, 1);
    return { month: d.getMonth() + 1, year: d.getFullYear() };
  });

  const monthsData = await Promise.all(
    months.map(async ({ month, year }) => {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      const [revenue, expenses, salaries, partnerSalaries, closedRecord] = await Promise.all([
        prisma.clientRevenue.aggregate({ where: { month, year }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
        prisma.salary.aggregate({ where: { month, year }, _sum: { amount: true } }),
        prisma.partnerSalary.aggregate({ where: { month, year }, _sum: { amount: true } }),
        prisma.monthlyClose.findUnique({ where: { month_year: { month, year } } }),
      ]);

      const totalRevenue = revenue._sum.amount ?? 0;
      const totalExpenses = expenses._sum.amount ?? 0;
      const totalSalaries = (salaries._sum.amount ?? 0) + (partnerSalaries._sum.amount ?? 0);
      const netProfit = totalRevenue - totalExpenses - totalSalaries;

      return {
        month,
        year,
        totalRevenue,
        totalExpenses,
        totalSalaries,
        netProfit,
        partnersShare: netProfit * 0.6,
        companyShare: netProfit * 0.35,
        zakatShare: netProfit * 0.05,
        isClosed: closedRecord?.isClosed ?? false,
        closedId: closedRecord?.id ?? null,
        notes: closedRecord?.notes ?? "",
      };
    })
  );

  const partners = await prisma.partner.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <MonthlyClient
      monthsData={monthsData}
      partners={partners.map((p) => ({ id: p.id, name: p.name, sharePercentage: p.sharePercentage }))}
    />
  );
}
