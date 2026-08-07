import type { UserRole } from "@/types/database";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  responsable_service: "Responsable de service",
  agent: "Agent",
  auditeur: "Auditeur",
};
