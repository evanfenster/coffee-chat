import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { calculateFinalPrice } from '@/lib/utils/pricing';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      );
    }

    // Get the cookies from the request to pass to internal API calls
    const cookies = request.headers.get('cookie') || '';

    const { sessionId, product } = await request.json();
    
    if (!sessionId || !product) {
      return NextResponse.json(
        { error: 'Session ID and product details are required' },
        { status: 400 }
      );
    }

    let cardDetails;
    let order;

    try {
      // Step 1: Create cardholder
      console.log('Creating cardholder...');
      const cardholderResponse = await fetch(`${request.nextUrl.origin}/api/stripe/create-cardholder`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });
      
      if (!cardholderResponse.ok) {
        console.error('Cardholder creation failed with status:', cardholderResponse.status);
        const errorText = await cardholderResponse.text();
        console.error('Cardholder error response:', errorText);
        throw new Error('Failed to create cardholder');
      }

      // Step 2: Create virtual card
      console.log('Creating virtual card...');
      const cardResponse = await fetch(`${request.nextUrl.origin}/api/stripe/create-virtual-card`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        credentials: 'include',
        body: JSON.stringify({ sessionId }),
      });
      
      if (!cardResponse.ok) {
        console.error('Virtual card creation failed with status:', cardResponse.status);
        const errorText = await cardResponse.text();
        console.error('Virtual card error response:', errorText);
        throw new Error('Failed to create virtual card');
      }
      
      const cardData = await cardResponse.json();
      cardDetails = cardData.cardDetails;
      console.log('Card details received:', { cardId: cardDetails?.cardId });

      // Step 3: Create order
      console.log('Creating order...');
      const orderResponse = await fetch(`${request.nextUrl.origin}/api/orders`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        credentials: 'include',
        body: JSON.stringify({
          productHandle: product.handle,
          productName: product.name,
          price: calculateFinalPrice(parseFloat(product.price)).toString(),
          stripeSessionId: sessionId,
          cardHolderId: cardDetails.cardHolderId,
          cardId: cardDetails.cardId,
        }),
      });
      
      if (!orderResponse.ok) {
        console.error('Order creation failed with status:', orderResponse.status);
        const errorText = await orderResponse.text();
        console.error('Order error response:', errorText);
        throw new Error('Failed to create order');
      }
      
      order = await orderResponse.json();

      // Step 4: Get shipping address
      console.log('Fetching shipping address...');
      const addressResponse = await fetch(`${request.nextUrl.origin}/api/shipping-address`, {
        headers: {
          'Cookie': cookies
        },
        credentials: 'include'
      });
      
      if (!addressResponse.ok) {
        console.error('Shipping address fetch failed with status:', addressResponse.status);
        const errorText = await addressResponse.text();
        console.error('Shipping address error response:', errorText);
        throw new Error('Failed to fetch shipping address');
      }
      
      const shippingAddress = await addressResponse.json();

      // Step 5: Execute automated purchase
      console.log('Starting automated purchase...');
      const purchaseResponse = await fetch(`${request.nextUrl.origin}/api/browserbase/playwright-purchase`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        credentials: 'include',
        body: JSON.stringify({
          productHandle: product.handle,
          cardDetails: {
            ...cardDetails,
            address: {
              line1: shippingAddress.addressLine1,
              line2: shippingAddress.addressLine2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.postalCode,
              country: shippingAddress.country
            }
          }
        })
      });

      // Check purchase success
      if (!purchaseResponse.ok) {
        console.error('Purchase failed with status:', purchaseResponse.status);
        let purchaseData;
        try {
          purchaseData = await purchaseResponse.json();
          console.error('Purchase error data:', purchaseData);
        } catch (jsonError) {
          const errorText = await purchaseResponse.text();
          console.error('Purchase error response (not JSON):', errorText);
        }
        
        // Try to deactivate the card even if purchase failed
        if (cardDetails?.cardId) {
          try {
            console.log('Deactivating card after purchase failure:', cardDetails.cardId);
            const deactivateResponse = await fetch(`${request.nextUrl.origin}/api/stripe/deactivate-card`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Cookie': cookies
              },
              credentials: 'include',
              body: JSON.stringify({ cardId: cardDetails.cardId }),
            });
            
            if (!deactivateResponse.ok) {
              console.error('Failed to deactivate card after purchase failure');
            } else {
              console.log('Successfully deactivated card after purchase failure');
            }
          } catch (deactivateError) {
            console.error('Error deactivating card after purchase failure:', deactivateError);
          }
        }
        
        throw new Error(purchaseData?.error || 'Failed to complete automated purchase');
      }

      // Update order status to completed
      await fetch(`${request.nextUrl.origin}/api/orders`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: order.id,
          status: 'completed',
        }),
      });

      return NextResponse.json({ 
        success: true,
        cardId: cardDetails.cardId 
      });

    } catch (error) {
      console.error('Error in order processing:', error);

      // Update order status if we got that far
      if (order?.id) {
        await fetch(`${request.nextUrl.origin}/api/orders`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          credentials: 'include',
          body: JSON.stringify({
            orderId: order.id,
            status: 'failed',
            errorDetails: error instanceof Error ? error.message : 'Unknown error',
          }),
        });
      }

      // Always try to refund on error
      try {
        const refundResponse = await fetch(`${request.nextUrl.origin}/api/stripe/refund`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Cookie': cookies
          },
          credentials: 'include',
          body: JSON.stringify({ sessionId }),
        });

        if (refundResponse.ok && order?.id) {
          await fetch(`${request.nextUrl.origin}/api/orders`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Cookie': cookies
            },
            credentials: 'include',
            body: JSON.stringify({
              orderId: order.id,
              status: 'refunded',
            }),
          });
        }
      } catch (refundError) {
        console.error('Failed to process refund:', refundError);
      }

      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
          cardId: cardDetails?.cardId
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Critical error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 