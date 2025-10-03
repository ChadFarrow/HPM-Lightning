'use client';

import { useState } from 'react';
import { Zap, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { makeEnhancedLightningPayment, getPaymentMethodPreference } from '@/utils/enhanced-payment-utils';
import { useLightningAddress } from '@/hooks/useLightningMapping';

interface PaymentRecipient {
  address: string;
  split: number;
  name?: string;
  customValue?: string;
  type?: string;
  fixedAmount?: number;
}

interface EnhancedLightningPaymentProps {
  recipients?: PaymentRecipient[];
  fallbackRecipient?: string;
  recipientName?: string;
  defaultAmount?: number;
  description?: string;
  onSuccess?: (results: any) => void;
  onError?: (error: string) => void;
  className?: string;
  showRecipientInfo?: boolean;
}

export function EnhancedLightningPayment({
  recipients = [],
  fallbackRecipient,
  recipientName = 'Creator',
  defaultAmount = 1000,
  description = 'Support the creator',
  onSuccess,
  onError,
  className = '',
  showRecipientInfo = false
}: EnhancedLightningPaymentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentResults, setPaymentResults] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const presetAmounts = [100, 500, 1000, 5000, 10000];
  const finalAmount = customAmount ? parseInt(customAmount) : amount;
  
  // Determine effective recipients
  const effectiveRecipients = recipients.length > 0 ? recipients : [
    {
      address: fallbackRecipient || '',
      split: 100,
      name: recipientName,
      type: 'node'
    }
  ].filter(r => r.address);

  const handlePayment = async () => {
    if (finalAmount <= 0) {
      setPaymentStatus('error');
      setErrorMessage('Please enter a valid amount');
      return;
    }

    if (effectiveRecipients.length === 0) {
      setPaymentStatus('error');
      setErrorMessage('No payment recipients configured');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');
    setPaymentResults(null);

    try {
      const result = await makeEnhancedLightningPayment({
        amount: finalAmount,
        description: description + (message ? ` - ${message}` : ''),
        recipients: effectiveRecipients,
        fallbackRecipient: effectiveRecipients[0].address,
        boostMetadata: {
          title: description,
          message: message || description,
          senderName: 'Anonymous',
          appName: 'HPM Lightning'
        }
      });

      if (result.success) {
        setPaymentStatus('success');
        setPaymentResults(result);
        onSuccess?.(result);
        // Auto-close after success
        setTimeout(() => {
          setIsOpen(false);
          setPaymentStatus('idle');
        }, 3000);
      } else {
        setPaymentStatus('error');
        setErrorMessage(result.error || 'Payment failed');
        onError?.(result.error || 'Payment failed');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Payment failed';
      setPaymentStatus('error');
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setPaymentStatus('idle');
    setErrorMessage('');
    setPaymentResults(null);
    setMessage('');
    setCustomAmount('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors ${className}`}
      >
        <Zap size={20} />
        Support with Lightning
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Zap className="text-orange-500" size={24} />
            Lightning Payment
          </h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Recipient Info */}
          {showRecipientInfo && effectiveRecipients.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-2">Payment Recipients</h3>
              <div className="space-y-2">
                {effectiveRecipients.map((recipient, index) => {
                  const preference = getPaymentMethodPreference(recipient);
                  const recipientAmount = Math.floor((finalAmount * recipient.split) / 100);
                  
                  return (
                    <div key={index} className="text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">{recipient.name || 'Recipient'}</span>
                        <span>{recipientAmount} sats ({recipient.split}%)</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {preference.preferredMethod === 'lightning-address' ? (
                          <span className="text-green-600 dark:text-green-400">
                            ⚡ {preference.lightningAddress}
                          </span>
                        ) : (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            🔗 Keysend ({recipient.address.substring(0, 20)}...)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Amount Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount (sats)</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount('');
                  }}
                  className={`p-2 rounded border text-sm ${
                    amount === preset && !customAmount
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  {preset.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
              min="1"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium mb-2">Message (optional)</label>
            <input
              type="text"
              placeholder="Add a message with your payment"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
              maxLength={200}
            />
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePayment}
            disabled={paymentStatus === 'processing' || finalAmount <= 0}
            className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center gap-2 ${
              paymentStatus === 'processing' || finalAmount <= 0
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {paymentStatus === 'processing' ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Zap size={20} />
                Send {finalAmount.toLocaleString()} sats
              </>
            )}
          </button>

          {/* Status Messages */}
          {paymentStatus === 'success' && paymentResults && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md p-4">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                <CheckCircle size={20} />
                <span className="font-medium">Payment Successful!</span>
              </div>
              
              {paymentResults.paymentSummary && (
                <div className="text-sm text-green-600 dark:text-green-400 space-y-1">
                  <div>Lightning Addresses: {paymentResults.paymentSummary.lightningAddresses}</div>
                  <div>Keysend Payments: {paymentResults.paymentSummary.keysendPayments}</div>
                  <div>Total Recipients: {paymentResults.paymentSummary.recipients}</div>
                </div>
              )}

              {paymentResults.results && paymentResults.results.length > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  {paymentResults.results.length} successful payment{paymentResults.results.length > 1 ? 's' : ''}
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'error' && errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md p-4">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle size={20} />
                <span className="font-medium">Payment Failed</span>
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                {errorMessage}
              </div>
            </div>
          )}

          {/* Payment Method Info */}
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 rounded p-3">
            <div className="font-medium mb-1">Payment Method Priority:</div>
            <div>1. Lightning addresses (LNURL-pay)</div>
            <div>2. Keysend to node addresses</div>
            <div>3. Automatic fallback between methods</div>
          </div>
        </div>
      </div>
    </div>
  );
}