import { create } from 'zustand'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('theme')
    if (saved) return saved
  }
  return 'dark'
}

const getInitialIdeTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem('ideTheme')
    if (saved) return saved
  }
  return 'vs-dark'
}

export const useStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
  
  // App UI Theme (light/dark)
  theme: getInitialTheme(),
  toggleTheme: () => set((s) => {
    const newTheme = s.theme === 'dark' ? 'light' : 'dark'
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
    }
    return { theme: newTheme }
  }),

  // IDE Editor Theme
  ideTheme: getInitialIdeTheme(),
  setIdeTheme: (newTheme) => set(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ideTheme', newTheme)
    }
    return { ideTheme: newTheme }
  })
}))
