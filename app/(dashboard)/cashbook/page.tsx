import { prisma } from "@/lib/prisma";
import CashBookClient from "./CashBookClient";

export default async function CashBookPage() {
  const entries = await prisma.cashEntry.findMany({ orderBy: { date: "desc" } });

  const totalInflow = entries.filter((e) => e.type === "INFLOW").reduce((s, e) => s + e.amount, 0);
  const totalOutflow = entries.filter((e) => e.type === "OUTFLOW").reduce((s, e) => s + e.amount, 0);

  return (
    <CashBookClient
      initialEntries={entries.map((e) => ({
        ...e,
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
      }))}
      totalInflow={totalInflow}
      totalOutflow={totalOutflow}
    />
  );
}
