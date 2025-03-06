'use server';

import { APP_CONFIG } from '@/config/app.config';

type ProductInfo = {
  handle: string;
  name: string;
  price: string;
};

export async function processOrderWithStoa(sessionId: string, product: ProductInfo) {
  try {
    const agentId = APP_CONFIG.stoa.api.agentId;
    const stoaOrderUrl = `${APP_CONFIG.stoa.api.baseUrl}/purchase-request/`;
    const userId = sessionId;
    
    const response = await fetch(stoaOrderUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STOA_API_KEY}`
      },
      body: JSON.stringify({
        userId,
        shippingAddress: {
          name: 'John Doe',
          address1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zip: '12345'
        },
        info: {
            script: 'trade-coffee',
            productHandle: product.handle,
            productName: product.name,
            price: product.price,
        }
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
        error: responseData.message || 'Failed to process order with Stoa',
        status: response.status
      };
    }
    
    return { 
      success: true, 
      data: responseData 
    };
  } catch (error) {
    console.error('Error processing order with Stoa:', error);
    return { 
      success: false, 
      error: 'Internal server error processing the order'
    };
  }
} 