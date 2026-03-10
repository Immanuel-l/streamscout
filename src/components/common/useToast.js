import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

// Global toast trigger for use outside React (e.g. Axios interceptors)
let globalShowToast = null

export function setGlobalToast(fn) {
  globalShowToast = fn
}

export function showGlobalToast(message, type) {
  globalShowToast?.(message, type)
}
