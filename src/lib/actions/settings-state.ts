export type SettingsFormState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export const initialSettingsFormState: SettingsFormState = { status: "idle" };
