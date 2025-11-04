import type { PaymentInitiateResponse, LookupResponse } from '../types/payment';

const API_BASE_URL = 'http://localhost:8080/api';

interface PaymentApiResponse<T> {
  data: T;
  message: string;
  status: number;
  success: boolean;
}

export const paymentService = {
  initiatePayment: async (borrowId: number): Promise<PaymentApiResponse<PaymentInitiateResponse>> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/payments/initiate?borrowId=${borrowId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  verifyPayment: async (pidx: string): Promise<PaymentApiResponse<LookupResponse>> => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/payments/verify?pidx=${pidx}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
