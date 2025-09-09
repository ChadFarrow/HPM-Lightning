'use client';

import { useState } from 'react';
import { AlertCircle, Settings, Zap, X, ExternalLink } from 'lucide-react';

interface AlbyTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

export function AlbyTroubleshootingModal({ isOpen, onClose, error }: AlbyTroubleshootingModalProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  if (!isOpen) return null;

  const isNWCRelayError = error.includes('no info event') && error.includes('kind 13194');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-semibold text-white">
              {isNWCRelayError ? 'NWC Relay Connection Issue' : 'Lightning Payment Error'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {isNWCRelayError ? (
            <>
              {/* NWC Error Explanation */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-400 mb-2">NWC Relay Error Detected</h3>
                    <p className="text-sm text-gray-300">
                      Your Alby extension is currently using NWC (Nostr Wallet Connect) mode, 
                      which requires connecting to Nostr relays. These relay connections are failing, 
                      causing the &ldquo;no info event (kind 13194)&rdquo; error.
                    </p>
                  </div>
                </div>
              </div>

              {/* Solution Steps */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  How to Fix This Issue
                </h3>

                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-400 mb-2">Option 1: Switch to Alby Account Mode (Recommended)</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                      <li>Click on your Alby extension icon in the browser toolbar</li>
                      <li>Click the settings gear icon (⚙️) in the top right</li>
                      <li>Look for connection settings or account type</li>
                      <li>Switch from &ldquo;Alby Hub&rdquo; or &ldquo;NWC&rdquo; to &ldquo;Alby Account&rdquo;</li>
                      <li>You may need to log in with your Alby account credentials</li>
                      <li>Refresh this page and try the payment again</li>
                    </ol>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-400 mb-2">Option 2: Connect Direct to Your Lightning Node</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                      <li>Open Alby extension settings</li>
                      <li>Choose &ldquo;Connect your own wallet&rdquo;</li>
                      <li>Connect directly to your LND, CLN, or Eclair node</li>
                      <li>This bypasses NWC and uses direct Lightning connections</li>
                      <li>Refresh this page and try again</li>
                    </ol>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-400 mb-2">Option 3: Use AlbyGo (Mobile Alternative)</h4>
                    <p className="text-sm text-gray-300 mb-2">
                      If you&apos;re on mobile or prefer a different approach, you can use AlbyGo:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                      <li>Download the AlbyGo app from your app store</li>
                      <li>Set up your Lightning wallet in the app</li>
                      <li>Use the &ldquo;Connect Alby Hub&rdquo; button instead</li>
                      <li>This provides one-tap connections without browser extension issues</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Quick Test */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Quick Connection Test</h4>
                <p className="text-sm text-gray-300 mb-3">
                  After making changes, test your connection:
                </p>
                <button
                  onClick={async () => {
                    try {
                      if ((window as any).webln) {
                        await (window as any).webln.enable();
                        const info = await (window as any).webln.getInfo();
                        alert(`✅ Connection successful! Node: ${info.node?.alias || 'Unknown'}`);
                      } else {
                        alert('❌ WebLN not detected. Please refresh the page after making changes.');
                      }
                    } catch (error) {
                      alert(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Test Connection
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Generic Error */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="font-semibold text-red-400 mb-2">Payment Error</h3>
                <p className="text-sm text-gray-300 font-mono bg-gray-800 p-2 rounded">
                  {error}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Troubleshooting Steps</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
                  <li>Make sure your Lightning wallet has sufficient balance</li>
                  <li>Check that your wallet is unlocked and connected</li>
                  <li>Verify the recipient address is valid</li>
                  <li>Try refreshing the page and reconnecting your wallet</li>
                  <li>If using Alby, make sure the extension is enabled and up to date</li>
                </ul>
              </div>
            </>
          )}

          {/* Error Details */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-semibold text-gray-400 mb-2">Technical Details</h4>
            <div className="relative">
              <pre className="text-xs text-gray-400 font-mono bg-gray-900 p-3 rounded overflow-x-auto">
                {error}
              </pre>
              <button
                onClick={() => copyToClipboard(error, 'error')}
                className="absolute top-2 right-2 px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs rounded transition-colors"
              >
                {copiedText === 'error' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Support Links */}
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-semibold text-gray-400 mb-3">Need More Help?</h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://guides.getalby.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Alby Guides
              </a>
              <a
                href="https://github.com/getAlby/lightning-browser-extension/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Report Issue
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}