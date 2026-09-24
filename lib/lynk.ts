import crypto from 'node:crypto';

export interface LynkCustomer {
  email?: string;
  name?: string;
  phone?: string;
}

export interface LynkTotals {
  affiliate?: number;
  convenienceFee?: number;
  discount?: number;
  grandTotal?: number | string;
  totalAddon?: number;
  totalItem?: number;
  totalPrice?: number;
  totalShipping?: number;
  [key: string]: unknown;
}

export interface LynkMessageData {
  createdAt?: string;
  customer?: LynkCustomer;
  items?: unknown[];
  refId?: string;
  totals?: LynkTotals;
  [key: string]: unknown;
}

export interface LynkWebhookData {
  message_action?: string;
  message_code?: string;
  message_desc?: string;
  message_id?: string;
  message_title?: string;
  message_data?: LynkMessageData;
  [key: string]: unknown;
}

export interface LynkWebhookPayload {
  event?: string;
  data?: LynkWebhookData;
  [key: string]: unknown;
}

function normalizeAmount(amount: unknown): string {
  if (typeof amount === 'number') {
    return String(amount);
  }

  if (typeof amount === 'string') {
    return amount.replace(/[^0-9.-]/g, '');
  }

  return '';
}

export function extractLynkDetails(payload: unknown): {
  event: string;
  refId: string;
  customerEmail: string;
  messageId: string;
  grandTotal: string;
} {
  if (typeof payload !== 'object' || payload === null) {
    return {
      event: 'unknown',
      refId: 'unknown',
      customerEmail: '',
      messageId: 'unknown',
      grandTotal: '',
    };
  }

  const record = payload as Record<string, unknown>;
  const event = typeof record.event === 'string' ? record.event : 'test_or_ping';
  const data = typeof record.data === 'object' && record.data !== null ? (record.data as Record<string, unknown>) : {};
  const messageData = typeof data.message_data === 'object' && data.message_data !== null ? (data.message_data as Record<string, unknown>) : {};
  const totals = typeof messageData.totals === 'object' && messageData.totals !== null ? (messageData.totals as Record<string, unknown>) : {};
  const customer = typeof messageData.customer === 'object' && messageData.customer !== null ? (messageData.customer as Record<string, unknown>) : {};

  const refId = typeof messageData.refId === 'string' ? messageData.refId : typeof record.refId === 'string' ? record.refId : 'unknown';
  const customerEmail = typeof customer.email === 'string' ? customer.email : typeof record.email === 'string' ? record.email : '';
  const messageId = typeof data.message_id === 'string' ? data.message_id : typeof record.message_id === 'string' ? record.message_id : 'unknown';
  const grandTotal = normalizeAmount(totals.grandTotal);

  return {
    event,
    refId,
    customerEmail,
    messageId,
    grandTotal,
  };
}

export function verifyLynkSignature(
  signatureHeader: string | null | undefined,
  details: { refId: string; grandTotal: string; messageId: string },
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) {
    return false;
  }

  const { refId, grandTotal, messageId } = details;

  if (!refId || !grandTotal || !messageId) {
    return false;
  }

  const signatureString = `${grandTotal}${refId}${messageId}${secretKey}`;
  const expectedSignature = crypto.createHash('sha256').update(signatureString).digest('hex');

  if (expectedSignature.length !== signatureHeader.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signatureHeader.toLowerCase(), 'utf8')
  );
}
