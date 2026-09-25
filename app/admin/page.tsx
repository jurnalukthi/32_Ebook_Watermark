import { redirect } from 'next/navigation';
import { AdminActions } from '@/components/admin-actions';
import { ADMIN_EMAIL } from '@/lib/constants';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
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
    .limit(25);

  const adminInitial = user.email ? user.email.slice(0, 2).toUpperCase() : 'AD';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px 16px 64px' }}>
      <main style={{ maxWidth: 1120, margin: '0 auto' }}>
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: '20px 24px',
            marginBottom: 28,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#0f172a',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Dashboard Admin
                </h1>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: 9999,
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                  }}
                >
                  Watermark Engine
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                Monitoring lisensi unduhan e-book dan transaksi otomatis Lynk.id
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9999,
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {adminInitial}
              </div>
              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{user.email}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Administrator</div>
              </div>
            </div>

            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                style={{
                  height: 38,
                  padding: '0 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#dc2626',
                  backgroundColor: '#ffffff',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background-color 150ms',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Keluar
              </button>
            </form>
          </div>
        </header>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Total Pemasukan</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#15803d', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {formatCurrency(totalIncome)}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Akumulasi transaksi berhasil via webhook</div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Total Transaksi</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {totalTransactions}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Hak akses & token terbit ke pembeli</div>
          </div>

          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 14,
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>E-Book Terdaftar</span>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 4 }}>
                  {totalEbooks}
                </div>
              </div>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>File master di storage privat</div>
          </div>
        </section>

        <AdminActions
          ebooks={
            ebooks?.map((ebook) => ({
              id: ebook.id,
              title: ebook.title,
            })) || []
          }
        />

        <section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            marginBottom: 32,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Daftar E-Book Master
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#64748b' }}>
                Master dokumen PDF sumber watermarking dinamis
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 9999,
                backgroundColor: '#f1f5f9',
                color: '#475569',
              }}
            >
              {totalEbooks} Item
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Judul E-Book</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage Path</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ukuran File</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {ebooks && ebooks.length > 0 ? (
                  ebooks.map((ebook) => (
                    <tr key={ebook.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{ebook.title}</td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569', fontFamily: 'ui-monospace, monospace' }}>{ebook.file_path}</td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: '#64748b' }}>
                        {ebook.file_size ? `${(ebook.file_size / 1024).toFixed(1)} KB` : 'Belum dihitung'}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 10px',
                            borderRadius: 9999,
                            fontSize: 12,
                            fontWeight: 600,
                            backgroundColor: ebook.is_active ? '#ecfdf5' : '#f1f5f9',
                            color: ebook.is_active ? '#15803d' : '#64748b',
                            border: `1px solid ${ebook.is_active ? '#bbf7d0' : '#e2e8f0'}`,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 9999,
                              backgroundColor: ebook.is_active ? '#22c55e' : '#94a3b8',
                            }}
                          />
                          {ebook.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      Belum ada file master e-book terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '18px 24px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Hak Akses & Transaksi Terbaru
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#64748b' }}>
                Daftar pembeli yang telah menerima lisensi dan tautan unduhan
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: 9999,
                backgroundColor: '#f1f5f9',
                color: '#475569',
              }}
            >
              {totalTransactions} Data
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Penerima</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Pembeli</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nominal</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waktu</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sumber</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ref Transaksi</th>
                </tr>
              </thead>
              <tbody>
                {recentGrants && recentGrants.length > 0 ? (
                  recentGrants.map((grant) => (
                    <tr key={grant.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{grant.email}</td>
                      <td style={{ padding: '16px 24px', fontSize: 13, color: '#334155' }}>{grant.customer_name || '-'}</td>
                      <td style={{ padding: '16px 24px', fontSize: 13, fontWeight: 700, color: Number(grant.amount) > 0 ? '#15803d' : '#64748b' }}>
                        {formatCurrency(Number(grant.amount) || 0)}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(grant.created_at)}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: 'ui-monospace, monospace',
                            backgroundColor: '#f1f5f9',
                            color: '#475569',
                          }}
                        >
                          {grant.source}
                        </span>
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: 12, color: '#64748b', fontFamily: 'ui-monospace, monospace' }}>
                        {grant.trx_id || '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                      Belum ada transaksi atau hak akses tercatat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
