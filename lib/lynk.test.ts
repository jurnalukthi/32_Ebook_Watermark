import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

import { verifyLynkSignature } from './lynk';

const TEST_SECRET = 'test-secret';

function createLynkSignature(rawBody: string, secret: string): string {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return `sha256=${digest}`;
}

test('valid signature is accepted', () => {
  const rawBody = JSON.stringify({ event: 'payment.success', txid: '123' });
  const signature = createLynkSignature(rawBody, TEST_SECRET);

  assert.equal(verifyLynkSignature(rawBody, signature, TEST_SECRET), true);
});

test('invalid signature is rejected', () => {
  const rawBody = JSON.stringify({ event: 'payment.success', txid: '123' });
  const signature = 'sha256=invalid';

  assert.equal(verifyLynkSignature(rawBody, signature, TEST_SECRET), false);
});
