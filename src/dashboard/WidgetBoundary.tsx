import { Component, type ReactNode } from "react";
import { TriangleAlert, X } from "lucide-react";
import { Button } from "../primitives/Button";

export interface WidgetBoundaryProps {
  /** Changing it (a new config, say) gives a broken widget another try. */
  resetKey?: unknown;
  /** Offered on the neutral card: a broken widget can always be taken off. */
  onRemove?: () => void;
  labels?: { broken?: string; remove?: string };
  children: ReactNode;
}

/** The error barrier around one widget: a render error shows a neutral card
 * (with "Remove") instead of the widget, and the rest of the dashboard stays. */
export class WidgetBoundary extends Component<WidgetBoundaryProps, { error: unknown }> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    // A thrown null or undefined still counts as an error.
    return { error: error ?? new Error("widget") };
  }

  componentDidUpdate(prev: WidgetBoundaryProps) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const { labels, onRemove } = this.props;
    return (
      <div role="alert" className="flex h-full min-h-0 flex-col items-center justify-center gap-2 overflow-hidden p-3 text-center">
        <TriangleAlert size={18} strokeWidth={1.75} className="shrink-0 text-text-muted" />
        <p className="text-sm text-text-muted">{labels?.broken ?? "This widget couldn't be shown."}</p>
        {onRemove && (
          <Button variant="secondary" size="sm" onClick={onRemove}>
            <X /> {labels?.remove ?? "Remove"}
          </Button>
        )}
      </div>
    );
  }
}
