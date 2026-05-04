import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const repayment = await prisma.partnerLoanRepayment.create({
    data: {
      loanId: body.loanId,
      amount: body.amount,
      date: new Date(body.date),
      notes: body.notes || null,
    },
  });
  return NextResponse.json(repayment, { status: 201 });
}
