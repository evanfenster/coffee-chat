import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/queries';
import { order } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { 
      productHandle, 
      productName, 
      price, 
      stripeSessionId,
      cardHolderId,
      cardId 
    } = body;

    // Validate required fields
    if (!productHandle || !productName || !price || !stripeSessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new order
    const [newOrder] = await db.insert(order).values({
      userId: session.user.id,
      productHandle,
      productName,
      price,
      stripeSessionId,
      cardHolderId,
      cardId,
      status: 'pending',
    }).returning();

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, status, errorDetails } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update order status
    const [updatedOrder] = await db
      .update(order)
      .set({
        status,
        errorDetails: errorDetails || null,
        updatedAt: new Date(),
      })
      .where(eq(order.id, orderId))
      .returning();

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      // Get specific order
      const orders = await db
        .select()
        .from(order)
        .where(eq(order.id, orderId))
        .limit(1);

      if (orders.length === 0) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(orders[0]);
    }

    // Get all orders for user
    const orders = await db
      .select()
      .from(order)
      .where(eq(order.userId, session.user.id))
      .orderBy(order.createdAt);

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
} 