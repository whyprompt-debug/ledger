export function formatPKR(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en", { month: "long" });
}

export function getCurrentMonth(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export const EXPENSE_CATEGORIES = [
  "Rent",
  "Electricity",
  "Internet",
  "Office Supplies",
  "Marketing",
  "Software/Tools",
  "Travel",
  "Meals & Entertainment",
  "Client Production",
  "Salaries",
  "Equipment",
  "Miscellaneous",
];

export const CASH_CATEGORIES = [
  "Client Payment",
  "Salary",
  "Rent",
  "Utilities",
  "Petty Cash",
  "Bank Transfer",
  "Loan",
  "Other",
];
