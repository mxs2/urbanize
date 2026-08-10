import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: false,
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
}));
