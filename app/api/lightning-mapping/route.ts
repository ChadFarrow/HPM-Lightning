import { NextResponse } from 'next/server';
import { 
  getLightningAddressFromCustomValue,
  getRecipientDetails,
  getMappingStatistics,
  isMappingAvailable 
} from '@/lib/lightning-mapping';

/**
 * API endpoint to get Lightning mapping information
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customValue = searchParams.get('customValue');
    const action = searchParams.get('action');

    // Check if mapping is available
    if (!isMappingAvailable()) {
      return NextResponse.json(
        { error: 'Lightning mapping data not available' },
        { status: 503 }
      );
    }

    // Get statistics
    if (action === 'stats') {
      const stats = getMappingStatistics();
      return NextResponse.json({ success: true, stats });
    }

    // Get mapping for specific custom value
    if (customValue) {
      const lightningAddress = getLightningAddressFromCustomValue(customValue);
      const details = getRecipientDetails(customValue);

      if (!lightningAddress) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Custom value not found in mapping',
            customValue 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        customValue,
        lightningAddress,
        details
      });
    }

    // Return general info
    const stats = getMappingStatistics();
    return NextResponse.json({
      success: true,
      message: 'Lightning mapping API',
      available: true,
      statistics: stats,
      endpoints: {
        mapping: '/api/lightning-mapping?customValue=YOUR_CUSTOM_VALUE',
        stats: '/api/lightning-mapping?action=stats'
      }
    });

  } catch (error) {
    console.error('Lightning mapping API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}