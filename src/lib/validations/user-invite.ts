import { z } from "zod";

export const userInviteSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Adresse email invalide"),
  fullName: z.string().trim().min(1, "Le nom est requis").max(150),
  role: z.enum(["admin", "responsable_service", "agent", "auditeur"]),
  serviceId: z.string().uuid().optional().or(z.literal("")),
});
export type UserInviteInput = z.infer<typeof userInviteSchema>;

export const userEditSchema = z.object({
  fullName: z.string().trim().min(1, "Le nom est requis").max(150),
  role: z.enum(["admin", "responsable_service", "agent", "auditeur"]),
  serviceId: z.string().uuid().optional().or(z.literal("")),
});
export type UserEditInput = z.infer<typeof userEditSchema>;
