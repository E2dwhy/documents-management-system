export type DossierTypeFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialDossierTypeFormState: DossierTypeFormState = { status: "idle" };
