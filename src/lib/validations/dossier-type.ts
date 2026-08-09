import { z } from "zod";

export const dossierTypeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "La clé est requise")
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Lettres minuscules, chiffres et underscores uniquement"),
  label: z.string().trim().min(1, "Le libellé est requis").max(150),
  maxScans: z.coerce.number().int().min(1, "Au moins 1 étape").max(50, "50 étapes maximum"),
  lateThresholdHours: z.coerce.number().int().min(1).max(8760).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});
export type DossierTypeInput = z.infer<typeof dossierTypeSchema>;
