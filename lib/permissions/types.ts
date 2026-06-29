export type ModuleName =
  | "DASHBOARD"
  | "ASSETS"
  | "DOCUMENTS"
  | "EXPENSES"
  | "REPORTS"
  | "USERS"
  | "AUDIT";

export type PermissionLevel = "FULL" | "READ" | "FILTERED" | "NONE" | "SHARED_ONLY";

export type UserRole =
  | "PRINCIPAL"
  | "SIGNATORY"
  | "FINANCE"
  | "DIRECTOR"
  | "EXTERNAL";

export interface UserContext {
  id: string;
  clerkId: string;
  email: string;
  role: UserRole;
  entityIds: string[];
  documentCategories: string[];
  overrides: Partial<Record<ModuleName, PermissionLevel>>;
}
