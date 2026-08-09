import { create } from "zustand";

interface AppState {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  darkMode: localStorage.getItem("theme") === "dark",
  toggleDarkMode: () => set((state) => {
    const darkMode = !state.darkMode;
    localStorage.setItem("theme", darkMode ? "dark" : "light");
    return { darkMode };
  })
}));
