import Link from 'next/link';

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: 540,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          padding: '40px 32px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 9999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#15803d',
              border: '1px solid #bbf7d0',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                backgroundColor: '#22c55e',
              }}
            />
            Sistem Aktif & Terlindungi
          </span>
        </div>

        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: '#0f172a',
            letterSpacing: '-0.02em',
            margin: '0 0 10px 0',
          }}
        >
          E-Book Watermark Service
        </h1>
        <p
          style={{
            fontSize: 15,
            color: '#64748b',
            margin: '0 0 28px 0',
            lineHeight: 1.6,
          }}
        >
          Infrastruktur distribusi e-book otomatis dengan enkapsulasi hak cipta dan penyematan tanda air digital dinamis per pembeli.
        </p>

        <div
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: 18,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Endpoint Webhook Lynk
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: 4 }}>
              Ready
            </span>
          </div>
          <code
            style={{
              display: 'block',
              fontFamily: 'ui-monospace, monospace',
              fontSize: 13,
              color: '#0f172a',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '8px 12px',
              wordBreak: 'break-all',
            }}
          >
            POST /api/webhook/lynk
          </code>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <Link
            href="/admin/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              height: 44,
              padding: '0 20px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 8,
              transition: 'background-color 150ms',
            }}
          >
            Masuk Portal Admin
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
