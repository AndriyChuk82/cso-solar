import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          gap: '16px'
        }}>
          <div style={{ fontSize: '4rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#333' }}>
            Щось пішло не так
          </h2>
          <p style={{ color: '#666', maxWidth: '500px' }}>
            Виникла помилка при завантаженні додатку. Спробуйте оновити сторінку.
          </p>
          {this.state.error && (
            <details style={{
              marginTop: '20px',
              padding: '12px',
              background: '#f5f5f5',
              borderRadius: '8px',
              maxWidth: '600px',
              textAlign: 'left'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Технічні деталі
              </summary>
              <pre style={{
                marginTop: '12px',
                fontSize: '12px',
                overflow: 'auto',
                color: '#d32f2f'
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px',
              padding: '12px 24px',
              background: '#f09433',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🔄 Оновити сторінку
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
