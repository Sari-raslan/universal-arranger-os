import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  confirmPasswordReset,
  fetchAccountsHealth,
  fetchCurrentAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  requestPasswordReset,
  verifyAccountEmail,
} from "../api/accountsClient.js";

const SESSION_KEY = "uaos.accounts.session.v1";

function readStoredToken() {
  try {
    return window.localStorage.getItem(SESSION_KEY) || "";
  } catch {
    return "";
  }
}

function writeStoredToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(SESSION_KEY, token);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
  }
}

export function useAccountSession() {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(null);
  const [health, setHealth] = useState("checking");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const run = useCallback(async (operation) => {
    setBusy(true);
    setError("");
    setMessage("");

    try {
      return await operation();
    } catch (operationError) {
      setError(
        operationError instanceof Error
          ? operationError.message
          : String(operationError),
      );
      throw operationError;
    } finally {
      setBusy(false);
    }
  }, []);

  const refresh = useCallback(async (sessionToken = token) => {
    

    try {
      const result = await fetchCurrentAccount(sessionToken || undefined);
      setUser(result.user);
      return result.user;
    } catch {
      writeStoredToken("");
      setToken("");
      setUser(null);
      return null;
    }
  }, [token]);

  useEffect(() => {
    fetchAccountsHealth()
      .then(() => setHealth("online"))
      .catch(() => setHealth("offline"));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const actions = useMemo(() => ({
    async register(input) {
      return run(async () => {
        const result = await registerAccount(input);
        setMessage(
          "Account created. Verify the email before logging in.",
        );
        return result;
      });
    },

    async verifyEmail(verificationToken) {
      return run(async () => {
        const result = await verifyAccountEmail(verificationToken);
        setMessage("Email verified. You can now log in.");
        return result;
      });
    },

    async login(input) {
      return run(async () => {
        const result = await loginAccount(input);
        if (result.sessionToken) {
          writeStoredToken(result.sessionToken);
          setToken(result.sessionToken);
        } else {
          writeStoredToken("");
          setToken("");
        }
        setUser(result.user);
        setMessage("Signed in successfully.");
        return result;
      });
    },

    async logout() {
      return run(async () => {
        if (token) {
          await logoutAccount(token).catch(() => null);
        }

        writeStoredToken("");
        setToken("");
        setUser(null);
        setMessage("Signed out.");
      });
    },

    async requestReset(email) {
      return run(async () => {
        const result = await requestPasswordReset(email);
        setMessage(
          "Password reset request accepted.",
        );
        return result;
      });
    },

    async confirmReset(input) {
      return run(async () => {
        const result = await confirmPasswordReset(input);
        writeStoredToken("");
        setToken("");
        setUser(null);
        setMessage(
          "Password changed. Sign in with the new password.",
        );
        return result;
      });
    },

    async refresh() {
      return run(() => refresh());
    },

    clearFeedback() {
      setMessage("");
      setError("");
    },
  }), [refresh, run, token]);

  return {
    token,
    user,
    health,
    busy,
    message,
    error,
    signedIn: Boolean(user),
    actions,
  };
}