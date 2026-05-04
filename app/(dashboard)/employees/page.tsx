import { prisma } from "@/lib/prisma";
import EmployeesClient from "./EmployeesClient";

export default async function EmployeesPage() {
  const employees = await prisma.employee.findMany({
    orderBy: { name: "asc" },
    include: {
      salaries: { orderBy: [{ year: "desc" }, { month: "desc" }], take: 1 },
      loans: {
        include: { repayments: true },
      },
    },
  });

  const data = employees.map((emp) => {
    const totalLoanAmount = emp.loans.reduce((s, l) => s + l.amount, 0);
    const totalRepaid = emp.loans.reduce(
      (s, l) => s + l.repayments.reduce((sr, r) => sr + r.amount, 0),
      0
    );
    return {
      id: emp.id,
      name: emp.name,
      salary: emp.salary,
      joinDate: emp.joinDate.toISOString(),
      isActive: emp.isActive,
      lastSalaryPaid: emp.salaries[0]?.isPaid ? `${emp.salaries[0].month}/${emp.salaries[0].year}` : null,
      outstandingLoan: totalLoanAmount - totalRepaid,
    };
  });

  return <EmployeesClient initialEmployees={data} />;
}
