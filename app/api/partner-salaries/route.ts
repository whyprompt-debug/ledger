import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const salary = await prisma.partnerSalary.create({
    data: {
      partnerId: body.partnerId,
      month: body.month,
      year: body.year,
      amount: body.amount,
      isPaid: body.isPaid ?? true,
      paidDate: body.isPaid ? new Date() : null,
    },
  });
  return NextResponse.json(salary, { status: 201 });
}
