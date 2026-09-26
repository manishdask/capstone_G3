import React from "react";
import { AlertTriangle, Home } from "lucide-react";
import Card from "./Card.jsx";
import Button from "./Button.jsx";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <Card style={{ textAlign: "center", padding: 24, background: "var(--surface, #fff)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--tint-amber)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <AlertTriangle size={22} color="var(--amber-deep)" />
            </div>
            <div className="f-display" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-deep)", marginBottom: 6 }}>
              Unable to load this page
            </div>
            <div className="f-body" style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 16, lineHeight: 1.5 }}>
              We encountered an issue displaying this section. Click below to return to your dashboard.
            </div>
            <Button small icon={Home} onClick={this.handleReset}>
              Return to Home
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
