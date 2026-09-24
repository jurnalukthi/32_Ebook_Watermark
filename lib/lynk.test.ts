import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { extractLynkDetails, verifyLynkSignature } from './lynk';

const TEST_SECRET = 'YPRBCrnIE0CyBcl20YOZokKs78Dcr7yF';

test('extractLynkDetails mengekstrak data transaksi resmi Lynk', () => {
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

  const details = extractLynkDetails(payload);

  assert.equal(details.event, 'payment.received');
  assert.equal(details.refId, '13f8d23beeb2aacbbc01c94060cc88d7');
  assert.equal(details.customerEmail, 'buyer@example.com');
  assert.equal(details.messageId, 'API_CALL_1744270275143115_4624014');
  assert.equal(details.grandTotal, '72000');
});

test('verifyLynkSignature memverifikasi tanda tangan transaksi valid', () => {
  const refId = '13f8d23beeb2aacbbc01c94060cc88d7';
  const grandTotal = '72000';
  const messageId = 'API_CALL_1744270275143115_4624014';

  const signatureString = `${grandTotal}${refId}${messageId}${TEST_SECRET}`;
  const validSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

  const result = verifyLynkSignature(validSignature, { refId, grandTotal, messageId }, TEST_SECRET);
  assert.equal(result, true);
});

test('verifyLynkSignature menolak tanda tangan palsu', () => {
  const refId = '13f8d23beeb2aacbbc01c94060cc88d7';
  const grandTotal = '72000';
  const messageId = 'API_CALL_1744270275143115_4624014';

  const result = verifyLynkSignature('invalid_signature', { refId, grandTotal, messageId }, TEST_SECRET);
  assert.equal(result, false);
});
