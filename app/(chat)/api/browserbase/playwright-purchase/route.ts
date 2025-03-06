import { chromium } from 'playwright';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import BrowserbaseSDK from "@browserbasehq/sdk";
import { executeTradeCoffeePurchase } from '../purchase-flows/trade-coffee';
import { executeTestCheckoutPurchase } from '../purchase-flows/test-checkout';
import { executeTestStripeCheckout } from '../purchase-flows/test-stripe-checkout';

if (!process.env.BROWSERBASE_API_KEY) {
  throw new Error('BROWSERBASE_API_KEY is required');
}

if (!process.env.BROWSERBASE_PROJECT_ID) {
  throw new Error('BROWSERBASE_PROJECT_ID is required');
}

type PurchaseFlow = 'trade-coffee' | 'test-checkout' | 'test-stripe-checkout';

const purchaseFlows = {
  'trade-coffee': executeTradeCoffeePurchase,
  'test-checkout': executeTestCheckoutPurchase,
  'test-stripe-checkout': executeTestStripeCheckout,
};

export async function POST(request: NextRequest) {
  let browser;
  let cardDetails;
  
  try {
    console.log('Starting purchase request...');
    const session = await auth()
    if (!session?.user?.id) {
      console.error('Authentication failed: No user session');
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      )
    }

    console.log('Parsing request body...');
    const { productHandle, cardDetails: requestCardDetails, purchaseFlow = 'trade-coffee' } = await request.json()
    cardDetails = requestCardDetails;
    
    console.log('Validating request parameters...');
    if (!productHandle || !cardDetails) {
      console.error('Validation failed:', {
        hasProductHandle: !!productHandle,
        hasCardDetails: !!cardDetails
      });
      return NextResponse.json(
        { error: 'Product handle and card details are required' },
        { status: 400 }
      )
    }

    if (!Object.keys(purchaseFlows).includes(purchaseFlow)) {
      console.error('Invalid purchase flow:', purchaseFlow);
      return NextResponse.json(
        { error: `Invalid purchase flow. Must be one of: ${Object.keys(purchaseFlows).join(', ')}` },
        { status: 400 }
      )
    }

    // Validate card details
    console.log('Validating card details...');
    console.log('Card details received:', {
      hasNumber: !!cardDetails.number,
      hasExpiry: !!cardDetails.expiry,
      hasCvc: !!cardDetails.cvc,
      hasCardId: !!cardDetails.cardId,
      hasCardHolderId: !!cardDetails.cardHolderId,
      email: cardDetails.email,
      firstName: !!cardDetails.firstName,
      lastName: !!cardDetails.lastName
    });

    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.cardId) {
      console.error('Card details validation failed');
      return NextResponse.json(
        { error: 'Invalid card details provided', details: { 
          hasNumber: !!cardDetails.number,
          hasExpiry: !!cardDetails.expiry,
          hasCvc: !!cardDetails.cvc,
          hasCardId: !!cardDetails.cardId
        }},
        { status: 400 }
      )
    }

    // Fetch shipping address
    console.log('Fetching shipping address...');
    const shippingAddressResponse = await fetch(`${request.nextUrl.origin}/api/shipping-address`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      }
    });

    if (!shippingAddressResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch shipping address' },
        { status: 500 }
      );
    }

    const shippingAddress = await shippingAddressResponse.json();

    // Update card details with shipping address
    cardDetails = {
      ...cardDetails,
      email: cardDetails.email || session.user.email,
      address: {
        line1: shippingAddress.addressLine1,
        line2: shippingAddress.addressLine2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        postal_code: shippingAddress.postalCode,
        country: shippingAddress.country
      }
    };

    console.log(`Starting purchase automation for product: ${productHandle} using flow: ${purchaseFlow}`);

    // Initialize Browserbase
    console.log('Initializing Browserbase...');
    const bb = new BrowserbaseSDK({
      apiKey: process.env.BROWSERBASE_API_KEY,
    });

    // Create a new session
    console.log('Creating Browserbase session...');
    const bbSession = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });

    // Connect to the session
    console.log('Connecting to browser session...');
    browser = await chromium.connectOverCDP(bbSession.connectUrl);

    // Get default context and page
    console.log('Getting browser context and page...');
    const context = browser.contexts()[0];
    const page = context?.pages()[0];

    if (!page) {
      console.error('No default page available');
      throw new Error('No default page available');
    }

    console.log('Starting purchase flow execution...');
    const executePurchase = purchaseFlows[purchaseFlow as PurchaseFlow];
    const result = await executePurchase(page, {
      productHandle,
      cardDetails
    });

    if (!result.success) {
      console.error('Purchase execution failed:', result.error, result.details);
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
          details: result.details,
          cardId: cardDetails?.cardId
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderDetails: result.orderDetails,
      cardId: cardDetails?.cardId
    });

  } catch (error) {
    console.error('Error in request handling:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to complete automated purchase',
        details: error instanceof Error ? error.message : 'Unknown error',
        cardId: cardDetails?.cardId
      },
      { status: 500 }
    );
  } finally {
    // First close the browser
    if (browser) {
      try {
        console.log('Closing browser...');
        await browser.close();
      } catch (error) {
        console.log('Browser was already closed');
      }
    }
  }
} 