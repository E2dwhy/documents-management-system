export type UserFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialUserFormState: UserFormState = { status: "idle" };
