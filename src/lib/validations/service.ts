import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(1, "Le nom est requis").max(100, "100 caractères maximum"),
  description: z.string().trim().max(500, "500 caractères maximum").optional().or(z.literal("")),
});
export type ServiceInput = z.infer<typeof serviceSchema>;
