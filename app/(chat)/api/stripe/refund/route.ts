import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { auth } from '@/app/(auth)/auth'

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

    // Get the payment intent from the checkout session
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
    if (!checkoutSession.payment_intent) {
      return NextResponse.json(
        { error: 'No payment intent found' },
        { status: 400 }
      )
    }

    // Create a refund
    const refund = await stripe.refunds.create({
      payment_intent: checkoutSession.payment_intent as string,
      reason: 'requested_by_customer'
    })

    return NextResponse.json({ refundId: refund.id })
  } catch (error) {
    console.error('Error creating refund:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create refund' },
      { status: 500 }
    )
  }
} 