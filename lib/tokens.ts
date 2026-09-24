import crypto from 'node:crypto';

export function generateMagicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function calculateExpiryDate(hours = 48): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
}
