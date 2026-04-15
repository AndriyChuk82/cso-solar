export function Spinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      gap: '16px'
    }}>
      <img
        src="https://i.ibb.co/32JD4dc/logo.png"
        alt="CSO Solar"
        style={{ height: '48px' }}
      />
      <div className="spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #f09433',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>Завантаження проєктів...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
