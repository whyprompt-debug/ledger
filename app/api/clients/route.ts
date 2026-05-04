import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    orderBy: { name: "asc" },
    include: { revenues: true, expenses: true },
  });

  return NextResponse.json(
    clients.map((c) => ({
      id: c.id,
      name: c.name,
      contactInfo: c.contactInfo ?? "",
      isActive: c.isActive,
      createdAt: c.createdAt.toISOString(),
      totalRevenue: c.revenues.reduce((s, r) => s + r.amount, 0),
      totalExpenses: c.expenses.reduce((s, e) => s + e.amount, 0),
      profit: c.revenues.reduce((s, r) => s + r.amount, 0) - c.expenses.reduce((s, e) => s + e.amount, 0),
      revenues: c.revenues.map((r) => ({ id: r.id, month: r.month, year: r.year, amount: r.amount, notes: r.notes ?? "" })),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const client = await prisma.client.create({
    data: { name: body.name, contactInfo: body.contactInfo || null },
  });
  return NextResponse.json(client, { status: 201 });
}
