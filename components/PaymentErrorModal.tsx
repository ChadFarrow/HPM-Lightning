'use client';

import { X } from 'lucide-react';

interface PaymentErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  failedRecipients?: string[];
  successfulRecipients?: string[];
  walletSuggestion?: string;
}

export default function PaymentErrorModal({
  isOpen,
  onClose,
  title,
  message,
  failedRecipients,
  successfulRecipients,
  walletSuggestion
}: PaymentErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-red-400">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Main message */}
          <p className="text-gray-300 leading-relaxed">
            {message}
          </p>

          {/* Failed recipients */}
          {failedRecipients && failedRecipients.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                ❌ Failed Recipients
              </h3>
              <ul className="space-y-1">
                {failedRecipients.map((recipient, index) => (
                  <li key={index} className="text-red-300 text-sm">
                    • {recipient.replace(' error', '')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Successful recipients */}
          {successfulRecipients && successfulRecipients.length > 0 && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                ✅ Successful Recipients
              </h3>
              <ul className="space-y-1">
                {successfulRecipients.map((recipient, index) => (
                  <li key={index} className="text-green-300 text-sm">
                    • {recipient}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Wallet suggestion */}
          {walletSuggestion && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
                💡 Suggestion
              </h3>
              <p className="text-blue-300 text-sm leading-relaxed">
                {walletSuggestion}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}