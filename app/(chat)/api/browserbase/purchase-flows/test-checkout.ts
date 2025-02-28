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

    // throw error right away
    throw new Error('Test purchase failed');


  const { cardDetails } = purchaseDetails;
  const { address: shippingAddress, billingAddress } = cardDetails;

  try {
    console.log('Starting test checkout purchase flow...');
    console.log('Navigating to Stripe test checkout page...');
    await page.goto('https://buy.stripe.com/test_dR6fZ22te3qA8cU3cc', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Check for and close Link verification popup if it appears
    console.log('Checking for Link verification popup...');
    try {
      // Look for the verification modal
      const verificationModal = await page.waitForSelector('.VerificationModal-modal', { timeout: 5000 });
      if (verificationModal) {
        console.log('Found Link verification modal, looking for close button...');
        // Find and click the close button within the modal
        const closeButton = await page.waitForSelector('.LinkVerificationHeader-cancelButton', { timeout: 5000 });
        if (closeButton) {
          console.log('Found close button, clicking it...');
          await closeButton.click();
          console.log('Successfully closed verification popup');
        }
      }
    } catch (error) {
      console.log('No Link verification popup found or it was already closed, continuing...');
    }

    // Fill email and name
    console.log('Filling email and name...');
    await page.getByRole('textbox', { name: 'Email' }).click();
    await page.getByRole('textbox', { name: 'Email' }).fill(cardDetails.email);
    await page.getByRole('textbox', { name: 'Name' }).click();
    await page.getByRole('textbox', { name: 'Name' }).fill(`${cardDetails.firstName} ${cardDetails.lastName}`);

    // Fill shipping address
    console.log('Filling shipping address...');
    await page.getByRole('button', { name: 'Enter address manually' }).click();
    await page.getByRole('textbox', { name: 'Address line 1' }).fill(shippingAddress.line1);
    if (shippingAddress.line2) {
      await page.getByRole('textbox', { name: 'Address line 2' }).fill(shippingAddress.line2);
    }
    await page.getByRole('textbox', { name: 'City' }).click();
    await page.getByRole('textbox', { name: 'City' }).fill(shippingAddress.city);
    await page.getByRole('textbox', { name: 'ZIP' }).click();
    await page.getByRole('textbox', { name: 'ZIP' }).fill(shippingAddress.postal_code);

    // Select card payment method
    console.log('Selecting card payment method...');
    await page.getByTestId('card-accordion-item-button').click();
    await page.getByTestId('card-accordion-item-button').click(); // click twice to open

    // Fill in card details
    console.log('Filling card details...');
    await page.getByRole('textbox', { name: 'Card number' }).click();
    const formattedCardNumber = cardDetails.number.replace(/(.{4})/g, '$1 ').trim();
    await page.getByRole('textbox', { name: 'Card number' }).fill(formattedCardNumber);
    
    await page.getByRole('textbox', { name: 'Expiration' }).click();
    const formattedExpiry = cardDetails.expiry.includes('/') ? cardDetails.expiry : cardDetails.expiry.replace(/(\d{2})(\d{2})/, '$1 / $2');
    await page.getByRole('textbox', { name: 'Expiration' }).fill(formattedExpiry);
    
    await page.getByRole('textbox', { name: 'CVC' }).click();
    await page.getByRole('textbox', { name: 'CVC' }).fill(cardDetails.cvc);

    // Handle billing info
    console.log('Setting up billing info...');
    await page.getByRole('textbox', { name: 'Cardholder name' }).click();
    await page.getByRole('textbox', { name: 'Cardholder name' }).fill(`${cardDetails.firstName} ${cardDetails.lastName}`);

    // If billing address is different from shipping, uncheck the box and fill in billing details
    if (billingAddress && !addressesMatch(shippingAddress, billingAddress)) {
      console.log('Filling different billing address...');
      await page.getByRole('checkbox', { name: 'Billing info is same as' }).uncheck();
      await page.getByRole('button', { name: 'Enter address manually' }).click();
      
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'Address line 1' }).click();
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'Address line 1' }).fill(billingAddress.line1);
      if (billingAddress.line2) {
        await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'Address line 2' }).fill(billingAddress.line2);
      }
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'City' }).click();
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'City' }).fill(billingAddress.city);
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'ZIP' }).click();
      await page.getByTestId('card-accordion-item').getByRole('textbox', { name: 'ZIP' }).fill(billingAddress.postal_code);
    }

    // Uncheck save info
    console.log('Unchecking save info...');
    await page.getByRole('checkbox', { name: 'Save my info for 1-click' }).uncheck();

    // Complete purchase
    console.log('Completing purchase...');
    await page.getByTestId('hosted-payment-submit-button').click();

    try {
      console.log('Waiting for success message...');
      await page.waitForSelector('text="Thanks for your payment"', { timeout: 10000 });
      console.log('Test purchase completed successfully!');

      return {
        success: true,
        orderDetails: {
          orderNumber: 'N/A',
          total: 'N/A'
        }
      };
    } catch (error) {
      // Check for error messages
      console.log('Success message not found, checking for errors...');
      const errorText = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('[role="alert"], .StripeError');
        return Array.from(errorElements).map(el => el.textContent).join(' ');
      });
      throw new Error(`Test purchase failed. Errors found: ${errorText || 'No specific error message found'}`);
    }
  } catch (error) {
    console.error('Error during test purchase:', error);
    return {
      success: false,
      error: 'Failed to complete test purchase',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 