import { Page } from 'playwright';
import { APP_CONFIG } from '@/config/app.config';

interface Address {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface PurchaseDetails {
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

export interface PurchaseResult {
  success: boolean;
  orderDetails?: {
    orderNumber: string;
    total: string;
  };
  error?: string;
  details?: string;
}

export async function executeTradeCoffeePurchase(
  page: Page,
  purchaseDetails: PurchaseDetails
): Promise<PurchaseResult> {
  const { productHandle, cardDetails } = purchaseDetails;

  try {
    console.log('Navigating to product page...');
    await page.goto(`${APP_CONFIG.product.productUrl}${productHandle}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Handle popup if present
    console.log('Waiting for and checking popup...');
    try {
      await page.waitForTimeout(5000);
      await page.getByRole('button', { name: 'Close dialog' }).click();
      await page.waitForTimeout(2000);
      console.log('Popup closed successfully');
    } catch (e) {
      console.log('No popup found, continuing...');
    }

    console.log('Selecting one-time purchase...');
    await page.getByText('One-Time Purchase$').click();
    await page.waitForTimeout(1000);

    console.log('Adding to cart and proceeding to checkout...');
    await page.getByRole('button', { name: 'Add to Cart' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.waitForTimeout(2000);

    console.log('Filling shipping information...');
    await page.getByRole('textbox', { name: 'Email' }).fill(cardDetails.email);
    await page.getByRole('textbox', { name: 'First name (optional)' }).fill(cardDetails.firstName);
    await page.getByRole('textbox', { name: 'Last name' }).fill(cardDetails.lastName);
    await page.getByRole('combobox', { name: 'Address' }).fill(cardDetails.address.line1);
    await page.getByRole('textbox', { name: 'City' }).fill(cardDetails.address.city);
    await page.getByLabel('State').selectOption(cardDetails.address.state);
    await page.getByRole('textbox', { name: 'ZIP code' }).fill(cardDetails.address.postal_code);

    await page.getByRole('button', { name: 'Continue to shipping' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Continue to payment' }).click();
    await page.waitForTimeout(2000);

    console.log('Filling card details...');
    await page.waitForTimeout(2000);

    try {
      const cardNumberFrame = await page.frameLocator('iframe[name*="card-fields-number"]').first();
      await cardNumberFrame.getByRole('textbox', { name: 'Card number' }).fill(cardDetails.number);
      
      const expiryFrame = await page.frameLocator('iframe[name*="card-fields-expiry"]').first();
      await expiryFrame.getByRole('textbox', { name: 'Expiration date (MM / YY)' }).fill(cardDetails.expiry);
      
      const cvcFrame = await page.frameLocator('iframe[name*="card-fields-verification_value"]').first();
      await cvcFrame.getByRole('textbox', { name: 'Security code' }).fill(cardDetails.cvc);
      
      const nameFrame = await page.frameLocator('iframe[name*="card-fields-name"]').first();
      await nameFrame.getByRole('textbox', { name: 'Name on card' }).fill(`${cardDetails.firstName} ${cardDetails.lastName}`);

      // Handle billing address following test-checkout.ts pattern
      console.log('Shipping address:', JSON.stringify(cardDetails.address, null, 2));
      
      // Create billing address from shipping address, matching test-checkout.ts pattern
      const billingAddress = {
        line1: cardDetails.address.line1,
        line2: cardDetails.address.line2,
        city: cardDetails.address.city,
        state: cardDetails.address.state,
        postal_code: cardDetails.address.postal_code,
        country: cardDetails.address.country
      };
      
      console.log('Billing address:', JSON.stringify(billingAddress, null, 2));
      
      // Check if addresses match (they should since we created billing from shipping)
      const addressesMatch = 
        billingAddress.line1 === cardDetails.address.line1 &&
        billingAddress.city === cardDetails.address.city &&
        billingAddress.state === cardDetails.address.state &&
        billingAddress.postal_code === cardDetails.address.postal_code;
      
      console.log('Addresses match?', addressesMatch ? 'YES' : 'NO');
      
      // Use the billing address
      console.log('Setting up billing address...');
      await page.getByText('Use a different billing').click();
      await page.getByRole('combobox', { name: 'Address' }).fill(billingAddress.line1);
      await page.getByRole('textbox', { name: 'City' }).fill(billingAddress.city);
      await page.getByLabel('State').selectOption(billingAddress.state);
      await page.getByRole('textbox', { name: 'ZIP code' }).fill(billingAddress.postal_code);
    } catch (error) {
      throw new Error(`Failed to fill card details: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log('Completing purchase...');
    await page.getByRole('button', { name: 'Pay now' }).click();

    try {
      await page.waitForSelector('h1:has-text("Thank you"), h1:has-text("Order confirmed")', { timeout: 8000 });
    } catch (error) {
      // Check for error messages on the page
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[class*="error"], [class*="Error"], .alert-danger');
        return Array.from(errorElements).map(el => el.textContent).join(' ');
      });
      throw new Error(`Purchase failed. Errors found: ${errorText || 'No specific error message found'}`);
    }

    console.log('Purchase completed successfully!');

    return {
      success: true,
      orderDetails: {
        orderNumber: '',
        total: ''
      }
    };
  } catch (error) {
    console.error('Error during automated purchase:', error);
    return {
      success: false,
      error: 'Failed to complete automated purchase',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 