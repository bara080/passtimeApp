import { useState, useEffect, useCallback, useRef } from "react";
import { OTP_RESEND_DELAY_SECONDS } from "@/constants/phoneOtpLength";

export function useOtpTimer(initialSeconds = OTP_RESEND_DELAY_SECONDS) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    setSeconds(initialSeconds);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearTimer();
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [initialSeconds, clearTimer]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, []);

  return {
    seconds,
    isRunning,
    canResend: !isRunning,
    restart: startTimer,
  };
}
