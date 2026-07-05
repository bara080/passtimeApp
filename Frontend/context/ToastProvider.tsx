import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Animated, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ToastView } from "@/components/ui/ToastView";

export type ToastType = "success" | "error" | "info";

export type ToastOptions = {
  type?: ToastType;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms. Default 3500. */
  duration?: number;
};

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

const DEFAULT_DURATION = 3500;
const MAX_VISIBLE = 3;

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const counter = useRef(0);
  const slide = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    ({ type = "info", title, message, duration = DEFAULT_DURATION }: ToastOptions) => {
      const id = `toast-${++counter.current}`;
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, type, title, message }]);
      Animated.spring(slide, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration)
      );
    },
    [dismiss, slide]
  );

  const value = useMemo<ToastContextType>(
    () => ({
      show,
      success: (title, message) => show({ type: "success", title, message }),
      error: (title, message) => show({ type: "error", title, message }),
      info: (title, message) => show({ type: "info", title, message }),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.length > 0 ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: "absolute",
            top: insets.top,
            bottom: insets.bottom,
            left: 0,
            right: 0,
            justifyContent: "center",
            opacity: slide,
            transform: [
              {
                scale: slide.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }),
              },
            ],
          }}
        >
          <View pointerEvents="box-none">
            {toasts.map((toast) => (
              <ToastView key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
