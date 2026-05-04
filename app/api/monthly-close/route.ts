import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.monthlyClose.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { distributions: { include: { partner: true } } },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const record = await prisma.monthlyClose.upsert({
    where: { month_year: { month: body.month, year: body.year } },
    update: {
      totalRevenue: body.totalRevenue,
      totalExpenses: body.totalExpenses,
      totalSalaries: body.totalSalaries,
      netProfit: body.netProfit,
      partnersShare: body.partnersShare,
      companyShare: body.companyShare,
      zakatShare: body.zakatShare,
      isClosed: true,
      notes: body.notes || null,
    },
    create: {
      month: body.month,
      year: body.year,
      totalRevenue: body.totalRevenue,
      totalExpenses: body.totalExpenses,
      totalSalaries: body.totalSalaries,
      netProfit: body.netProfit,
      partnersShare: body.partnersShare,
      companyShare: body.companyShare,
      zakatShare: body.zakatShare,
      isClosed: true,
      notes: body.notes || null,
    },
  });

  // Create profit distributions for each partner
  if (body.distributions && body.netProfit > 0) {
    await prisma.profitDistribution.deleteMany({ where: { monthlyCloseId: record.id } });
    await prisma.profitDistribution.createMany({
      data: body.distributions.map((d: { partnerId: string; amount: number }) => ({
        monthlyCloseId: record.id,
        partnerId: d.partnerId,
        amount: d.amount,
      })),
    });
  }

  return NextResponse.json(record, { status: 201 });
}
