'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface GrantItem {
  id: string;
  email: string;
  customer_name?: string | null;
  source: string;
  trx_id?: string | null;
  amount: number | string | null;
  created_at: string;
  ebooks?: { title: string } | { title: string }[] | null | unknown;
}

interface GrantsTableProps {
  grants: GrantItem[];
  totalCount: number;
}

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

export function GrantsTable({ grants, totalCount }: GrantsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'paid' | 'zero'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  // Filtered data
  const filteredGrants = useMemo(() => {
    return grants.filter((g) => {
      const q = search.toLowerCase();
      const matchSearch =
        g.email.toLowerCase().includes(q) ||
        (g.customer_name && g.customer_name.toLowerCase().includes(q)) ||
        (g.trx_id && g.trx_id.toLowerCase().includes(q)) ||
        g.source.toLowerCase().includes(q);

      if (!matchSearch) return false;

      const amt = Number(g.amount) || 0;
      if (filterType === 'paid') return amt > 0;
      if (filterType === 'zero') return amt === 0;
      return true;
    });
  }, [grants, search, filterType]);

  const handleSelectAll = () => {
    if (selectedIds.length === filteredGrants.length && filteredGrants.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredGrants.map((g) => g.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteOne = async (id: string, name: string) => {
    if (!window.confirm(`Hapus data transaksi atas nama "${name || 'Pembeli'}" dari database Supabase?`)) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/grants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus data.');

      setFeedback({ isError: false, message: data.message });
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      router.refresh();
    } catch (err) {
      setFeedback({ isError: true, message: err instanceof Error ? err.message : 'Gagal menghapus data.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Hapus ${selectedIds.length} data transaksi terpilih secara permanen dari database Supabase?`)) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/grants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal menghapus data.');

      setFeedback({ isError: false, message: data.message });
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      setFeedback({ isError: true, message: err instanceof Error ? err.message : 'Gagal menghapus data.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCleanTestRecords = async () => {
    if (!window.confirm('Hapus semua data simulasi transaksi (Rp 0 atau bertanda TEST) dari database Supabase?')) {
      return;
    }

    setIsDeleting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/grants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'clean_test' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal membersihkan data test.');

      setFeedback({ isError: false, message: data.message });
      setSelectedIds([]);
      router.refresh();
    } catch (err) {
      setFeedback({ isError: true, message: err instanceof Error ? err.message : 'Gagal membersihkan data test.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Email Penerima', 'Nama Pembeli', 'Nominal', 'Waktu', 'Sumber', 'Ref Transaksi'];
    const rows = filteredGrants.map((d) => [
      `"${d.email}"`,
      `"${d.customer_name || '-'}"`,
      Number(d.amount) || 0,
      `"${formatDate(d.created_at)}"`,
      `"${d.source}"`,
      `"${d.trx_id || '-'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi_supabase_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 14,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Hak Akses & Transaksi Terbaru
          </h2>
          <p style={{ margin: '2px 0 0 0', fontSize: 13, color: '#64748b' }}>
            Daftar pembeli yang telah menerima lisensi dan tautan unduhan (Database Supabase)
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            {totalCount} Data di DB
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div
        style={{
          padding: '14px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 400 }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari email, nama, atau Ref Transaksi..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#e2e8f0', padding: 3, borderRadius: 8 }}>
            <button
              type="button"
              onClick={() => setFilterType('all')}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: filterType === 'all' ? 700 : 500,
                backgroundColor: filterType === 'all' ? '#ffffff' : 'transparent',
                color: filterType === 'all' ? '#0f172a' : '#64748b',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Semua ({grants.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('paid')}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: filterType === 'paid' ? 700 : 500,
                backgroundColor: filterType === 'paid' ? '#ffffff' : 'transparent',
                color: filterType === 'paid' ? '#15803d' : '#64748b',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Berbayar
            </button>
            <button
              type="button"
              onClick={() => setFilterType('zero')}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: filterType === 'zero' ? 700 : 500,
                backgroundColor: filterType === 'zero' ? '#ffffff' : 'transparent',
                color: filterType === 'zero' ? '#b45309' : '#64748b',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Rp 0 / Test
            </button>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              {selectedIds.length === filteredGrants.length && filteredGrants.length > 0 ? 'Batal Pilih Semua' : 'Pilih Semua'}
            </button>

            {selectedIds.length > 0 && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteSelected}
                style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: 6,
                  color: '#b91c1c',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                }}
              >
                {isDeleting ? 'Menghapus...' : `Hapus Terpilih (${selectedIds.length})`}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Bersihkan Data Test */}
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleCleanTestRecords}
              title="Hapus data Rp 0 atau bertanda TEST dari Supabase"
              style={{
                padding: '6px 14px',
                fontSize: 12,
                fontWeight: 700,
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: 6,
                color: '#92400e',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🧹</span>
              <span>Bersihkan Data Test (Rp 0)</span>
            </button>

            {/* Export CSV */}
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: feedback.isError ? '#fee2e2' : '#ecfdf5',
              color: feedback.isError ? '#991b1b' : '#065f46',
              border: `1px solid ${feedback.isError ? '#fca5a5' : '#a7f3d0'}`,
            }}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ width: 40, padding: '12px 16px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredGrants.length && filteredGrants.length > 0}
                  onChange={handleSelectAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Penerima</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nama Pembeli</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nominal</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Waktu</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sumber</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ref Transaksi</th>
              <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrants.length > 0 ? (
              filteredGrants.map((grant) => {
                const isSelected = selectedIds.includes(grant.id);
                return (
                  <tr
                    key={grant.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      backgroundColor: isSelected ? '#fefce8' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(grant.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                      {grant.email}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 13, color: '#334155' }}>
                      {grant.customer_name || '-'}
                    </td>
                    <td
                      style={{
                        padding: '14px 20px',
                        fontSize: 13,
                        fontWeight: 700,
                        color: Number(grant.amount) > 0 ? '#15803d' : '#64748b',
                      }}
                    >
                      {formatCurrency(Number(grant.amount) || 0)}
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {formatDate(grant.created_at)}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
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
                    <td style={{ padding: '14px 20px', fontSize: 12, color: '#64748b', fontFamily: 'ui-monospace, monospace' }}>
                      {grant.trx_id || '-'}
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDeleteOne(grant.id, grant.customer_name || grant.email)}
                        title="Hapus data dari Supabase"
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: 4,
                          cursor: isDeleting ? 'not-allowed' : 'pointer',
                        }}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  Tidak ada data transaksi yang sesuai filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
