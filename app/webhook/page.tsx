"use client";

import { useState } from 'react';

const defaultUrl = 'https://32-ebook-watermark.vercel.app/api/webhook/lynk';

type HistoryItem = {
  id: string;
  date: string;
  urlTarget: string;
  eventName: string;
  trxId: string;
  status: 'success' | 'failed' | 'pending';
  customerEmail?: string;
};

const initialHistory: HistoryItem[] = [];

export default function WebhookPage() {
  const [url, setUrl] = useState(defaultUrl);
  const [history, setHistory] = useState<HistoryItem[]>(initialHistory);

  const handleSave = () => {
    setUrl(url.trim() || defaultUrl);
  };

  const handleTest = async () => {
    const payload = {
      event: 'payment.received',
      data: {
        message_id: 'msg_123',
        message_data: {
          refId: 'ref_001',
          customer: {
            email: 'alice@example.com',
          },
          totals: {
            grandTotal: '250000',
          },
        },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    const newRecord: HistoryItem = {
      id: `${Date.now()}`,
      date: new Date().toISOString(),
      urlTarget: url,
      eventName: data.event ?? 'payment.received',
      trxId: data.refId ?? 'ref_001',
      status: res.ok ? 'success' : 'failed',
      customerEmail: 'alice@example.com',
    };

    setHistory((prev) => [newRecord, ...prev]);
  };

  return (
    <main style={{ minHeight: '100vh', background: '#dfeae3', padding: '32px 24px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div
          style={{
            background: '#dfeae3',
            borderRadius: 16,
            padding: '8px 0 4px',
            marginBottom: 18,
          }}
        >
          <h1 style={{ fontSize: 52, margin: 0, fontWeight: 800, letterSpacing: -1.5 }}>Webhook</h1>
        </div>

        <section style={{ background: '#eef5f1', borderRadius: 18, padding: 20, border: '1px solid #bfd6c9' }}>
          <h2 style={{ fontSize: 28, margin: '0 0 20px' }}>URL Webhook</h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 420, display: 'flex', alignItems: 'center', border: '2px solid #57c7a8', borderRadius: 12, background: '#f4f9f6', paddingRight: 10 }}>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{
                  width: '100%',
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  padding: '18px 14px',
                  fontSize: 18,
                  color: '#243a36',
                }}
              />
              <button
                type="button"
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 26,
                  color: '#345',
                }}
                aria-label="Clear URL"
              >
                ×
              </button>
            </div>

            <button
              type="button"
              onClick={handleSave}
              style={{
                background: '#2dcc8d',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '18px 28px',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              Save URL
            </button>

            <button
              type="button"
              onClick={handleTest}
              style={{
                background: '#f3f7f5',
                color: '#1f2b2a',
                border: '1px solid #7b8d88',
                borderRadius: 12,
                padding: '18px 28px',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              Test URL
            </button>
          </div>

          <div style={{ marginTop: 26, background: '#e5f3eb', borderRadius: 12, padding: '18px 16px', border: '1px solid #b7d9c8' }}>
            <a href="https://documenter.getpostman.com/view/3211564/2sB2cVf2Kp" target="_blank" rel="noreferrer" style={{ color: '#1f2b2a', textDecoration: 'none', fontWeight: 700, fontSize: 15 }}>
              See Webhook Documentation ↗
            </a>
          </div>
        </section>

        <section style={{ marginTop: 28, background: '#eef5f1', borderRadius: 18, padding: 20, border: '1px solid #bfd6c9' }}>
          <h2 style={{ fontSize: 32, margin: '0 0 20px' }}>Webhook History</h2>

          <div style={{ display: 'flex', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', display: 'flex', alignItems: 'center', border: '1px solid #a6b7b2', borderRadius: 10, background: '#f7faf8', padding: '14px 14px' }}>
              <span style={{ marginRight: 10 }}>📅</span>
              <span style={{ color: '#666' }}>Select date range</span>
            </div>
            <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', border: '1px solid #a6b7b2', borderRadius: 10, background: '#f7faf8', padding: '14px 14px' }}>
              <span style={{ color: '#666' }}>All Status</span>
            </div>
            <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', border: '1px solid #a6b7b2', borderRadius: 10, background: '#f7faf8', padding: '14px 14px' }}>
              <span style={{ color: '#666' }}>URL Target</span>
            </div>
            <div style={{ flex: '1 1 180px', display: 'flex', alignItems: 'center', border: '1px solid #a6b7b2', borderRadius: 10, background: '#f7faf8', padding: '14px 14px' }}>
              <span style={{ color: '#666' }}>Search</span>
            </div>
            <button
              type="button"
              style={{
                background: '#2dcc8d',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '14px 24px',
                fontWeight: 700,
                fontSize: 18,
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </div>

          <div style={{ overflow: 'hidden', borderRadius: 12, border: '1px solid #bfccc3', background: '#f5faf7' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#edf5f0' }}>
                  <th style={{ textAlign: 'left', padding: '16px 12px', color: '#273432', fontWeight: 700 }}>DATE & TIME</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', color: '#273432', fontWeight: 700 }}>URL TARGET</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', color: '#273432', fontWeight: 700 }}>EVENT NAME</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', color: '#273432', fontWeight: 700 }}>TRX ID</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', color: '#273432', fontWeight: 700 }}>STATUS</th>
                  <th style={{ textAlign: 'left', padding: '16px 12px', color: '#273432', fontWeight: 700 }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '28px 12px', color: '#5f716d', fontSize: 18 }}>
                      No webhook history found.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} style={{ borderTop: '1px solid #d6e2db' }}>
                      <td style={{ padding: '14px 12px' }}>{new Date(item.date).toLocaleString()}</td>
                      <td style={{ padding: '14px 12px' }}>{item.urlTarget}</td>
                      <td style={{ padding: '14px 12px' }}>{item.eventName}</td>
                      <td style={{ padding: '14px 12px' }}>{item.trxId}</td>
                      <td style={{ padding: '14px 12px' }}>{item.status}</td>
                      <td style={{ padding: '14px 12px' }}>View</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer style={{ marginTop: 28, textAlign: 'center', fontSize: 15, color: '#2a3735' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Terms & Conditions</span>
            <span>•</span>
            <span>Privacy</span>
            <span>•</span>
            <span>Contact Us</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
