import { router, useLocalSearchParams } from "expo-router";
import { AuthScreen, SuccessView } from "@/components/auth";

/**
 * Shared success step between auth stages.
 * Params: title, message, buttonLabel, next (route to replace to), plus optional
 * `nextParams` (JSON-encoded params object for the next route).
 */
export default function AuthSuccessScreen() {
  const { title, message, buttonLabel, next, nextParams } = useLocalSearchParams<{
    title?: string;
    message?: string;
    buttonLabel?: string;
    next: string;
    nextParams?: string;
  }>();

  const handleContinue = () => {
    const params = nextParams ? JSON.parse(nextParams) : undefined;
    router.replace(params ? ({ pathname: next as never, params } as never) : (next as never));
  };

  return (
    <AuthScreen showBack={false} scroll={false}>
      <SuccessView
        title={title ?? "Success"}
        message={message}
        buttonLabel={buttonLabel ?? "Continue"}
        onContinue={handleContinue}
      />
    </AuthScreen>
  );
}
