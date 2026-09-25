'use client';

import { FormEvent, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('jurnalukthi@gmail.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const supabase = createBrowserSupabaseClient();
    const redirectUrl = `${window.location.origin}/auth/callback?next=/admin`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    } else {
      setMessage('Tautan login telah dikirim. Silakan periksa inbox email Anda.');
    }

    setIsSubmitting(false);
  };

  return (
    <main
      style={{
        width: '100%',
        maxWidth: 420,
        margin: '0 auto',
        padding: '32px 24px',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          margin: '0 0 8px 0',
          color: '#111827',
        }}
      >
        Admin Portal
      </h1>
      <p
        style={{
          fontSize: 14,
          color: '#6b7280',
          margin: '0 0 24px 0',
          lineHeight: 1.5,
        }}
      >
        Masukkan email admin untuk menerima tautan masuk satu kali (magic link).
      </p>

      {message && (
        <div
          style={{
            padding: '12px 14px',
            marginBottom: 20,
            borderRadius: 6,
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {message}
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            padding: '12px 14px',
            marginBottom: 20,
            borderRadius: 6,
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            fontSize: 14,
            lineHeight: 1.4,
          }}
        >
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: '#374151',
              marginBottom: 6,
            }}
          >
            Email Admin
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              border: '1px solid #d1d5db',
              borderRadius: 6,
              outline: 'none',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '11px',
            fontSize: 14,
            fontWeight: 600,
            color: '#ffffff',
            backgroundColor: isSubmitting ? '#9ca3af' : '#111827',
            border: 'none',
            borderRadius: 6,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
          }}
        >
          {isSubmitting ? 'Mengirim tautan...' : 'Kirim Magic Link'}
        </button>
      </form>
    </main>
  );
}
