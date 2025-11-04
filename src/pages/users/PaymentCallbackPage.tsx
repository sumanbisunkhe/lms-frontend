import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { showToast } from '../../utils/toast';
import { paymentService } from '../../services/paymentService';

const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('');

  const pidx = searchParams.get('pidx');
  const paymentStatus = searchParams.get('status');
  const transactionId = searchParams.get('transaction_id') || searchParams.get('txnId');
  const amount = searchParams.get('amount');
  const purchaseOrderId = searchParams.get('purchase_order_id');

  useEffect(() => {
    const handleCallback = async () => {
      if (!pidx) {
        setStatus('error');
        setMessage('No payment identifier found');
        showToast.error('Invalid payment callback');
        return;
      }

      // Check if payment was completed based on URL params
      if (paymentStatus === 'Completed') {
        try {
          // Verify payment with backend
          const verificationResult = await paymentService.verifyPayment(pidx);
          
          if (verificationResult.success && verificationResult.data.status === 'Completed') {
            setStatus('success');
            const amountInRs = amount ? (parseInt(amount) / 100).toFixed(2) : '0';
            setMessage(`Payment of Rs. ${amountInRs} verified and completed successfully!`);
            showToast.success('Payment verified successfully!');
            
            // Redirect to borrows page after 3 seconds
            setTimeout(() => {
              navigate('/user/borrows', { replace: true });
            }, 3000);
          } else {
            throw new Error('Payment verification failed');
          }
        } catch (error) {
          setStatus('error');
          setMessage('Payment verification failed. Please contact support if amount was deducted.');
          showToast.error('Payment verification failed');
          
          setTimeout(() => {
            navigate('/user/borrows', { replace: true });
          }, 5000);
        }
      } else if (paymentStatus === 'User canceled' || paymentStatus === 'Canceled') {
        setStatus('error');
        setMessage('Payment was canceled. Please try again if you wish to pay the fine.');
        showToast.error('Payment canceled');
        
        setTimeout(() => {
          navigate('/user/borrows', { replace: true });
        }, 5000);
      } else if (paymentStatus === 'Expired') {
        setStatus('error');
        setMessage('Payment session expired. Please initiate a new payment.');
        showToast.error('Payment expired');
        
        setTimeout(() => {
          navigate('/user/borrows', { replace: true });
        }, 5000);
      } else {
        setStatus('error');
        setMessage(`Payment ${paymentStatus || 'failed'}. Please try again or contact support.`);
        showToast.error('Payment failed');
        
        setTimeout(() => {
          navigate('/user/borrows', { replace: true });
        }, 5000);
      }
    };

    handleCallback();
  }, [pidx, paymentStatus, amount, navigate]);

  const getStatusContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h2>
            <p className="text-gray-600">Please wait while we verify your payment...</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {transactionId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">Transaction Details</p>
                <p className="text-xs text-gray-600 font-mono">ID: {transactionId}</p>
                {purchaseOrderId && (
                  <p className="text-xs text-gray-600 mt-1">Borrow ID: #{purchaseOrderId}</p>
                )}
              </div>
            )}
            <p className="text-sm text-gray-500">Redirecting to your borrows page...</p>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment {paymentStatus === 'User canceled' ? 'Canceled' : 'Failed'}</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            {transactionId && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-600 font-mono">Reference: {transactionId}</p>
              </div>
            )}
            <button
              onClick={() => navigate('/user/borrows', { replace: true })}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Borrows
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border p-8 max-w-md w-full">
        {getStatusContent()}
      </div>
    </div>
  );
};

export default PaymentCallbackPage;
