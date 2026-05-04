import { prisma } from "@/lib/prisma";
import ClientsClient from "./ClientsClient";

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: {
      revenues: { orderBy: [{ year: "desc" }, { month: "desc" }] },
      expenses: { orderBy: { date: "desc" } },
    },
  });

  const data = clients.map((c) => {
    const totalRevenue = c.revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = c.expenses.reduce((s, e) => s + e.amount, 0);
    return {
      id: c.id,
      name: c.name,
      contactInfo: c.contactInfo ?? "",
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      revenues: c.revenues.map((r) => ({
        id: r.id,
        month: r.month,
        year: r.year,
        amount: r.amount,
        notes: r.notes ?? "",
      })),
    };
  });

  return <ClientsClient initialClients={data} />;
}
