import assert from 'node:assert/strict';
import test from 'node:test';

import { isLynkPayload } from './lynk';

test('isLynkPayload menerima struktur data Lynk dengan message_data', () => {
  const payload = {
    event: 'payment.received',
    data: {
      message_action: 'SUCCESS',
      message_code: '0',
      message_data: {
        createdAt: '2025-04-10T14:30:45',
        customer: {
          email: 'buyer@example.com',
          name: 'Budi Santoso',
          phone: '08123456789',
        },
        refId: '13f8d23beeb2aacbbc01c94060cc88d7',
        totals: {
          grandTotal: 72000,
        },
      },
      message_id: 'API_CALL_1744270275143115_4624014',
    },
  };

  assert.equal(isLynkPayload(payload), true);
});

test('isLynkPayload menerima event uji coba dengan message_id saja', () => {
  const payload = {
    event: 'test.ping',
    data: {
      message_id: 'TEST_MSG_001',
    },
  };

  assert.equal(isLynkPayload(payload), true);
});

test('isLynkPayload menolak struktur yang bukan dari Lynk', () => {
  assert.equal(isLynkPayload(null), false);
  assert.equal(isLynkPayload(undefined), false);
  assert.equal(isLynkPayload('string data'), false);
  assert.equal(isLynkPayload({}), false);
  assert.equal(isLynkPayload({ event: '' }), false);
  assert.equal(isLynkPayload({ event: 'payment.received' }), false);
  assert.equal(isLynkPayload({ event: 'payment.received', data: null }), false);
  assert.equal(isLynkPayload({ event: 'payment.received', data: {} }), false);
  assert.equal(isLynkPayload({ sender: 'unknown', amount: 10000 }), false);
});
