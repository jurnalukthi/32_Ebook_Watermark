export type WebhookHistoryRecord = {
  id: string;
  date: string;
  urlTarget: string;
  eventName: string;
  trxId: string;
  status: 'success' | 'failed' | 'pending';
  customerEmail?: string;
  payload: Record<string, unknown>;
};

let configuredWebhookUrl = 'https://32-ebook-watermark.vercel.app/api/webhook/lynk';
const history: WebhookHistoryRecord[] = [];

export function getConfiguredWebhookUrl(): string {
  return configuredWebhookUrl;
}

export function setConfiguredWebhookUrl(url: string): string {
  const nextUrl = url.trim();
  configuredWebhookUrl = nextUrl || configuredWebhookUrl;
  return configuredWebhookUrl;
}

export function addWebhookHistoryRecord(record: Omit<WebhookHistoryRecord, 'id' | 'date'>): WebhookHistoryRecord {
  const newRecord: WebhookHistoryRecord = {
    ...record,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: new Date().toISOString(),
  };

  history.unshift(newRecord);
  return newRecord;
}

export function listWebhookHistory(): WebhookHistoryRecord[] {
  return [...history].slice(0, 50);
}
