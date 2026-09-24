export default function HomePage() {
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 640, margin: '0 auto', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: 28, marginBottom: 12 }}>Sistem Distribusi Ebook</h1>
      <p style={{ color: '#444', marginBottom: 20 }}>
        Layanan distribusi ebook privat dengan perlindungan tanda air dinamis.
      </p>
      <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, fontSize: 14 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Endpoint Webhook Lynk:</p>
        <code style={{ display: 'block', marginTop: 8, wordBreak: 'break-all' }}>
          POST /api/webhook/lynk
        </code>
      </div>
    </main>
  );
}
