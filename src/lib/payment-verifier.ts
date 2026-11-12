/**
 * Server-side Payment Verification & Webhook Store
 * Supports:
 * 1. SePay.vn (Webhook + User API Polling)
 * 2. Casso.vn (Webhook + OAuth v2 API Polling)
 * 3. Custom Notification Forwarder / MacroDroid / SMS Forwarder Webhooks
 */

export interface VerifiedBankTransaction {
  id: string;
  gateway: string;
  accountNumber: string;
  amount: number;
  content: string;
  referenceCode: string;
  transactionDate: string;
  source: 'sepay_webhook' | 'casso_webhook' | 'sepay_api' | 'casso_api' | 'custom_webhook' | 'simulated';
  receivedAt: string;
}

declare global {
  var __eventmate_bank_transactions: VerifiedBankTransaction[] | undefined;
}

function getTransactionStore(): VerifiedBankTransaction[] {
  if (!globalThis.__eventmate_bank_transactions) {
    globalThis.__eventmate_bank_transactions = [];
  }
  return globalThis.__eventmate_bank_transactions;
}

/**
 * Normalizes transfer description/content so "EM 8899", "em-8899", "MBVCB.123.EM8899.CT"
 * all reliably match code "EM8899".
 */
export function normalizeTransferText(input: string | null | undefined): string {
  if (!input) return '';
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Records a verified incoming bank transaction into the server store (keeps last 200 items).
 */
export function recordIncomingTransaction(tx: VerifiedBankTransaction): VerifiedBankTransaction {
  const store = getTransactionStore();
  const exists = store.some(
    (item) =>
      item.id === tx.id ||
      (item.referenceCode &&
        tx.referenceCode &&
        item.referenceCode === tx.referenceCode &&
        item.amount === tx.amount)
  );
  if (!exists) {
    store.unshift(tx);
    if (store.length > 200) {
      store.length = 200;
    }
  }
  return tx;
}

export function listRecentTransactions(limit = 30): VerifiedBankTransaction[] {
  return getTransactionStore().slice(0, limit);
}

/**
 * Checks if a transaction matching `transferCode` (e.g. "HKTS-8899" or "EM8899") and `expectedAmount`
 * has already been received via Webhook or previous poll.
 */
export function findMatchingTransactionInStore(
  transferCode: string,
  expectedAmount: number
): VerifiedBankTransaction | null {
  const normalizedCode = normalizeTransferText(transferCode);
  if (!normalizedCode) return null;

  // Extract raw digits suffix if code has form HKTS-8899 or EM8899
  const rawDigitsSuffix = transferCode.replace(/^[^0-9]*/, '');

  const store = getTransactionStore();
  for (const tx of store) {
    const normalizedContent = normalizeTransferText(tx.content);
    const matchesCode =
      normalizedContent.includes(normalizedCode) ||
      (rawDigitsSuffix.length >= 4 && normalizedContent.includes(rawDigitsSuffix));
    if (matchesCode && tx.amount >= expectedAmount) {
      return tx;
    }
  }
  return null;
}
