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

interface StripeCheckoutDetails {
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
  stripeDetails?: {
    apiKey?: string;
    paymentIntentId?: string;
    customerId?: string;
    checkoutUrl?: string;
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

export async function executeTestStripeCheckout(
  page: Page,
  checkoutDetails: StripeCheckoutDetails
): Promise<PurchaseResult> {
  try {
    // Log all inputs for debugging without masking anything
    console.log('TEST STRIPE MODE - Full Checkout Details:');
    console.log('------------------------------');
    console.log('Product Handle:', checkoutDetails.productHandle);
    console.log('------------------------------');
    console.log('Card Details:');
    console.log('Email:', checkoutDetails.cardDetails.email);
    console.log('Name:', `${checkoutDetails.cardDetails.firstName} ${checkoutDetails.cardDetails.lastName}`);
    console.log('Card Number:', checkoutDetails.cardDetails.number);
    console.log('Expiry:', checkoutDetails.cardDetails.expiry);
    console.log('CVC:', checkoutDetails.cardDetails.cvc);
    console.log('Card ID:', checkoutDetails.cardDetails.cardId);
    console.log('Card Holder ID:', checkoutDetails.cardDetails.cardHolderId);
    console.log('------------------------------');
    console.log('Shipping Address:');
    console.log(JSON.stringify(checkoutDetails.cardDetails.address, null, 2));
    console.log('------------------------------');
    
    console.log('Billing Address:');
    // If billingAddress is provided, use it; otherwise, use the shipping address
    const billingAddress = checkoutDetails.cardDetails.billingAddress || checkoutDetails.cardDetails.address;
    console.log(JSON.stringify(billingAddress, null, 2));
    console.log('------------------------------');
    
    console.log('Addresses Match?', 
      addressesMatch(
        checkoutDetails.cardDetails.address, 
        billingAddress
      ) ? 'YES' : 'NO'
    );
    console.log('------------------------------');

    // Log Stripe-specific details if provided
    if (checkoutDetails.stripeDetails) {
      console.log('Stripe Details:');
      console.log('API Key:', checkoutDetails.stripeDetails.apiKey || 'Not provided');
      console.log('Payment Intent ID:', checkoutDetails.stripeDetails.paymentIntentId || 'Not provided');
      console.log('Customer ID:', checkoutDetails.stripeDetails.customerId || 'Not provided');
      console.log('Checkout URL:', checkoutDetails.stripeDetails.checkoutUrl || 'Not provided');
      console.log('------------------------------');
    }

    // Execute the actual Stripe checkout process
    console.log('Starting Stripe checkout process...');
    
    // Navigate to the Stripe checkout page
    const checkoutUrl = checkoutDetails.stripeDetails?.checkoutUrl || 'https://buy.stripe.com/test_dR6fZ22te3qA8cU3cc';
    await page.goto(checkoutUrl);
    
    // Fill in email
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(checkoutDetails.cardDetails.email);
    
    // Continue to next step - try to click the button, but don't fail if it doesn't exist
    try {
      // Wait for the continue button to appear
      await page.waitForTimeout(2000);
      console.log('Trying to click continue button...');
      await page.getByRole('button').filter({ hasText: /^$/ }).first().click();
      console.log('Continue button clicked successfully');
    } catch (e) {
      console.log('No continue button found or multiple buttons matched, continuing...');
    }
    
    // Fill in shipping name
    await page.getByRole('textbox', { name: 'Name' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(
      `${checkoutDetails.cardDetails.firstName} ${checkoutDetails.cardDetails.lastName}`
    );
    
    // Enter shipping address manually
    await page.getByRole('button', { name: 'Enter address manually' }).click();
    
    // Fill in shipping address details
    await page.getByRole('textbox', { name: 'Address line 1' }).fill(checkoutDetails.cardDetails.address.line1);
    await page.getByRole('textbox', { name: 'City' }).click();
    await page.getByRole('textbox', { name: 'City' }).fill(checkoutDetails.cardDetails.address.city);
    await page.getByRole('textbox', { name: 'ZIP' }).click();
    await page.getByRole('textbox', { name: 'ZIP' }).fill(checkoutDetails.cardDetails.address.postal_code);
    
    // Move to payment section
    await page.getByRole('heading', { name: 'Payment method' }).click();
    await page.getByTestId('card-accordion-item-button').click();
    await page.getByTestId('card-accordion-item-button').click(); // we need to click twice to expand the card-accordion-item
    
    // Fill in card details
    await page.getByRole('textbox', { name: 'Card number' }).click();
    await page.getByRole('textbox', { name: 'Card number' }).fill(checkoutDetails.cardDetails.number);
    await page.getByRole('textbox', { name: 'Expiration' }).click();
    await page.getByRole('textbox', { name: 'Expiration' }).fill(checkoutDetails.cardDetails.expiry);
    await page.getByRole('textbox', { name: 'CVC' }).click();
    await page.getByRole('textbox', { name: 'CVC' }).fill(checkoutDetails.cardDetails.cvc);
    
    // Handle billing address
    const usesSameAddress = !checkoutDetails.cardDetails.billingAddress || 
      addressesMatch(checkoutDetails.cardDetails.address, checkoutDetails.cardDetails.billingAddress);
    
    if (!usesSameAddress) {
      // Uncheck "Billing info is same as shipping" if addresses don't match
      await page.getByRole('checkbox', { name: 'Billing info is same as' }).uncheck();
      
      // Fill in cardholder name
      await page.getByRole('textbox', { name: 'Cardholder name' }).click();
      await page.getByRole('textbox', { name: 'Cardholder name' }).fill(
        `${checkoutDetails.cardDetails.firstName} ${checkoutDetails.cardDetails.lastName}`
      );
      
      // Enter billing address manually
      await page.getByRole('button', { name: 'Enter address manually' }).click();
      
      // Fill in billing address details
      const billing = checkoutDetails.cardDetails.billingAddress!;
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'Address line 1' }).fill(billing.line1);
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'City' }).click();
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'City' }).fill(billing.city);
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'ZIP' }).click();
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'ZIP' }).fill(billing.postal_code);
    }
    
    // Submit payment
    await page.getByTestId('hosted-payment-submit-button').click();
    
    // Wait for confirmation
    await page.getByText('Thanks for your payment').waitFor({ timeout: 30000 });
    
    console.log('Stripe checkout completed successfully');
    
    // Extract order details if available
    // This is a placeholder - you may need to adjust based on actual page structure
    let orderNumber = 'STRIPE-' + Date.now();
    let total = '$0.00';
    
    try {
      // Attempt to extract order details from the confirmation page
      // These selectors would need to be adjusted based on the actual page structure
      const confirmationText = await page.getByText('Thanks for your payment').textContent() || '';
      console.log('Confirmation text:', confirmationText);
      
      // You might extract order details from the page if available
      // For example: orderNumber = await page.getByText(/Order #\d+/).textContent();
    } catch (extractError) {
      console.warn('Could not extract detailed order information:', extractError);
    }
    
    return {
      success: true,
      orderDetails: {
        orderNumber,
        total
      }
    };
  } catch (error) {
    console.error('Error in Stripe checkout:', error);
    return {
      success: false,
      error: 'Stripe checkout error',
      details: error instanceof Error ? error.message : String(error)
    };
  }
} 