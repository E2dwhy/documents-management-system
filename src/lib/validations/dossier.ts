import { z } from "zod";

export const createDossierSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis").max(200, "200 caractères maximum"),
  ownerName: z.string().trim().max(200, "200 caractères maximum").optional().or(z.literal("")),
  typeId: z.string().uuid("Sélectionnez un type de dossier"),
  serviceId: z.string().uuid("Sélectionnez un service"),
});
export type CreateDossierInput = z.infer<typeof createDossierSchema>;
