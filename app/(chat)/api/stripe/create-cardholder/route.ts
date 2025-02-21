import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@/app/(auth)/auth'
import { db } from '@/lib/db/queries'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'User must be logged in' },
        { status: 401 }
      )
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get checkout session details
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    if (!checkoutSession.customer) {
      return NextResponse.json(
        { error: 'No customer created during checkout' },
        { status: 400 }
      )
    }

    // Get the customer details
    const customer = await stripe.customers.retrieve(checkoutSession.customer as string)
    if (!customer || customer.deleted) {
      return NextResponse.json(
        { error: 'Customer not found or deleted' },
        { status: 400 }
      )
    }

    // Get user details
    const users = await db.select().from(user).where(eq(user.id, session.user.id))
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    const userData = users[0]

    // Only create cardholder if one doesn't exist
    if (!userData.stripeCardHolderId) {
      // Split name into first and last name
      const nameParts = (customer.name || userData.email.split('@')[0]).split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User'

      // Create a cardholder in Stripe using customer details
      const cardholder = await stripe.issuing.cardholders.create({
        type: 'individual',
        name: `${firstName} ${lastName}`,
        email: customer.email || userData.email,
        phone_number: customer.phone || undefined,
        individual: {
          first_name: firstName,
          last_name: lastName,
          card_issuing: {
            user_terms_acceptance: {
              date: Math.floor(Date.now() / 1000), // Current time in Unix timestamp
              ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
            },
          },
        },
        status: 'active',
        billing: {
          address: customer.address ? {
            line1: customer.address.line1 || '123 Main Street',
            line2: customer.address.line2 || undefined,
            city: customer.address.city || 'San Francisco',
            state: customer.address.state || 'CA',
            postal_code: customer.address.postal_code || '94111',
            country: customer.address.country || 'US',
          } : {
            line1: '123 Main Street',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94111',
            country: 'US',
          }
        },
      })

      // Update user with cardholder and customer IDs
      await db
        .update(user)
        .set({ 
          stripeCardHolderId: cardholder.id,
          stripeCustomerId: customer.id
        })
        .where(eq(user.id, session.user.id))

      return NextResponse.json({ cardHolderId: cardholder.id })
    }

    return NextResponse.json({ cardHolderId: userData.stripeCardHolderId })
  } catch (error) {
    console.error('Error creating cardholder:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create cardholder' },
      { status: 500 }
    )
  }
} 