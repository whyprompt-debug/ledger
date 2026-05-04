import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const revenue = await prisma.clientRevenue.create({
    data: {
      clientId: body.clientId,
      month: body.month,
      year: body.year,
      amount: body.amount,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(revenue, { status: 201 });
}
