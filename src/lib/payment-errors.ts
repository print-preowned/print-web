/** Matches backend `app/payment/payout_eligibility.py`. */
export const SELLER_PAYMENTS_UNAVAILABLE = "This store cannot accept payments yet";

export function isSellerPaymentsUnavailableMessage(message: string): boolean {
  return message === SELLER_PAYMENTS_UNAVAILABLE;
}

export function paymentErrorMessage(message: string): string {
  if (isSellerPaymentsUnavailableMessage(message)) {
    return "This store is not ready to accept payments yet. Try again later or contact the seller.";
  }
  return message;
}
