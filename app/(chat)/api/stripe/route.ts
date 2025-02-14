import { NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(request: Request) {
  try {
    const { name, price, imageUrl } = await request.json();

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required fields' },
        { status: 400 }
      );
    }

    // Validate price format
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      );
    }

    // Create a product
    const product = await stripe.products.create({
      name,
      images: imageUrl ? [imageUrl] : undefined,
    });

    // Create a price for the product
    const priceObj = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(priceValue * 100), // Convert to cents
      currency: 'usd',
    });

    // Create a payment link
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: priceObj.id, quantity: 1 }],
    });

    return NextResponse.json({ url: paymentLink.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 