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

export function isLynkPayload(payload: unknown): boolean {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.event !== 'string' || record.event.trim().length === 0) {
    return false;
  }

  if (typeof record.data !== 'object' || record.data === null) {
    return false;
  }

  const data = record.data as Record<string, unknown>;
  const hasMessageId = typeof data.message_id === 'string' && data.message_id.trim().length > 0;
  const hasMessageData = typeof data.message_data === 'object' && data.message_data !== null;

  return hasMessageId || hasMessageData;
}
