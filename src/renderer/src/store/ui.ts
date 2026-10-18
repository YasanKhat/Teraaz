import { create } from 'zustand'

export type Page =
  | 'dashboard'
  | 'sales'
  | 'purchases'
  | 'expenses'
  | 'contacts'
  | 'products'
  | 'accounts'
  | 'journal'
  | 'reports'
  | 'settings'
  | 'invoice'

interface NavState {
  page: Page
  id?: string
  create: boolean
  navigate: (page: Page, options?: { id?: string; create?: boolean }) => void
  clearCreate: () => void
}

export const useNav = create<NavState>((set) => ({
  page: 'dashboard',
  id: undefined,
  create: false,
  navigate: (page, options) =>
    set({
      page,
      id: options?.id,
      create: Boolean(options?.create)
    }),
  clearCreate: () => set({ create: false })
}))

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

interface ToastState {
  items: ToastItem[]
  push: (toast: Omit<ToastItem, 'id'>) => void
  dismiss: (id: number) => void
}

let toastCounter = 0

export const useToasts = create<ToastState>((set, get) => ({
  items: [],
  push: (toast) => {
    toastCounter += 1
    const item = { ...toast, id: toastCounter }
    set((state) => ({ items: [...state.items, item].slice(-4) }))
    window.setTimeout(() => {
      if (get().items.some((existing) => existing.id === item.id)) {
        set((state) => ({ items: state.items.filter((existing) => existing.id !== item.id) }))
      }
    }, 4600)
  },
  dismiss: (id) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== id) }))
}))

export const toast = {
  success: (title: string, description?: string) =>
    useToasts.getState().push({ title, description, tone: 'success' }),
  error: (title: string, description?: string) =>
    useToasts.getState().push({ title, description, tone: 'error' }),
  info: (title: string, description?: string) =>
    useToasts.getState().push({ title, description, tone: 'info' })
}

interface ConfirmState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger: boolean
  resolve: ((value: boolean) => void) | null
}

export const useConfirm = create<ConfirmState>(() => ({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'تأیید',
  cancelLabel: 'انصراف',
  danger: false,
  resolve: null
}))

export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    useConfirm.setState({
      open: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'تأیید',
      cancelLabel: options.cancelLabel ?? 'انصراف',
      danger: options.danger ?? false,
      resolve
    })
  })
}

export function finishConfirm(value: boolean): void {
  const resolver = useConfirm.getState().resolve
  useConfirm.setState({ open: false, resolve: null })
  resolver?.(value)
}

interface UiState {
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  notificationsOpen: boolean
  setNotificationsOpen: (open: boolean) => void
}

export const useUi = create<UiState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  notificationsOpen: false,
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen })
}))
