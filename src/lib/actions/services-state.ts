export type ServiceFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialServiceFormState: ServiceFormState = { status: "idle" };
