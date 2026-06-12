import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="page">
          <section className="panel danger">
            <p className="eyebrow">Runtime Error</p>
            <h1>UAOS stopped this view safely.</h1>
            <p className="lead">{this.state.error.message}</p>
            <button onClick={() => this.setState({ error: null })}>Try Again</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

