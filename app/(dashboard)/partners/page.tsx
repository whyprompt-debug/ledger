import { prisma } from "@/lib/prisma";
import PartnersClient from "./PartnersClient";

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: {
      salaries: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 3 },
      loans: { include: { repayments: true } },
      distributions: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });

  const data = partners.map((p) => {
    const totalLoan = p.loans.reduce((s, l) => s + l.amount, 0);
    const totalRepaid = p.loans.reduce((s, l) => s + l.repayments.reduce((sr, r) => sr + r.amount, 0), 0);
    const totalDistributed = p.distributions.reduce((s, d) => s + d.amount, 0);

    return {
      id: p.id,
      name: p.name,
      sharePercentage: p.sharePercentage,
      joinDate: p.joinDate.toISOString(),
      isActive: p.isActive,
      outstandingLoan: totalLoan - totalRepaid,
      totalDistributed,
      recentSalaries: p.salaries.map((s) => ({
        id: s.id,
        month: s.month,
        year: s.year,
        amount: s.amount,
        isPaid: s.isPaid,
      })),
    };
  });

  return <PartnersClient initialPartners={data} />;
}
