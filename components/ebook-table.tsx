'use client';

import { ChangeEvent, FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface EbookItem {
  id: string;
  title: string;
  slug: string;
  file_path: string;
  file_size: number | null;
  is_active: boolean;
  created_at: string;
}

interface EbookTableProps {
  ebooks: EbookItem[];
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Belum dihitung';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function EbookTable({ ebooks }: EbookTableProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingEbook, setEditingEbook] = useState<EbookItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const [deletingEbook, setDeletingEbook] = useState<EbookItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const openEditModal = (ebook: EbookItem) => {
    setEditingEbook(ebook);
    setEditTitle(ebook.title);
    setEditIsActive(ebook.is_active);
    setEditFile(null);
    setEditFeedback(null);
  };

  const closeEditModal = () => {
    setEditingEbook(null);
    setEditFile(null);
    setEditFeedback(null);
  };

  const openDeleteModal = (ebook: EbookItem) => {
    setDeletingEbook(ebook);
    setDeleteFeedback(null);
  };

  const closeDeleteModal = () => {
    setDeletingEbook(null);
    setDeleteFeedback(null);
  };

  const handleToggleActive = async (ebook: EbookItem) => {
    setTogglingId(ebook.id);
    try {
      const response = await fetch('/api/admin/ebooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ebook.id,
          is_active: !ebook.is_active,
        }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        router.refresh();
      }
    } catch {
      // Ignored
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingEbook) return;

    setIsUpdating(true);
    setEditFeedback(null);

    try {
      let response: Response;

      if (editFile) {
        const formData = new FormData();
        formData.append('id', editingEbook.id);
        formData.append('title', editTitle);
        formData.append('is_active', editIsActive ? 'true' : 'false');
        formData.append('file', editFile);

        response = await fetch('/api/admin/ebooks', {
          method: 'PATCH',
          body: formData,
        });
      } else {
        response = await fetch('/api/admin/ebooks', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingEbook.id,
            title: editTitle,
            is_active: editIsActive,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setEditFeedback({ isError: true, message: data.message || 'Gagal memperbarui e-book.' });
      } else {
        setEditFeedback({ isError: false, message: 'E-book berhasil diperbarui.' });
        router.refresh();
        setTimeout(() => {
          closeEditModal();
        }, 1000);
      }
    } catch {
      setEditFeedback({ isError: true, message: 'Kendala jaringan saat memperbarui.' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingEbook) return;

    setIsDeleting(true);
    setDeleteFeedback(null);

    try {
      const response = await fetch(`/api/admin/ebooks?id=${deletingEbook.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setDeleteFeedback({ isError: true, message: data.message || 'Gagal menghapus e-book.' });
      } else {
        setDeleteFeedback({ isError: false, message: 'E-book berhasil dihapus.' });
        router.refresh();
        setTimeout(() => {
          closeDeleteModal();
        }, 800);
      }
    } catch {
      setDeleteFeedback({ isError: true, message: 'Kendala jaringan saat menghapus.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setEditFile(file);
      } else {
        setEditFeedback({ isError: true, message: 'File harus berformat PDF.' });
      }
    }
  };

  return (
    <>
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
            {ebooks.length} Item
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Judul E-Book
                </th>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Storage Path
                </th>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Ukuran File
                </th>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status
                </th>
                <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {ebooks && ebooks.length > 0 ? (
                ebooks.map((ebook) => (
                  <tr key={ebook.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                      {ebook.title}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: '#475569', fontFamily: 'ui-monospace, monospace' }}>
                      {ebook.file_path}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: 13, color: '#64748b' }}>
                      {formatFileSize(ebook.file_size)}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(ebook)}
                        disabled={togglingId === ebook.id}
                        title="Klik untuk mengubah status aktif"
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
                          cursor: togglingId === ebook.id ? 'wait' : 'pointer',
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
                        {togglingId === ebook.id ? 'Memproses...' : ebook.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => openEditModal(ebook)}
                          title="Edit e-book"
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#0f172a',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                          </svg>
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => openDeleteModal(ebook)}
                          title="Hapus e-book"
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#dc2626',
                            backgroundColor: '#ffffff',
                            border: '1px solid #fecaca',
                            borderRadius: 6,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                    Belum ada file master e-book terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editingEbook && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 520,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: '32px 28px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
                  Edit E-Book Master
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                  Perbarui judul, status, atau unggah revisi file PDF
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {editFeedback && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    backgroundColor: editFeedback.isError ? '#fef2f2' : '#f0fdf4',
                    color: editFeedback.isError ? '#b91c1c' : '#15803d',
                    border: `1px solid ${editFeedback.isError ? '#fecaca' : '#bbf7d0'}`,
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                    {editFeedback.isError ? (
                      <>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </>
                    ) : (
                      <>
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </>
                    )}
                  </svg>
                  <span>{editFeedback.message}</span>
                </div>
              )}

              <div>
                <label htmlFor="edit-title" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Judul E-Book
                </label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    width: '100%',
                    height: 44,
                    padding: '0 14px',
                    fontSize: 14,
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    outline: 'none',
                    backgroundColor: '#ffffff',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Status E-Book
                </label>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    cursor: 'pointer',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0f172a' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                    Aktif (Dapat dicocokkan otomatis via Webhook Lynk)
                  </span>
                </label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                  Ganti File PDF Master (Opsional)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 8,
                    backgroundColor: '#ffffff',
                  }}
                >
                  <span style={{ fontSize: 13, color: editFile ? '#0f172a' : '#64748b', fontWeight: editFile ? 600 : 400 }}>
                    {editFile ? `${editFile.name} (${formatFileSize(editFile.size)})` : 'Pertahankan file PDF saat ini'}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#0f172a',
                        backgroundColor: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      {editFile ? 'Ganti' : 'Pilih File Baru'}
                    </button>
                    {editFile && (
                      <button
                        type="button"
                        onClick={() => setEditFile(null)}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#dc2626',
                          backgroundColor: '#ffffff',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          cursor: 'pointer',
                        }}
                      >
                        Batal
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    height: 42,
                    padding: '0 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editTitle.trim()}
                  style={{
                    height: 42,
                    padding: '0 22px',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: isUpdating || !editTitle.trim() ? '#94a3b8' : '#0f172a',
                    border: 'none',
                    borderRadius: 8,
                    cursor: isUpdating || !editTitle.trim() ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deletingEbook && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              backgroundColor: '#ffffff',
              borderRadius: 16,
              padding: '28px 24px',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>

            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: '0 0 8px 0' }}>
              Hapus E-Book Master?
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menghapus <strong>&quot;{deletingEbook.title}&quot;</strong>? File PDF di storage privat juga akan dihapus.
            </p>

            {deleteFeedback && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 13,
                  backgroundColor: deleteFeedback.isError ? '#fef2f2' : '#f0fdf4',
                  color: deleteFeedback.isError ? '#b91c1c' : '#15803d',
                  border: `1px solid ${deleteFeedback.isError ? '#fecaca' : '#bbf7d0'}`,
                  marginBottom: 16,
                }}
              >
                {deleteFeedback.message}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={closeDeleteModal}
                style={{
                  height: 38,
                  padding: '0 16px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                style={{
                  height: 38,
                  padding: '0 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#ffffff',
                  backgroundColor: isDeleting ? '#94a3b8' : '#dc2626',
                  border: 'none',
                  borderRadius: 8,
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
