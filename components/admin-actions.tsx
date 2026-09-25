'use client';

import { ChangeEvent, FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EbookOption {
  id: string;
  title: string;
}

interface AdminActionsProps {
  ebooks: EbookOption[];
}

export function AdminActions({ ebooks }: AdminActionsProps) {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<'upload' | 'grant' | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const [grantEmail, setGrantEmail] = useState('');
  const [grantName, setGrantName] = useState('');
  const [grantEbookId, setGrantEbookId] = useState(ebooks[0]?.id || '');
  const [grantAmount, setGrantAmount] = useState('0');
  const [isGranting, setIsGranting] = useState(false);
  const [grantFeedback, setGrantFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!uploadFile) {
      setUploadFeedback({ isError: true, message: 'Silakan pilih file PDF master.' });
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('file', uploadFile);

      const response = await fetch('/api/admin/ebooks', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setUploadFeedback({ isError: true, message: data.message || 'Gagal mengunggah e-book.' });
      } else {
        setUploadFeedback({ isError: false, message: 'E-book master berhasil diunggah.' });
        setUploadTitle('');
        setUploadFile(null);
        router.refresh();
        setTimeout(() => {
          setActiveModal(null);
          setUploadFeedback(null);
        }, 1200);
      }
    } catch {
      setUploadFeedback({ isError: true, message: 'Kendala jaringan saat mengunggah.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleGrantSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGranting(true);
    setGrantFeedback(null);

    try {
      const response = await fetch('/api/admin/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: grantEmail,
          customerName: grantName || undefined,
          ebookId: grantEbookId,
          amount: Number(grantAmount) || 0,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setGrantFeedback({ isError: true, message: data.message || 'Gagal memberikan akses.' });
      } else {
        setGrantFeedback({ isError: false, message: 'Akses berhasil diberikan dan email terkirim.' });
        setGrantEmail('');
        setGrantName('');
        setGrantAmount('0');
        router.refresh();
        setTimeout(() => {
          setActiveModal(null);
          setGrantFeedback(null);
        }, 1200);
      }
    } catch {
      setGrantFeedback({ isError: true, message: 'Kendala jaringan saat memproses akses.' });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <button
          type="button"
          onClick={() => setActiveModal('upload')}
          style={{
            height: 42,
            padding: '0 18px',
            fontSize: 13,
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: '#0f172a',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 150ms',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Unggah E-Book Master
        </button>

        <button
          type="button"
          onClick={() => setActiveModal('grant')}
          style={{
            height: 42,
            padding: '0 18px',
            fontSize: 13,
            fontWeight: 600,
            color: '#0f172a',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background-color 150ms',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7.5" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Beri Akses Manual
        </button>
      </div>

      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(3px)',
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
              maxWidth: 480,
              backgroundColor: '#ffffff',
              borderRadius: 14,
              padding: 28,
              boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.15)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {activeModal === 'upload' ? 'Unggah E-Book Master Baru' : 'Pemberian Akses E-Book Manual'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveModal(null);
                  setUploadFeedback(null);
                  setGrantFeedback(null);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
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

            {activeModal === 'upload' && (
              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {uploadFeedback && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      backgroundColor: uploadFeedback.isError ? '#fef2f2' : '#f0fdf4',
                      color: uploadFeedback.isError ? '#b91c1c' : '#15803d',
                      border: `1px solid ${uploadFeedback.isError ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    {uploadFeedback.message}
                  </div>
                )}

                <div>
                  <label htmlFor="upload-title" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Judul E-Book
                  </label>
                  <input
                    id="upload-title"
                    type="text"
                    required
                    placeholder="Contoh: Panduan Lengkap TypeScript 2026"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="upload-file" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Dokumen Master (Format PDF)
                  </label>
                  <input
                    id="upload-file"
                    type="file"
                    required
                    accept="application/pdf"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFile(e.target.files[0]);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 0',
                      fontSize: 13,
                      color: '#475569',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    style={{
                      height: 40,
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
                    type="submit"
                    disabled={isUploading}
                    style={{
                      height: 40,
                      padding: '0 20px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: isUploading ? '#94a3b8' : '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      cursor: isUploading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isUploading ? 'Mengunggah...' : 'Unggah Master'}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'grant' && (
              <form onSubmit={handleGrantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {grantFeedback && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 6,
                      fontSize: 13,
                      backgroundColor: grantFeedback.isError ? '#fef2f2' : '#f0fdf4',
                      color: grantFeedback.isError ? '#b91c1c' : '#15803d',
                      border: `1px solid ${grantFeedback.isError ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    {grantFeedback.message}
                  </div>
                )}

                <div>
                  <label htmlFor="grant-email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Email Pembeli / Penerima
                  </label>
                  <input
                    id="grant-email"
                    type="email"
                    required
                    placeholder="nama@domain.com"
                    value={grantEmail}
                    onChange={(e) => setGrantEmail(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="grant-name" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Nama Pembeli (Ditampilkan di Watermark Bawah)
                  </label>
                  <input
                    id="grant-name"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    value={grantName}
                    onChange={(e) => setGrantName(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="grant-ebook" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Pilih E-Book
                  </label>
                  <select
                    id="grant-ebook"
                    value={grantEbookId}
                    onChange={(e) => setGrantEbookId(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {ebooks.map((ebook) => (
                      <option key={ebook.id} value={ebook.id}>
                        {ebook.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="grant-amount" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                    Nominal Transaksi (Rp)
                  </label>
                  <input
                    id="grant-amount"
                    type="number"
                    min="0"
                    step="1000"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 12px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    style={{
                      height: 40,
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
                    type="submit"
                    disabled={isGranting}
                    style={{
                      height: 40,
                      padding: '0 20px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: isGranting ? '#94a3b8' : '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      cursor: isGranting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isGranting ? 'Memproses...' : 'Terbitkan Akses'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
