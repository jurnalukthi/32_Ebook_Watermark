'use client';

import { ChangeEvent, DragEvent, FormEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface EbookOption {
  id: string;
  title: string;
}

interface AdminActionsProps {
  ebooks: EbookOption[];
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function AdminActions({ ebooks }: AdminActionsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeModal, setActiveModal] = useState<'upload' | 'grant' | null>(null);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const [grantEmail, setGrantEmail] = useState('');
  const [grantName, setGrantName] = useState('');
  const [grantEbookId, setGrantEbookId] = useState(ebooks[0]?.id || '');
  const [grantAmount, setGrantAmount] = useState('0');
  const [isGranting, setIsGranting] = useState(false);
  const [grantFeedback, setGrantFeedback] = useState<{ isError: boolean; message: string } | null>(null);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      const droppedFile = event.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf')) {
        setUploadFile(droppedFile);
        if (!uploadTitle) {
          const guessedTitle = droppedFile.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
          setUploadTitle(guessedTitle);
        }
      } else {
        setUploadFeedback({ isError: true, message: 'Format file harus berupa dokumen PDF.' });
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selected = event.target.files[0];
      setUploadFile(selected);
      if (!uploadTitle) {
        const guessedTitle = selected.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
        setUploadTitle(guessedTitle);
      }
    }
  };

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
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.08)',
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
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
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
                  {activeModal === 'upload' ? 'Unggah E-Book Master Baru' : 'Pemberian Akses E-Book Manual'}
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                  {activeModal === 'upload'
                    ? 'File master akan disimpan privat di Supabase Storage'
                    : 'Terbitkan token dan kirim link unduhan otomatis ke pembeli'}
                </p>
              </div>
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
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 150ms',
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {activeModal === 'upload' && (
              <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {uploadFeedback && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      backgroundColor: uploadFeedback.isError ? '#fef2f2' : '#f0fdf4',
                      color: uploadFeedback.isError ? '#b91c1c' : '#15803d',
                      border: `1px solid ${uploadFeedback.isError ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      {uploadFeedback.isError ? (
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
                    <span>{uploadFeedback.message}</span>
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
                    placeholder="Contoh: 250 Soal Tes Hakim Adhoc (e-book)"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
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
                    Dokumen Master (Format PDF)
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />

                  {!uploadFile ? (
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: '32px 20px',
                        border: `2px dashed ${isDragging ? '#0f172a' : '#cbd5e1'}`,
                        borderRadius: 12,
                        backgroundColor: isDragging ? '#f1f5f9' : '#f8fafc',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'border-color 150ms, background-color 150ms',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          margin: '0 auto 12px',
                          borderRadius: 10,
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                        Pilih file PDF atau seret ke sini
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                        Hanya format dokumen .pdf (maksimal 50 MB)
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        backgroundColor: '#f8fafc',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 8,
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#0f172a',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                            }}
                          >
                            {uploadFile.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            {formatFileSize(uploadFile.size)}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          style={{
                            padding: '6px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#334155',
                            backgroundColor: '#ffffff',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            cursor: 'pointer',
                          }}
                        >
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadFile(null)}
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
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
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
                    disabled={isUploading || !uploadFile}
                    style={{
                      height: 42,
                      padding: '0 22px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: isUploading || !uploadFile ? '#94a3b8' : '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      cursor: isUploading || !uploadFile ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {isUploading ? (
                      'Mengunggah...'
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Unggah Dokumen Master
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {activeModal === 'grant' && (
              <form onSubmit={handleGrantSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {grantFeedback && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 14px',
                      borderRadius: 8,
                      fontSize: 13,
                      backgroundColor: grantFeedback.isError ? '#fef2f2' : '#f0fdf4',
                      color: grantFeedback.isError ? '#b91c1c' : '#15803d',
                      border: `1px solid ${grantFeedback.isError ? '#fecaca' : '#bbf7d0'}`,
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      {grantFeedback.isError ? (
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
                    <span>{grantFeedback.message}</span>
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
                      height: 44,
                      padding: '0 14px',
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
                    placeholder="Contoh: Rajo Intan"
                    value={grantName}
                    onChange={(e) => setGrantName(e.target.value)}
                    style={{
                      width: '100%',
                      height: 44,
                      padding: '0 14px',
                      fontSize: 14,
                      border: '1px solid #cbd5e1',
                      borderRadius: 8,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                        height: 44,
                        padding: '0 12px',
                        fontSize: 13,
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
                        height: 44,
                        padding: '0 14px',
                        fontSize: 14,
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
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
                    disabled={isGranting}
                    style={{
                      height: 42,
                      padding: '0 22px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#ffffff',
                      backgroundColor: isGranting ? '#94a3b8' : '#0f172a',
                      border: 'none',
                      borderRadius: 8,
                      cursor: isGranting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isGranting ? 'Memproses...' : 'Terbitkan Akses & Kirim'}
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
