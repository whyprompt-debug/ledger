import { prisma } from "@/lib/prisma";
import LoansClient from "./LoansClient";

export default async function LoansPage() {
  const [employees, partners, employeeLoans, partnerLoans] = await Promise.all([
    prisma.employee.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.partner.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.loan.findMany({
      orderBy: { date: "desc" },
      include: {
        employee: { select: { id: true, name: true } },
        repayments: { orderBy: { date: "desc" } },
      },
    }),
    prisma.partnerLoan.findMany({
      orderBy: { date: "desc" },
      include: {
        partner: { select: { id: true, name: true } },
        repayments: { orderBy: { date: "desc" } },
      },
    }),
  ]);

  const empLoansData = employeeLoans.map((l) => ({
    id: l.id,
    type: "employee" as const,
    borrowerId: l.employeeId,
    borrowerName: l.employee.name,
    amount: l.amount,
    date: l.date.toISOString(),
    purpose: l.purpose ?? "",
    repayments: l.repayments.map((r) => ({
      id: r.id,
      amount: r.amount,
      date: r.date.toISOString(),
      notes: r.notes ?? "",
    })),
    totalRepaid: l.repayments.reduce((s, r) => s + r.amount, 0),
    remaining: l.amount - l.repayments.reduce((s, r) => s + r.amount, 0),
  }));

  const partnerLoansData = partnerLoans.map((l) => ({
    id: l.id,
    type: "partner" as const,
    borrowerId: l.partnerId,
    borrowerName: l.partner.name,
    amount: l.amount,
    date: l.date.toISOString(),
    purpose: l.purpose ?? "",
    repayments: l.repayments.map((r) => ({
      id: r.id,
      amount: r.amount,
      date: r.date.toISOString(),
      notes: r.notes ?? "",
    })),
    totalRepaid: l.repayments.reduce((s, r) => s + r.amount, 0),
    remaining: l.amount - l.repayments.reduce((s, r) => s + r.amount, 0),
  }));

  return (
    <LoansClient
      initialLoans={[...empLoansData, ...partnerLoansData]}
      employees={employees.map((e) => ({ id: e.id, name: e.name }))}
      partners={partners.map((p) => ({ id: p.id, name: p.name }))}
    />
  );
}
