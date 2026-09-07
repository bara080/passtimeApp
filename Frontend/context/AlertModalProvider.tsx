import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Modal, View, Text, Pressable } from "react-native";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

export type AlertModalType = "error" | "info" | "success";

export type AlertModalOptions = {
  title: string;
  message?: string;
  type?: AlertModalType;
  /** Auto-dismiss delay in ms. Default 6000 (in the requested 5–7s range). */
  duration?: number;
  /** Text for the confirm button. Default "OK". */
  actionLabel?: string;
};

type AlertModalContextType = {
  show: (options: AlertModalOptions) => void;
  hide: () => void;
};

const AlertModalContext = createContext<AlertModalContextType>({
  show: () => {},
  hide: () => {},
});

const DEFAULT_DURATION = 6000; // 6s — user asked for ~5–7s

/** App-wide centered modal for important, momentary messages (e.g. auth errors).
 *  Unlike the top toast, this is centered and dims the screen. Auto-dismisses
 *  after `duration`, and can be dismissed by the button or tapping the backdrop. */
export function AlertModalProvider({ children }: PropsWithChildren) {
  const { palette } = useThemeColors();
  const [state, setState] = useState<AlertModalOptions | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const hide = useCallback(() => {
    clearTimer();
    setState(null);
  }, [clearTimer]);

  const show = useCallback(
    (options: AlertModalOptions) => {
      clearTimer();
      setState(options);
      timer.current = setTimeout(() => setState(null), options.duration ?? DEFAULT_DURATION);
    },
    [clearTimer]
  );

  // Clean up the timer if the provider unmounts mid-countdown.
  useEffect(() => clearTimer, [clearTimer]);

  const value = useMemo<AlertModalContextType>(() => ({ show, hide }), [show, hide]);

  const type = state?.type ?? "error";
  const accent = type === "error" ? "#e5484d" : type === "success" ? "#7cb342" : palette.accent;
  const Icon = type === "error" ? AlertTriangle : type === "success" ? CheckCircle2 : Info;

  return (
    <AlertModalContext.Provider value={value}>
      {children}
      <Modal visible={!!state} transparent animationType="fade" onRequestClose={hide} statusBarTranslucent>
        <Pressable
          onPress={hide}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          {/* Stop taps on the card from bubbling to the dismiss-on-backdrop press. */}
          <Pressable
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 360,
              borderRadius: 16,
              paddingVertical: 24,
              paddingHorizontal: 20,
              alignItems: "center",
              gap: 10,
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${accent}22`,
                marginBottom: 4,
              }}
            >
              <Icon size={26} color={accent} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: "700", color: palette.textPrimary, textAlign: "center" }}>
              {state?.title}
            </Text>
            {state?.message ? (
              <Text style={{ fontSize: 14, lineHeight: 20, color: palette.textMuted, textAlign: "center" }}>
                {state.message}
              </Text>
            ) : null}
            <Pressable
              onPress={hide}
              accessibilityRole="button"
              style={{ marginTop: 10, paddingVertical: 10, paddingHorizontal: 28, borderRadius: 10, backgroundColor: accent }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>{state?.actionLabel ?? "OK"}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertModalContext.Provider>
  );
}

export function useAlertModal() {
  return useContext(AlertModalContext);
}
