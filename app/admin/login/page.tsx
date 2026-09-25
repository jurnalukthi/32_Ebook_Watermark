'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ADMIN_EMAIL } from '@/lib/constants';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || undefined }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setErrorMessage(data.message || 'Gagal melakukan login.');
      } else if (data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      } else {
        setMessage(data.message || 'Tautan login telah dikirim ke email Anda.');
      }
    } catch {
      setErrorMessage('Terjadi kendala jaringan saat menghubungi server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        background: 'linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: '#ffffff',
          borderRadius: 14,
          padding: '36px 28px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
          border: '1px solid #e2e8f0',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: '0 auto 16px',
              backgroundColor: '#0f172a',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Portal Admin
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 6, lineHeight: 1.5 }}>
            Masuk untuk mengelola e-book, lisensi unduhan, dan pelacakan transaksi.
          </p>
        </div>

        {message && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              marginBottom: 20,
              borderRadius: 8,
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              color: '#15803d',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{message}</span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              marginBottom: 20,
              borderRadius: 8,
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 13,
              lineHeight: 1.4,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                marginBottom: 6,
              }}
            >
              Email Administrator
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                fontSize: 14,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Kata Sandi
              </label>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Opsional</span>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Ketik kata sandi akun..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                height: 44,
                padding: '0 14px',
                fontSize: 14,
                color: '#0f172a',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 150ms, box-shadow 150ms',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: '100%',
              height: 44,
              fontSize: 14,
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: isSubmitting ? '#94a3b8' : '#0f172a',
              border: 'none',
              borderRadius: 8,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 150ms',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {isSubmitting ? (
              'Memproses...'
            ) : password ? (
              'Masuk ke Panel'
            ) : (
              'Kirim Magic Link Masuk'
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
