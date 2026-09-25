import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const ADMIN_EMAIL = 'jurnalukthi@gmail.com';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AdminDashboardPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/admin/login');
  }

  const { data: ebooks } = await supabase
    .from('ebooks')
    .select('id, title, slug, file_path, file_size, is_active, created_at')
    .order('created_at', { ascending: false });

  const { data: allGrants } = await supabase
    .from('access_grants')
    .select('amount');

  const totalIncome =
    allGrants?.reduce((sum, grant) => sum + (Number(grant.amount) || 0), 0) || 0;
  const totalTransactions = allGrants?.length || 0;
  const totalEbooks = ebooks?.length || 0;

  const { data: recentGrants } = await supabase
    .from('access_grants')
    .select('id, email, customer_name, source, trx_id, amount, created_at, ebooks(title)')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <main
      style={{
        width: '100%',
        maxWidth: 960,
        margin: '40px auto',
        padding: '32px 24px',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 20,
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: '#111827' }}>
            Dashboard Admin
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: 14, color: '#6b7280' }}>
            Masuk sebagai: <strong>{user.email}</strong>
          </p>
        </div>

        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            style={{
              padding: '8px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#dc2626',
              backgroundColor: '#fee2e2',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Keluar (Logout)
          </button>
        </form>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div
          style={{
            padding: 20,
            borderRadius: 8,
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>Total Pemasukan</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#15803d', marginTop: 6 }}>
            {formatCurrency(totalIncome)}
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 8,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Total Transaksi</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>
            {totalTransactions}
          </div>
        </div>

        <div
          style={{
            padding: 20,
            borderRadius: 8,
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>E-Book Terdaftar</span>
          <div style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', marginTop: 6 }}>
            {totalEbooks}
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px 0', color: '#1f2937' }}>
          Daftar E-Book Master
        </h2>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Judul</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>File Path</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Ukuran</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {ebooks && ebooks.length > 0 ? (
                ebooks.map((ebook) => (
                  <tr key={ebook.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{ebook.title}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{ebook.file_path}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>
                      {ebook.file_size ? `${(ebook.file_size / 1024).toFixed(1)} KB` : 'Belum disetel'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 9999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: ebook.is_active ? '#dcfce7' : '#f3f4f6',
                          color: ebook.is_active ? '#15803d' : '#6b7280',
                        }}
                      >
                        {ebook.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                    Belum ada ebook master terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px 0', color: '#1f2937' }}>
          Hak Akses & Transaksi Terbaru
        </h2>
        <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Email Penerima</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Nama Pembeli</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Nominal</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Sumber</th>
                <th style={{ padding: '12px 16px', color: '#4b5563' }}>Ref Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {recentGrants && recentGrants.length > 0 ? (
                recentGrants.map((grant) => (
                  <tr key={grant.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{grant.email}</td>
                    <td style={{ padding: '12px 16px' }}>{grant.customer_name || '-'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#15803d' }}>
                      {formatCurrency(Number(grant.amount) || 0)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{grant.source}</td>
                    <td style={{ padding: '12px 16px', color: '#6b7280' }}>{grant.trx_id || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>
                    Belum ada data akses.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
