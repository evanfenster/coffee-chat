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

    const { cardId } = await request.json()
    if (!cardId) {
      return NextResponse.json(
        { error: 'Card ID is required' },
        { status: 400 }
      )
    }

    // Deactivate the card
    const card = await stripe.issuing.cards.update(cardId, {
      status: 'canceled'
    })

    return NextResponse.json({
      success: true,
      cardId: card.id,
      status: card.status
    })
  } catch (error) {
    console.error('Error deactivating card:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to deactivate card' },
      { status: 500 }
    )
  }
} 