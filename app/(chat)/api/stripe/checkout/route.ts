import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const { name, price, imageUrl } = await request.json()

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required fields' },
        { status: 400 }
      )
    }

    // Validate price format
    const priceInCents = Math.round(parseFloat(price) * 100)
    if (isNaN(priceInCents) || priceInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name,
              images: imageUrl ? [imageUrl] : undefined,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
    })

    return NextResponse.json({ clientSecret: session.client_secret })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 