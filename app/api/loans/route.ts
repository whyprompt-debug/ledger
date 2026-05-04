import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const loans = await prisma.loan.findMany({
    orderBy: { date: "desc" },
    include: { employee: { select: { id: true, name: true } }, repayments: { orderBy: { date: "desc" } } },
  });

  return NextResponse.json(
    loans.map((l) => ({
      id: l.id,
      type: "employee",
      borrowerId: l.employeeId,
      borrowerName: l.employee.name,
      amount: l.amount,
      date: l.date.toISOString(),
      purpose: l.purpose ?? "",
      repayments: l.repayments.map((r) => ({ id: r.id, amount: r.amount, date: r.date.toISOString(), notes: r.notes ?? "" })),
      totalRepaid: l.repayments.reduce((s, r) => s + r.amount, 0),
      remaining: l.amount - l.repayments.reduce((s, r) => s + r.amount, 0),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const loan = await prisma.loan.create({
    data: {
      employeeId: body.borrowerId,
      amount: body.amount,
      date: new Date(body.date),
      purpose: body.purpose || null,
    },
  });
  return NextResponse.json(loan, { status: 201 });
}
