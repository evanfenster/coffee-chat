'use server';

import { APP_CONFIG } from '@/config/app.config';
import { getStoaUserId } from '@/lib/db/queries';

type ProductInfo = {
  handle: string;
  name: string;
  price: string;
};

export async function processOrderWithStoa(
  userId: string, 
  product: ProductInfo, 
  sessionId: string,
  webhookUrl?: string
) {
  try {

    const stoaUserId = await getStoaUserId(userId);

    const stoaOrderUrl = `${APP_CONFIG.stoa.api.baseUrl}/purchase-requests/`;
    
    const response = await fetch(stoaOrderUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STOA_API_KEY}`
      },
      body: JSON.stringify({
        userId: stoaUserId,
        info: {
            script: 'trade-coffee',
            productHandle: product.handle,
            productName: product.name,
            price: product.price,
        },
        sessionId: sessionId,
        webhookUrl: webhookUrl,
      }),
    });
    
    // Parse the response
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text };
    }
    
    // Return the result
    if (!response.ok) {
      return { 
        success: false, 
        error: responseData.error || responseData.message || 'Failed to process order with Stoa',
        status: response.status
      };
    }
    
    return { 
      success: true, 
      purchaseRequest: responseData.purchaseRequest || responseData,
      message: responseData.message || 'Purchase request created successfully'
    };
  } catch (error) {
    console.error('Error processing order with Stoa:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error processing the order'
    };
  }
} 