import { Component, type ErrorInfo, type ReactNode } from 'react';
import { STRINGS } from '@/shared/constants/strings';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** 表示範囲の名前。エラー画面の見出しに使う */
  label?: string;
}

interface ErrorBoundaryState {
  failed: boolean;
}

/** 描画中の例外を捕捉し、画面全体が白くなるのを防ぐ */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // PAT を含みうる値は出さず、エラー名とコンポーネントスタックだけ記録する
    console.error(`[ErrorBoundary] ${error.name}`, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="flex flex-col items-center justify-center gap-3 h-full p-6">
        <p className="text-sm text-[var(--text-primary)]">
          {STRINGS.app.boundaryMessage(this.props.label ?? STRINGS.app.boundaryDefault)}
        </p>
        <button
          onClick={() => this.setState({ failed: false })}
          className="h-9 px-4 text-sm font-medium rounded-lg"
          style={{ backgroundColor: 'var(--accent-blue)', color: 'var(--bg-tertiary)' }}
        >
          {STRINGS.common.retry}
        </button>
      </div>
    );
  }
}
