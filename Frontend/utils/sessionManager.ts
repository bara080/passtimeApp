type SessionListener = (session: AuthSession | null) => void;

export type AuthSession = {
  uid: string;
  role: "member" | "host";
  accessToken: string;
  refreshToken: string;
  user: {
    uid: string;
    email: string;
    role: "member" | "host";
    firstName?: string;
    lastName?: string;
    displayName?: string;
    avatarUrl?: string;
    emailVerified: boolean;
    phoneVerified: boolean;
  };
};

let _session: AuthSession | null = null;
const listeners: Set<SessionListener> = new Set();

export function registerSessionHandler(fn: SessionListener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function updateSession(session: AuthSession | null) {
  _session = session;
  listeners.forEach((fn) => fn(session));
}

export function getSession(): AuthSession | null {
  return _session;
}
