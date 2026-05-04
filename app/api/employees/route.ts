import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: {
      loans: { include: { repayments: true } },
    },
  });

  return NextResponse.json(
    employees.map((emp) => {
      const totalLoan = emp.loans.reduce((s, l) => s + l.amount, 0);
      const totalRepaid = emp.loans.reduce((s, l) => s + l.repayments.reduce((sr, r) => sr + r.amount, 0), 0);
      return {
        id: emp.id,
        name: emp.name,
        salary: emp.salary,
        joinDate: emp.joinDate.toISOString(),
        isActive: emp.isActive,
        lastSalaryPaid: null,
        outstandingLoan: totalLoan - totalRepaid,
      };
    })
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const employee = await prisma.employee.create({
    data: { name: body.name, salary: body.salary, isActive: body.isActive ?? true },
  });
  return NextResponse.json(employee, { status: 201 });
}
