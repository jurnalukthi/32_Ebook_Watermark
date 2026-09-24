export default function HomePage() {
  return (
    <main style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <h1>Ebook Watermark</h1>
      <p>Private ebook access and watermark delivery system.</p>
      <p>Webhook endpoint: POST /api/webhook/lynk</p>
      <p>Scope: grant access by email, validate token, and watermark PDF before download.</p>
    </main>
  );
}
