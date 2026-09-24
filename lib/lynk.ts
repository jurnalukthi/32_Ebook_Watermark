import crypto from 'node:crypto';

function normalizeAmount(amount: unknown): string {
  if (typeof amount === 'number') {
    return String(amount);
  }

  if (typeof amount === 'string') {
    return amount.replace(/[^0-9.-]/g, '');
  }

  return '';
}

function extractSignaturePayload(payload: unknown): {
  refId: string;
  amount: string;
  messageId: string;
} | null {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const data = record.data as Record<string, unknown> | undefined;
  const messageData = data?.message_data as Record<string, unknown> | undefined;
  const paymentData = messageData ?? undefined;
  const totals = paymentData?.totals as Record<string, unknown> | undefined;
  const refId = typeof paymentData?.refId === 'string' ? paymentData.refId : '';
  const amount = normalizeAmount(totals?.grandTotal);
  const messageId = typeof data?.message_id === 'string' ? data.message_id : '';

  if (!refId || !amount || !messageId) {
    return null;
  }

  return {
    refId,
    amount,
    messageId,
  };
}

export function verifyLynkSignature(
  payload: unknown,
  signatureHeader: string | null,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) {
    return false;
  }

  const signaturePayload = extractSignaturePayload(payload);

  if (!signaturePayload) {
    return false;
  }

  const { refId, amount, messageId } = signaturePayload;
  const signatureString = `${amount}${refId}${messageId}${secretKey}`;
  const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

  if (expectedSignature.length !== signatureHeader.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signatureHeader.toLowerCase(), 'utf8')
  );
}
