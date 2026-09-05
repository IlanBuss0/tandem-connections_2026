import { Component, type ReactNode } from "react";
import ScreenError from "@/components/ScreenError";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
};

export default class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ScreenErrorBoundary]", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ScreenError
          title="No se pudo cargar esta sección"
          description="Algo falló al mostrar esta parte de la app. Podés intentar de nuevo o volver al inicio."
          onRetry={this.handleRetry}
          onGoHome={() => {
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}
