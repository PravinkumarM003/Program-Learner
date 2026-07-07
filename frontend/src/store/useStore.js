import { create } from 'zustand'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('theme')
    if (saved) return saved
  }
  return 'dark'
}

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  theme: getInitialTheme(),
  setTheme: (newTheme) => set(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    return { theme: newTheme }
  }),
  toggleTheme: () => set((s) => {
    const newTheme = s.theme === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    return { theme: newTheme }
  })
}))
