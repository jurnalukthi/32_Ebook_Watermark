import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyLynkSignature } from './lynk';

const TEST_SECRET = 'test-secret';

function createLynkSignature(payload: unknown, secret: string): string {
  const record = payload as Record<string, unknown>;
  const messageData = record.data as Record<string, unknown> | undefined;
  const paymentData = messageData?.message_data as Record<string, unknown> | undefined;
  const totals = paymentData?.totals as Record<string, unknown> | undefined;
  const amount = String(totals?.grandTotal ?? '0');
  const refId = String(paymentData?.refId ?? '');
  const messageId = String(messageData?.message_id ?? '');
  const signatureString = `${amount}${refId}${messageId}${secret}`;

  return crypto.createHash('sha256').update(signatureString).digest('hex');
}

test('valid signature is accepted', () => {
  const payload = {
    data: {
      message_id: 'msg_123',
      message_data: {
        refId: 'ref_456',
        totals: {
          grandTotal: 72000,
        },
      },
    },
  };

  const signature = createLynkSignature(payload, TEST_SECRET);

  assert.equal(verifyLynkSignature(payload, signature, TEST_SECRET), true);
});

test('invalid signature is rejected', () => {
  const payload = {
    data: {
      message_id: 'msg_123',
      message_data: {
        refId: 'ref_456',
        totals: {
          grandTotal: 72000,
        },
      },
    },
  };

  assert.equal(verifyLynkSignature(payload, 'invalid', TEST_SECRET), false);
});
