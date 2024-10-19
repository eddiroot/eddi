import { create } from "zustand";
import { User } from "./types";

interface AuthState {
  user: User | null;
  setUser: (value: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (value) => set(() => ({ user: value })),
}));
