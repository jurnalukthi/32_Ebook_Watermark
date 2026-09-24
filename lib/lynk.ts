import crypto from 'node:crypto';

export interface LynkCustomer {
  email?: string;
  name?: string;
  phone?: string;
}

export interface LynkAddon {
  id?: string;
  name?: string;
  price?: number | string;
  [key: string]: unknown;
}

export interface LynkItem {
  addons?: LynkAddon[];
  price?: number | string;
  qty?: number;
  stock?: number;
  title?: string;
  uuid?: string;
  [key: string]: unknown;
}

export interface LynkTotals {
  affiliate?: number | string;
  convenienceFee?: number | string;
  discount?: number | string;
  grandTotal?: number | string;
  totalAddon?: number | string;
  totalItem?: number | string;
  totalPrice?: number | string;
  totalShipping?: number | string;
  [key: string]: unknown;
}

export interface LynkMessageData {
  createdAt?: string;
  customer?: LynkCustomer;
  items?: LynkItem[];
  refId?: string;
  shippingAddress?: string;
  shippingInfo?: string;
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

export interface ExtractedCustomer {
  email: string;
  name: string;
  phone: string;
}

export interface ExtractedItemAddon {
  id: string;
  name: string;
  price: string;
}

export interface ExtractedItem {
  uuid: string;
  title: string;
  qty: number;
  price: string;
  addons: ExtractedItemAddon[];
}

export interface ExtractedTotals {
  grandTotal: string;
  totalPrice: string;
  totalItem: number;
  totalShipping: string;
  totalAddon: string;
  discount: string;
  convenienceFee: string;
  affiliate: string;
}

export interface LynkTransactionDetails {
  event: string;
  refId: string;
  messageId: string;
  messageAction: string;
  messageCode: string;
  createdAt: string;
  customer: ExtractedCustomer;
  items: ExtractedItem[];
  totals: ExtractedTotals;
  shippingAddress: string;
  shippingInfo: string;
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

export function extractLynkDetails(payload: unknown): LynkTransactionDetails {
  if (typeof payload !== 'object' || payload === null) {
    return {
      event: 'unknown',
      refId: 'unknown',
      messageId: 'unknown',
      messageAction: '',
      messageCode: '',
      createdAt: '',
      customer: { email: '', name: '', phone: '' },
      items: [],
      totals: {
        grandTotal: '',
        totalPrice: '',
        totalItem: 0,
        totalShipping: '',
        totalAddon: '',
        discount: '',
        convenienceFee: '',
        affiliate: '',
      },
      shippingAddress: '',
      shippingInfo: '',
    };
  }

  const record = payload as Record<string, unknown>;
  const event = typeof record.event === 'string' ? record.event : 'test_or_ping';
  const data = typeof record.data === 'object' && record.data !== null ? (record.data as Record<string, unknown>) : {};
  const messageData = typeof data.message_data === 'object' && data.message_data !== null ? (data.message_data as Record<string, unknown>) : {};
  const customer = typeof messageData.customer === 'object' && messageData.customer !== null ? (messageData.customer as Record<string, unknown>) : {};
  const totals = typeof messageData.totals === 'object' && messageData.totals !== null ? (messageData.totals as Record<string, unknown>) : {};

  const customerRecord = typeof record.customer === 'object' && record.customer !== null ? (record.customer as Record<string, unknown>) : {};

  const email =
    typeof customer.email === 'string'
      ? customer.email
      : typeof customerRecord.email === 'string'
      ? customerRecord.email
      : typeof record.email === 'string'
      ? record.email
      : '';

  const name =
    typeof customer.name === 'string'
      ? customer.name
      : typeof customerRecord.name === 'string'
      ? customerRecord.name
      : typeof record.name === 'string'
      ? record.name
      : '';

  const phone =
    typeof customer.phone === 'string'
      ? customer.phone
      : typeof customerRecord.phone === 'string'
      ? customerRecord.phone
      : typeof record.phone === 'string'
      ? record.phone
      : '';

  const refId =
    typeof messageData.refId === 'string'
      ? messageData.refId
      : typeof record.refId === 'string'
      ? record.refId
      : 'unknown';

  const messageId =
    typeof data.message_id === 'string'
      ? data.message_id
      : typeof record.message_id === 'string'
      ? record.message_id
      : 'unknown';

  const messageAction = typeof data.message_action === 'string' ? data.message_action : '';
  const messageCode = typeof data.message_code === 'string' ? data.message_code : '';
  const createdAt = typeof messageData.createdAt === 'string' ? messageData.createdAt : '';
  const shippingAddress = typeof messageData.shippingAddress === 'string' ? messageData.shippingAddress : '';
  const shippingInfo = typeof messageData.shippingInfo === 'string' ? messageData.shippingInfo : '';

  const rawItems = Array.isArray(messageData.items) ? messageData.items : [];
  const items: ExtractedItem[] = rawItems.map((item) => {
    const itemObj = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {};
    const rawAddons = Array.isArray(itemObj.addons) ? itemObj.addons : [];
    const addons: ExtractedItemAddon[] = rawAddons.map((addon) => {
      const addonObj = typeof addon === 'object' && addon !== null ? (addon as Record<string, unknown>) : {};
      return {
        id: typeof addonObj.id === 'string' ? addonObj.id : '',
        name: typeof addonObj.name === 'string' ? addonObj.name : '',
        price: normalizeAmount(addonObj.price),
      };
    });

    return {
      uuid: typeof itemObj.uuid === 'string' ? itemObj.uuid : '',
      title: typeof itemObj.title === 'string' ? itemObj.title : '',
      qty: typeof itemObj.qty === 'number' ? itemObj.qty : 1,
      price: normalizeAmount(itemObj.price),
      addons,
    };
  });

  return {
    event,
    refId,
    messageId,
    messageAction,
    messageCode,
    createdAt,
    customer: {
      email,
      name,
      phone,
    },
    items,
    totals: {
      grandTotal: normalizeAmount(totals.grandTotal),
      totalPrice: normalizeAmount(totals.totalPrice),
      totalItem: typeof totals.totalItem === 'number' ? totals.totalItem : Number(totals.totalItem ?? items.length),
      totalShipping: normalizeAmount(totals.totalShipping),
      totalAddon: normalizeAmount(totals.totalAddon),
      discount: normalizeAmount(totals.discount),
      convenienceFee: normalizeAmount(totals.convenienceFee),
      affiliate: normalizeAmount(totals.affiliate),
    },
    shippingAddress,
    shippingInfo,
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
