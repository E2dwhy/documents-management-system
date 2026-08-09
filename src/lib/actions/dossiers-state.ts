export type DossierFormState = {
  status: "idle" | "error";
  message?: string;
};

export const initialDossierFormState: DossierFormState = { status: "idle" };

export type DossierActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  reference?: string;
};

export const initialDossierActionState: DossierActionState = { status: "idle" };
