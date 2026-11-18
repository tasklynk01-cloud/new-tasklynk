export const MIN_WALLET_TOPUP_KES = 100;

export function isValidWalletTopup(amount: unknown): amount is number {
  return typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= MIN_WALLET_TOPUP_KES;
}