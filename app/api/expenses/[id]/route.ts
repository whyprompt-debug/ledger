import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const expense = await prisma.expense.update({
    where: { id: params.id },
    data: {
      date: new Date(body.date),
      category: body.category,
      description: body.description,
      amount: body.amount,
      isRecurring: body.isRecurring ?? false,
      clientId: body.clientId ?? null,
    },
  });
  return NextResponse.json(expense);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.expense.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
