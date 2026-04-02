import { create } from "zustand";

export interface EventItem {
  id: number;
  name: string;
  date: string;
}

interface EventStore {
  events: EventItem[];
}

export const useEventStore = create<EventStore>(() => ({
  events: [
    { id: 1, name: "Konser Malam Minggu", date: "2026-04-20" },
    { id: 2, name: "Workshop UI/UX Design", date: "2026-05-10" },
    { id: 3, name: "Seminar Kewirausahaan", date: "2026-03-15" },
    { id: 4, name: "Festival Kuliner Nusantara", date: "2026-06-01" },
    { id: 5, name: "Lari Maraton Kota", date: "2026-07-17" },
  ],
}));
