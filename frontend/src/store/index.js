import { create } from 'zustand'

const useStore = create((set) => ({
  // User state
  user: null,
  setUser: (user) => set({ user }),
  
  // Inspection state
  currentInspection: null,
  setCurrentInspection: (inspection) => set({ currentInspection: inspection }),
  
  // UI state
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Offline state
  isOffline: false,
  setIsOffline: (offline) => set({ isOffline: offline }),
  
  // Sync state
  pendingSync: 0,
  setPendingSync: (count) => set({ pendingSync: count }),
}))

export default useStore
