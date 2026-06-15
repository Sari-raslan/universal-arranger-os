import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AccountShell } from "./components/AccountShell.jsx";
import "./style.css";

class RuntimeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("UAOS React runtime error", error, info);
    if (window.uaosRuntime?.onRuntimeError) {
      window.uaosRuntime.onRuntimeError({
        message: error?.message || "Unknown React runtime error",
        stack: error?.stack || "",
        componentStack: info?.componentStack || "",
      });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <main className="runtimeError" role="alert">
          <p className="eyebrow">UAOS runtime error</p>
          <h1>UAOS could not render this screen.</h1>
          <p className="lead">
            A React error was caught before the desktop shell could go black.
            Check the Electron runtime log for details.
          </p>
          <pre>{this.state.error.message}</pre>
        </main>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("UAOS root element #root was not found.");
}

createRoot(rootElement).render(
  <RuntimeErrorBoundary>
    <AccountShell>
      <App />
    </AccountShell>
  </RuntimeErrorBoundary>
);
