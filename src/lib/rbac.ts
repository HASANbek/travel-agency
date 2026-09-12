import { UserRole } from "@/lib/crm-constants";

export const FULL_ACCESS_ROLES: UserRole[] = ["admin", "director"];
export const FINANCIAL_ROLES: UserRole[] = ["admin", "director", "accountant"];
export const CRM_EDIT_ROLES: UserRole[] = ["admin", "director", "manager", "sales", "tour_operator"];

export function canManageUsers(role: string): boolean {
  return FULL_ACCESS_ROLES.includes(role as UserRole);
}

export function canAccessFinance(role: string): boolean {
  return FINANCIAL_ROLES.includes(role as UserRole);
}

export function canEditCrm(role: string): boolean {
  return CRM_EDIT_ROLES.includes(role as UserRole);
}
