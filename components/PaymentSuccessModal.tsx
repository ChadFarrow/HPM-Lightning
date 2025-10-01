'use client';

import { X } from 'lucide-react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  successfulRecipients: string[];
  failedRecipients?: string[];
  totalAmount: number;
  successCount: number;
  totalCount: number;
}

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  title,
  successfulRecipients,
  failedRecipients,
  totalAmount,
  successCount,
  totalCount
}: PaymentSuccessModalProps) {
  if (!isOpen) return null;

  const isPartialSuccess = failedRecipients && failedRecipients.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-green-400">
            {isPartialSuccess ? '⚡ Partial Payment Success' : '⚡ Payment Successful!'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Summary */}
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{totalAmount} sats</div>
            <div className="text-gray-400">
              {isPartialSuccess 
                ? `${successCount}/${totalCount} recipients received payment`
                : `All ${totalCount} recipients received payment`
              }
            </div>
          </div>

          {/* Successful recipients */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
              ✅ Successful Payments
            </h3>
            <ul className="space-y-1">
              {successfulRecipients.map((recipient, index) => (
                <li key={index} className="text-green-300 text-sm">
                  • {recipient}
                </li>
              ))}
            </ul>
          </div>

          {/* Failed recipients (if any) */}
          {isPartialSuccess && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                ❌ Failed Payments
              </h3>
              <ul className="space-y-1">
                {failedRecipients!.map((recipient, index) => (
                  <li key={index} className="text-red-300 text-sm">
                    • {recipient}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Celebration message */}
          {!isPartialSuccess && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-center">
              <p className="text-blue-300 text-sm">
                🎉 All recipients successfully received their Lightning payments!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}