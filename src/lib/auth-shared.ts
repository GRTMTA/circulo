export interface AuthActionState {
  status: "idle" | "error" | "success" | "verification";
  message: string;
  email?: string;
  redirectTo?: string;
}

export const idleState: AuthActionState = {
  status: "idle",
  message: "",
};
