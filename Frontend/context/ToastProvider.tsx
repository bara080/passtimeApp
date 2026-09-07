import { createContext, useContext, useMemo, type PropsWithChildren } from "react";
import { useAlertModal } from "@/context/AlertModalProvider";

export type ToastType = "success" | "error" | "info";

export type ToastOptions = {
  type?: ToastType;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms. Forwarded to the modal (default there ~6s). */
  duration?: number;
};

// Kept for backwards-compat with any importers of this type.
export type ToastData = Required<Pick<ToastOptions, "title">> & {
  id: string;
  type: ToastType;
  message?: string;
};

type ToastContextType = {
  show: (options: ToastOptions) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastContextType>({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
});

/**
 * Product decision: ALL app messages surface through the single centered global
 * modal (`AlertModalProvider`), not a top toast. This provider is now a thin
 * compatibility shim so every existing `useToast().error/success/info(...)` call
 * site keeps working unchanged but renders the centered modal. Requires
 * AlertModalProvider to be an ancestor (see app/_layout.tsx).
 */
export function ToastProvider({ children }: PropsWithChildren) {
  const alertModal = useAlertModal();

  const value = useMemo<ToastContextType>(
    () => ({
      show: ({ type = "info", title, message, duration }: ToastOptions) =>
        alertModal.show({ type, title, message, duration }),
      success: (title, message) => alertModal.show({ type: "success", title, message }),
      error: (title, message) => alertModal.show({ type: "error", title, message }),
      info: (title, message) => alertModal.show({ type: "info", title, message }),
    }),
    [alertModal]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  return useContext(ToastContext);
}
