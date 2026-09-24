import crypto from 'node:crypto';

const HASH_ALGORITHM = 'sha256';
const SIGNATURE_PREFIX = 'sha256=';

function buildExpectedSignature(rawBody: string, secret: string): string {
  const digest = crypto.createHmac(HASH_ALGORITHM, secret).update(rawBody).digest('hex');
  return `${SIGNATURE_PREFIX}${digest}`;
}

function hasValidLength(expectedSignature: string, actualSignature: string): boolean {
  return Buffer.byteLength(expectedSignature, 'utf8') === Buffer.byteLength(actualSignature, 'utf8');
}

export function verifyLynkSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return false;
  }

  const expectedSignature = buildExpectedSignature(rawBody, secret);

  if (!hasValidLength(expectedSignature, signatureHeader)) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signatureHeader, 'utf8')
  );
}
