import assert from 'node:assert/strict';
import test from 'node:test';

import { extractLynkDetails } from './lynk';

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
});

test('extractLynkDetails menangani payload uji coba atau ping kosong', () => {
  const detailsEmpty = extractLynkDetails({});
  assert.equal(detailsEmpty.event, 'test_or_ping');
  assert.equal(detailsEmpty.refId, 'unknown');
  assert.equal(detailsEmpty.customerEmail, '');

  const detailsNull = extractLynkDetails(null);
  assert.equal(detailsNull.event, 'unknown');
});
