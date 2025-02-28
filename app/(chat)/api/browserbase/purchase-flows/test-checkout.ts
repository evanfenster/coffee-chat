import { Page } from 'playwright';
import { PurchaseResult } from './trade-coffee';

interface Address {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface PurchaseDetails {
  productHandle: string;
  cardDetails: {
    email: string;
    firstName: string;
    lastName: string;
    number: string;
    expiry: string;
    cvc: string;
    cardId: string;
    cardHolderId: string;
    address: Address;
    billingAddress?: Address;
  };
}

function addressesMatch(shipping: Address, billing: Address): boolean {
  return (
    shipping.line1.toLowerCase() === billing.line1.toLowerCase() &&
    shipping.city.toLowerCase() === billing.city.toLowerCase() &&
    shipping.state.toLowerCase() === billing.state.toLowerCase() &&
    shipping.postal_code === billing.postal_code &&
    shipping.country.toLowerCase() === billing.country.toLowerCase()
  );
}

export async function executeTestCheckoutPurchase(
  page: Page,
  purchaseDetails: PurchaseDetails
): Promise<PurchaseResult> {
  try {
    // Log all inputs for debugging without masking anything
    console.log('TEST MODE - Full Purchase Details:');
    console.log('------------------------------');
    console.log('Product Handle:', purchaseDetails.productHandle);
    console.log('------------------------------');
    console.log('Card Details:');
    console.log('Email:', purchaseDetails.cardDetails.email);
    console.log('Name:', `${purchaseDetails.cardDetails.firstName} ${purchaseDetails.cardDetails.lastName}`);
    console.log('Card Number:', purchaseDetails.cardDetails.number);
    console.log('Expiry:', purchaseDetails.cardDetails.expiry);
    console.log('CVC:', purchaseDetails.cardDetails.cvc);
    console.log('Card ID:', purchaseDetails.cardDetails.cardId);
    console.log('Card Holder ID:', purchaseDetails.cardDetails.cardHolderId);
    console.log('------------------------------');
    console.log('Shipping Address:');
    console.log(JSON.stringify(purchaseDetails.cardDetails.address, null, 2));
    console.log('------------------------------');
    
    if (purchaseDetails.cardDetails.billingAddress) {
      console.log('Billing Address:');
      console.log(JSON.stringify(purchaseDetails.cardDetails.billingAddress, null, 2));
      console.log('------------------------------');
      
      console.log('Addresses Match?', 
        addressesMatch(
          purchaseDetails.cardDetails.address, 
          purchaseDetails.cardDetails.billingAddress as Address
        ) ? 'YES' : 'NO'
      );
    } else {
      console.log('No Billing Address Provided');
    }
    console.log('------------------------------');

    // Return success without executing the actual checkout
    console.log('TEST MODE: Skipping actual checkout and returning success');
    return {
      success: true,
      orderDetails: {
        orderNumber: 'TEST-MODE-' + Date.now(),
        total: '$0.00'
      }
    };
  } catch (error) {
    console.error('Error in test mode:', error);
    return {
      success: false,
      error: 'Test mode error',
      details: error instanceof Error ? error.message : String(error)
    };
  }
} 