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

    // Get user details
    const users = await db.select().from(user).where(eq(user.id, session.user.id))
    if (users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    const userData = users[0]

    if (!userData.stripeCardHolderId) {
      return NextResponse.json(
        { error: 'User does not have a cardholder ID' },
        { status: 400 }
      )
    }

    // Create a virtual card for this checkout
    const card = await stripe.issuing.cards.create({
      cardholder: userData.stripeCardHolderId,
      currency: 'usd',
      type: 'virtual',
      status: 'active',
      metadata: {
        checkoutSessionId: sessionId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ cardId: card.id })
  } catch (error) {
    console.error('Error creating virtual card:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create virtual card' },
      { status: 500 }
    )
  }
} 