import crypto from 'node:crypto';

const TOKEN_BYTE_LENGTH = 32;
const DEFAULT_EXPIRY_HOURS = 48;

export function generateMagicToken(): string {
  return crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
}

export function calculateExpiryDate(hours = DEFAULT_EXPIRY_HOURS): string {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + hours);
  return expiry.toISOString();
}
