import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const partners = await prisma.partner.findMany({
    orderBy: { name: "asc" },
    include: {
      loans: { include: { repayments: true } },
      distributions: true,
      salaries: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 3 },
    },
  });

  return NextResponse.json(
    partners.map((p) => {
      const totalLoan = p.loans.reduce((s, l) => s + l.amount, 0);
      const totalRepaid = p.loans.reduce((s, l) => s + l.repayments.reduce((sr, r) => sr + r.amount, 0), 0);
      return {
        id: p.id,
        name: p.name,
        sharePercentage: p.sharePercentage,
        joinDate: p.joinDate.toISOString(),
        isActive: p.isActive,
        outstandingLoan: totalLoan - totalRepaid,
        totalDistributed: p.distributions.reduce((s, d) => s + d.amount, 0),
        recentSalaries: p.salaries.map((s) => ({ id: s.id, month: s.month, year: s.year, amount: s.amount, isPaid: s.isPaid })),
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const partner = await prisma.partner.create({
    data: { name: body.name, sharePercentage: body.sharePercentage },
  });
  return NextResponse.json(partner, { status: 201 });
}
