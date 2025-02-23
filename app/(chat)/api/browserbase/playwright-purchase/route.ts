import { chromium, Page } from 'playwright';
import { APP_CONFIG } from '@/config/app.config';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import Browserbase from "@browserbasehq/sdk";

if (!process.env.BROWSERBASE_API_KEY) {
  throw new Error('BROWSERBASE_API_KEY is required');
}

if (!process.env.BROWSERBASE_PROJECT_ID) {
  throw new Error('BROWSERBASE_PROJECT_ID is required');
}

export async function POST(request: NextRequest) {
  let browser;
  let page: Page | undefined;
  
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      )
    }

    const { productHandle, cardDetails } = await request.json()
    if (!productHandle || !cardDetails) {
      return NextResponse.json(
        { error: 'Product handle and card details are required' },
        { status: 400 }
      )
    }

    // Validate card details
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc) {
      return NextResponse.json(
        { error: 'Invalid card details provided', details: { 
          hasNumber: !!cardDetails.number,
          hasExpiry: !!cardDetails.expiry,
          hasCvc: !!cardDetails.cvc
        }},
        { status: 400 }
      )
    }

    console.log('Starting purchase automation for product:', productHandle);

    // Initialize Browserbase
    const bb = new Browserbase({
      apiKey: process.env.BROWSERBASE_API_KEY,
    });

    // Create a new session
    const bbSession = await bb.sessions.create({
      projectId: process.env.BROWSERBASE_PROJECT_ID!,
    });

    // Connect to the session
    browser = await chromium.connectOverCDP(bbSession.connectUrl);

    // Get default context and page
    const context = browser.contexts()[0];
    page = context?.pages()[0];

    if (!page) {
      throw new Error('No default page available');
    }

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
      //await page.getByRole('textbox', { name: 'ZIP code' }).fill(cardDetails.address.postal_code);
      await page.getByRole('textbox', { name: 'ZIP code' }).fill('94158'); // San Francisco, CA for test data

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

      const orderNumber = await page.$eval(
        '[data-test="order-number"], .order-number, .confirmation-number',
        (el: HTMLElement) => el.textContent?.trim() || ''
      );

      const total = await page.$eval(
        '[data-test="order-total"], .order-total, .total-amount',
        (el: HTMLElement) => el.textContent?.trim() || ''
      );

      console.log('Purchase completed successfully!');

      return NextResponse.json({
        success: true,
        orderDetails: {
          orderNumber,
          total
        }
      });
    } catch (error) {
      console.error('Error during automated purchase:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to complete automated purchase',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in request handling:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to complete automated purchase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
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