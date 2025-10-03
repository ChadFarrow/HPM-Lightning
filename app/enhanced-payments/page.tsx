import React from 'react';
import { EnhancedPaymentDemo } from '@/components/EnhancedPaymentDemo';

export default function EnhancedPaymentsPage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Enhanced Lightning Payments</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Experience the improved payment system that prioritizes Lightning addresses over keysend 
            for better user experience and broader wallet compatibility.
          </p>
        </div>
        
        <EnhancedPaymentDemo />
      </div>
    </div>
  );
}