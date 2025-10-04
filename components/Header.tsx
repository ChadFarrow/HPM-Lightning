import { Music, Mic } from 'lucide-react';
import Link from 'next/link';
import { ClientOnlyLightningWallet } from './ClientOnlyNWC';
import { isLightningEnabled } from '@/lib/feature-flags';

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
              <div className="flex items-center space-x-1">
                <Music className="h-6 w-6" />
                <Mic className="h-6 w-6" />
              </div>
            </Link>
          </div>

          <nav className="flex items-center space-x-6">
            {isLightningEnabled() && <ClientOnlyLightningWallet />}
          </nav>
        </div>
      </div>
    </header>
  );
} 