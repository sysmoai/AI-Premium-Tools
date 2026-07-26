import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div
            className="mx-auto h-20 w-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg"
            style={{ background: "linear-gradient(135deg, hsl(0 84% 60%), hsl(20 90% 55%))" }}
          >
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            Something went wrong
          </h1>
          <p className="text-muted-foreground mb-6 text-sm">
            We hit an unexpected error. Refreshing the page usually fixes it. If the problem
            persists, please reach out on WhatsApp.
          </p>
          {this.state.error?.message && (
            <details className="text-xs text-muted-foreground mb-6 text-left bg-muted/50 rounded-lg p-3">
              <summary className="cursor-pointer font-medium">Technical details</summary>
              <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
            </details>
          )}
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="gap-2" data-testid="btn-error-reload">
              <RefreshCw className="h-4 w-4" /> Reload page
            </Button>
            <Button variant="outline" onClick={() => { this.reset(); window.location.href = "/"; }} className="gap-2" data-testid="btn-error-home">
              <Home className="h-4 w-4" /> Back to home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
