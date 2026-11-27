import { create } from "zustand";

export interface Notice {
  title: string;
  body: string;
  demandId?: string;
}

interface NoticeState {
  notice?: Notice;
  show: (notice: Notice) => void;
  dismiss: () => void;
}

/** Aviso dentro do app (usado na web, onde não há notificação do sistema). */
export const useNoticeStore = create<NoticeState>((set) => ({
  show: (notice) => set({ notice }),
  dismiss: () => set({ notice: undefined }),
}));
