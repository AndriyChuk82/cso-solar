import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center gap-4">
          <div className="text-6xl">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800">
            Щось пішло не так
          </h2>
          <p className="text-gray-600 max-w-md">
            Виникла помилка при завантаженні додатку. Спробуйте оновити сторінку.
          </p>
          {this.state.error && (
            <details className="mt-5 p-3 bg-gray-100 rounded-lg max-w-2xl text-left">
              <summary className="cursor-pointer font-semibold">
                Технічні деталі
              </summary>
              <pre className="mt-3 text-xs overflow-auto text-red-600">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
          >
            🔄 Оновити сторінку
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
