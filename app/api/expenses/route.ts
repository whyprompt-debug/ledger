import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const expense = await prisma.expense.create({
    data: {
      date: new Date(body.date),
      category: body.category,
      description: body.description,
      amount: body.amount,
      isRecurring: body.isRecurring ?? false,
      clientId: body.clientId ?? null,
    },
    include: { client: { select: { id: true, name: true } } },
  });
  return NextResponse.json(expense, { status: 201 });
}
