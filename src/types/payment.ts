export interface PaymentInitiateResponse {
  pidx: string;
  payment_url: string;
  expires_at: number;
  expires_in: number;
  message: string;
}

export interface LookupResponse {
  pidx: string;
  status: string;
  transaction_id: string;
  amount: number;
  fee_amount: number;
  message: string;
}
