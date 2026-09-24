import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { extractLynkDetails, verifyLynkSignature } from './lynk';

const TEST_SECRET = 'YPRBCrnIE0CyBcl20YOZokKs78Dcr7yF';

test('extractLynkDetails menampung seluruh informasi transaksi Lynk secara lengkap', () => {
  const payload = {
    event: 'payment.received',
    data: {
      message_action: 'SUCCESS',
      message_code: '0',
      message_desc: 'Transaksi berhasil',
      message_id: 'API_CALL_1790264332223852_3415498',
      message_data: {
        createdAt: '2026-09-24T15:38:54',
        customer: {
          email: 'onestringlab@gmail.com',
          name: 'Rajo',
          phone: '081234567890',
        },
        items: [
          {
            uuid: '6ab5439c6929f30b89c1065a-1265-1436679169-1790264220754',
            title: '250 Soal Tes Hakim Adhoc (e-book)',
            qty: 1,
            price: 50000,
            addons: [
              {
                id: 'addon_01',
                name: 'Kunci Jawaban PDF',
                price: 15000,
              },
            ],
          },
        ],
        refId: '799c6ba43e3c314468c48d7227982b74',
        shippingAddress: 'Jakarta, Indonesia',
        shippingInfo: 'Email delivery',
        totals: {
          grandTotal: 65000,
          totalPrice: 50000,
          totalItem: 1,
          totalShipping: 0,
          totalAddon: 15000,
          discount: 0,
          convenienceFee: 0,
          affiliate: 0,
        },
      },
    },
  };

  const details = extractLynkDetails(payload);

  assert.equal(details.event, 'payment.received');
  assert.equal(details.refId, '799c6ba43e3c314468c48d7227982b74');
  assert.equal(details.messageId, 'API_CALL_1790264332223852_3415498');
  assert.equal(details.customer.email, 'onestringlab@gmail.com');
  assert.equal(details.customer.name, 'Rajo');
  assert.equal(details.customer.phone, '081234567890');
  assert.equal(details.items.length, 1);
  assert.equal(details.items[0].uuid, '6ab5439c6929f30b89c1065a-1265-1436679169-1790264220754');
  assert.equal(details.items[0].title, '250 Soal Tes Hakim Adhoc (e-book)');
  assert.equal(details.items[0].addons.length, 1);
  assert.equal(details.items[0].addons[0].name, 'Kunci Jawaban PDF');
  assert.equal(details.totals.grandTotal, '65000');
  assert.equal(details.shippingAddress, 'Jakarta, Indonesia');
});

test('verifyLynkSignature memverifikasi tanda tangan transaksi valid', () => {
  const refId = '799c6ba43e3c314468c48d7227982b74';
  const grandTotal = '65000';
  const messageId = 'API_CALL_1790264332223852_3415498';

  const signatureString = `${grandTotal}${refId}${messageId}${TEST_SECRET}`;
  const validSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

  const result = verifyLynkSignature(validSignature, { refId, grandTotal, messageId }, TEST_SECRET);
  assert.equal(result, true);
});

test('verifyLynkSignature menolak tanda tangan palsu', () => {
  const refId = '799c6ba43e3c314468c48d7227982b74';
  const grandTotal = '65000';
  const messageId = 'API_CALL_1790264332223852_3415498';

  const result = verifyLynkSignature('invalid_signature', { refId, grandTotal, messageId }, TEST_SECRET);
  assert.equal(result, false);
});
