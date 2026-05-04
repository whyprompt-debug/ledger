import { prisma } from "@/lib/prisma";
import { formatPKR, formatDate } from "@/lib/utils";
import ExpensesClient from "./ExpensesClient";

export default async function ExpensesPage() {
  const [expenses, clients] = await Promise.all([
    prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.client.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  return (
    <ExpensesClient
      initialExpenses={expenses.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
        client: e.client ?? null,
      }))}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
      totalExpenses={totalExpenses}
      topCategory={topCategory ?? null}
    />
  );
}
