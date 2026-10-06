import * as React from "react";
import { ErrorInfo } from "react";
import { CLASSES } from "./CSSClassNames";

/** @internal */
export interface IErrorBoundaryProps {
    message: string;
    retryText: string;
    children: React.ReactNode;
}
/** @internal */
export interface IErrorBoundaryState {
    hasError: boolean;
}

/**
 * React error boundary wrapping tab content. On a render error it shows the configured
 * `message` with a retry button (retry resets `hasError`, re-mounting the content)
 * instead of unmounting the whole layout.
 * @internal
 */
export class ErrorBoundary extends React.Component<IErrorBoundaryProps, IErrorBoundaryState> {
    constructor(props: IErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(_error: Error) {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // logged at debug level: the fallback UI (role="alert") is the user-facing signal,
        // so render errors stay inspectable without noisy console output
        console.debug(error);
        console.debug(errorInfo);
    }

    retry = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className={CLASSES.FLEXLAYOUT__ERROR_BOUNDARY_CONTAINER}>
                    <div role="alert" className={CLASSES.FLEXLAYOUT__ERROR_BOUNDARY_CONTENT}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            {this.props.message}
                            {/* explicit tabindex: Safari only tabs to elements with an explicit tabindex */}
                            <p>
                                <button tabIndex={0} onClick={this.retry}>
                                    {this.props.retryText}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
