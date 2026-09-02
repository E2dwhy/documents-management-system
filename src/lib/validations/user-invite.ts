import { z } from "zod";

export const userInviteSchema = z.object({
  email: z.string().trim().min(1, "L'email est requis").email("Adresse email invalide"),
  fullName: z.string().trim().min(1, "Le nom est requis").max(150),
  role: z.enum(["admin", "responsable_service", "agent", "auditeur"]),
  serviceId: z.string().uuid().optional().or(z.literal("")),
  // Optional: lets an admin set a known password directly instead of
  // depending entirely on the invite email being received/clicked (see
  // adminSetPasswordAction in actions/users.ts for the same need on an
  // already-created account). Same 8-char rule as updatePasswordSchema.
  password: z.string().min(8, "8 caractères minimum").optional().or(z.literal("")),
});
export type UserInviteInput = z.infer<typeof userInviteSchema>;

export const setPasswordSchema = z.object({
  password: z.string().min(8, "8 caractères minimum"),
});
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const userEditSchema = z.object({
  fullName: z.string().trim().min(1, "Le nom est requis").max(150),
  role: z.enum(["admin", "responsable_service", "agent", "auditeur"]),
  serviceId: z.string().uuid().optional().or(z.literal("")),
});
export type UserEditInput = z.infer<typeof userEditSchema>;
