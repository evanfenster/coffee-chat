import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@/app/(auth)/auth'
import { db } from '@/lib/db/queries'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { calculateFinalPrice } from '@/lib/utils/pricing'

export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      )
    }

    const { name, price, imageUrl } = await request.json()

    // Validate required fields
    if (!name || !price) {
      return NextResponse.json(
        { error: 'Name and price are required fields' },
        { status: 400 }
      )
    }

    // Calculate final price including fees and shipping (assuming non-subscriber)
    const finalPrice = calculateFinalPrice(parseFloat(price))
    
    // Convert to cents for Stripe
    const priceInCents = Math.round(finalPrice * 100)
    if (isNaN(priceInCents) || priceInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid price value' },
        { status: 400 }
      )
    }

    // Get user details to check for existing Stripe customer
    const users = await db.select().from(user).where(eq(user.id, session.user.id))
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    const userData = users[0]

    // Create checkout session with or without existing customer
    const checkoutSession = await stripe.checkout.sessions.create({
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
      ...(userData.stripeCustomerId 
        ? { customer: userData.stripeCustomerId }
        : { customer_creation: 'always' }
      ),
      metadata: {
        userId: session.user.id
      }
    })

    return NextResponse.json({ clientSecret: checkoutSession.client_secret })
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
} 