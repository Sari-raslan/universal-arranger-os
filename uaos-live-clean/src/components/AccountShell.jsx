import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAccountSession } from "../hooks/useAccountSession.js";
import { openBillingPortal, startCheckout } from "../api/billingClient.js";
import "./account-shell.css";

const views = Object.freeze({
  login: "login",
  register: "register",
  verify: "verify",
  resetRequest: "reset-request",
  resetConfirm: "reset-confirm",
  account: "account",
});

function TextField({
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  placeholder,
}) {
  return (
    <label className="uaos-account-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
      />
    </label>
  );
}

function Feedback({ message, error }) {
  if (!message && !error) {
    return null;
  }

  return (
    <div
      className={
        error
          ? "uaos-account-feedback is-error"
          : "uaos-account-feedback is-success"
      }
      role="status"
    >
      {error || message}
    </div>
  );
}

function planLabel(subscription) {
  if (!subscription) {
    return "Free / No active subscription";
  }

  const names = {
    creator: "Studio - 7.99 EUR/month for 3 months, then 12.99 EUR/month",
    professional: "Pro Arranger - 19.99 EUR/month for 3 months, then 29.99 EUR/month",
  };

  return `${names[subscription.planId] || subscription.planId} (${subscription.status})`;
}

export function AccountShell({ children }) {
  const account = useAccountSession();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(views.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [developmentToken, setDevelopmentToken] = useState("");
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState("");

  useEffect(() => {
    if (account.signedIn) {
      setView(views.account);
    }
  }, [account.signedIn]);

  useEffect(() => {
    function onEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, []);

  const title = useMemo(() => {
    const titles = {
      [views.login]: "Sign in / طھط³ط¬ظٹظ„ ط§ظ„ط¯ط®ظˆظ„",
      [views.register]: "Create account / ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨",
      [views.verify]: "Verify email / طھظپط¹ظٹظ„ ط§ظ„ط¨ط±ظٹط¯",
      [views.resetRequest]: "Reset password / ط·ظ„ط¨ ط§ط³طھط¹ط§ط¯ط©",
      [views.resetConfirm]: "Set new password / ظƒظ„ظ…ط© ظ…ط±ظˆط± ط¬ط¯ظٹط¯ط©",
      [views.account]: "My UAOS account / ط­ط³ط§ط¨ظٹ",
    };

    return titles[view];
  }, [view]);

  async function submitLogin(event) {
    event.preventDefault();
    await account.actions.login({ email, password });
    setPassword("");
  }

  async function submitRegister(event) {
    event.preventDefault();
    const result = await account.actions.register({
      email,
      password,
    });

    if (result.verificationToken) {
      setDevelopmentToken(result.verificationToken);
      setVerificationToken(result.verificationToken);
    }

    setPassword("");
    setView(views.verify);
  }

  async function submitVerify(event) {
    event.preventDefault();
    await account.actions.verifyEmail(verificationToken);
    setDevelopmentToken("");
    setView(views.login);
  }

  async function submitResetRequest(event) {
    event.preventDefault();
    const result = await account.actions.requestReset(email);

    if (result.resetToken) {
      setDevelopmentToken(result.resetToken);
      setResetToken(result.resetToken);
    }

    setView(views.resetConfirm);
  }

  async function submitResetConfirm(event) {
    event.preventDefault();
    await account.actions.confirmReset({
      token: resetToken,
      password,
    });
    setPassword("");
    setDevelopmentToken("");
    setView(views.login);
  }

  async function goPortal() {
    setBillingBusy(true);
    setBillingError("");
    try {
      const response = await openBillingPortal();
      if (response.url) window.location.assign(response.url);
    } catch (error) {
      setBillingError(error.message);
      setBillingBusy(false);
    }
  }

  return (
    <>
      {children}

      <button
        className="uaos-account-launcher"
        type="button"
        onClick={() => {
          account.actions.clearFeedback();
          setView(account.signedIn ? views.account : views.login);
          setOpen(true);
        }}
        aria-label="Open UAOS account"
      >
        <span className="uaos-account-launcher-dot" />
        {account.signedIn
          ? account.user.email
          : "Account / ط§ظ„ط­ط³ط§ط¨"}
      </button>

      {open && (
        <div
          className="uaos-account-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpen(false);
            }
          }}
        >
          <section
            className="uaos-account-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="uaos-account-header">
              <div>
                <p className="uaos-account-kicker">UAOS ID</p>
                <h2>{title}</h2>
                <p className="uaos-account-health">
                  Accounts API:{" "}
                  <strong className={`is-${account.health}`}>
                    {account.health}
                  </strong>
                </p>
              </div>

              <button
                className="uaos-account-close"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close account panel"
              >
                أ—
              </button>
            </header>

            <Feedback
              message={account.message}
              error={account.error}
            />

            {developmentToken && (
              <div className="uaos-account-dev-token">
                <strong>Local development token</strong>
                <code>{developmentToken}</code>
                <span>
                  This appears only because the local email provider is
                  not configured.
                </span>
              </div>
            )}

            {view === views.login && (
              <form
                className="uaos-account-form"
                onSubmit={submitLogin}
              >
                <TextField
                  label="Email / ط§ظ„ط¨ط±ظٹط¯"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
                <TextField
                  label="Password / ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="current-password"
                  placeholder="12 characters minimum"
                />

                <button
                  className="uaos-account-primary"
                  disabled={account.busy}
                  type="submit"
                >
                  {account.busy ? "Working..." : "Sign in"}
                </button>

                <div className="uaos-account-links">
                  <button
                    type="button"
                    onClick={() => setView(views.register)}
                  >
                    Create account
                  </button>
                  <button
                    type="button"
                    onClick={() => setView(views.verify)}
                  >
                    Verify email
                  </button>
                  <button
                    type="button"
                    onClick={() => setView(views.resetRequest)}
                  >
                    Forgot password
                  </button>
                </div>
              </form>
            )}

            {view === views.register && (
              <form
                className="uaos-account-form"
                onSubmit={submitRegister}
              >
                <TextField
                  label="Email / ط§ظ„ط¨ط±ظٹط¯"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
                <TextField
                  label="Password / ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  placeholder="12 characters minimum"
                />

                <button
                  className="uaos-account-primary"
                  disabled={account.busy}
                  type="submit"
                >
                  {account.busy ? "Creating..." : "Create account"}
                </button>

                <button
                  className="uaos-account-secondary"
                  type="button"
                  onClick={() => setView(views.login)}
                >
                  Back to sign in
                </button>
              </form>
            )}

            {view === views.verify && (
              <form
                className="uaos-account-form"
                onSubmit={submitVerify}
              >
                <TextField
                  label="Verification token / ط±ظ…ط² ط§ظ„طھظپط¹ظٹظ„"
                  value={verificationToken}
                  onChange={setVerificationToken}
                  autoComplete="one-time-code"
                  placeholder="Paste verification token"
                />

                <button
                  className="uaos-account-primary"
                  disabled={account.busy}
                  type="submit"
                >
                  Verify email
                </button>

                <button
                  className="uaos-account-secondary"
                  type="button"
                  onClick={() => setView(views.login)}
                >
                  Back to sign in
                </button>
              </form>
            )}

            {view === views.resetRequest && (
              <form
                className="uaos-account-form"
                onSubmit={submitResetRequest}
              >
                <TextField
                  label="Account email / ط¨ط±ظٹط¯ ط§ظ„ط­ط³ط§ط¨"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  placeholder="name@example.com"
                />

                <button
                  className="uaos-account-primary"
                  disabled={account.busy}
                  type="submit"
                >
                  Request reset
                </button>

                <button
                  className="uaos-account-secondary"
                  type="button"
                  onClick={() => setView(views.login)}
                >
                  Back to sign in
                </button>
              </form>
            )}

            {view === views.resetConfirm && (
              <form
                className="uaos-account-form"
                onSubmit={submitResetConfirm}
              >
                <TextField
                  label="Reset token / ط±ظ…ط² ط§ظ„ط§ط³طھط¹ط§ط¯ط©"
                  value={resetToken}
                  onChange={setResetToken}
                  autoComplete="one-time-code"
                  placeholder="Paste reset token"
                />
                <TextField
                  label="New password / ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط± ط§ظ„ط¬ط¯ظٹط¯ط©"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  placeholder="12 characters minimum"
                />

                <button
                  className="uaos-account-primary"
                  disabled={account.busy}
                  type="submit"
                >
                  Save new password
                </button>
              </form>
            )}

            {view === views.account && account.user && (
              <div className="uaos-account-dashboard">
                <div className="uaos-account-user-card">
                  <span>Email</span>
                  <strong>{account.user.email}</strong>
                </div>

                <div className="uaos-account-user-card">
                  <span>Email verified</span>
                  <strong>
                    {account.user.emailVerified ? "Yes" : "No"}
                  </strong>
                </div>

                <div className="uaos-account-user-card">
                  <span>Current plan</span>
                  <strong>
                    {planLabel(account.user.subscription)}
                  </strong>
                </div>

                <div className="uaos-account-user-card">
                  <span>Licenses</span>
                  <strong>
                    {account.user.licenseIds?.length || 0}
                  </strong>
                </div>

                <button
                  className="uaos-account-secondary"
                  type="button"
                  disabled={account.busy}
                  onClick={() => account.actions.refresh()}
                >
                  Refresh account
                </button>

                {billingError && <div className="uaos-account-feedback is-error">{billingError}</div>}
                                <button
                  className="uaos-account-primary"
                  type="button"
                  disabled
                >
                  Studio founders price - checkout under review
                </button>
                                <button
                  className="uaos-account-primary"
                  type="button"
                  disabled
                >
                  Pro founders price - checkout under review
                </button>
                <button className="uaos-account-secondary" type="button" disabled={billingBusy} onClick={goPortal}>
                  Manage billing
                </button>

                <button
                  className="uaos-account-danger"
                  type="button"
                  disabled={account.busy}
                  onClick={() => account.actions.logout()}
                >
                  Sign out
                </button>
              </div>
            )}

            <footer className="uaos-account-footer">
              Local account foundation. Production still requires secure
              cookies, real email delivery, and a managed database.
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
