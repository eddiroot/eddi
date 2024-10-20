import { create } from "zustand";
import { User } from "./types";
import { KEY_LS_USER } from "./constants";

interface AuthState {
  user: User | null;
  setUser: (value: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: localStorage.getItem(KEY_LS_USER)
    ? JSON.parse(localStorage.getItem(KEY_LS_USER) || "{}")
    : null,
  setUser: (value) => set(() => ({ user: value })),
}));
