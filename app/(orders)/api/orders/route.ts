import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getStoaUserId } from '@/lib/db/queries';
import { APP_CONFIG } from "@/config/app.config";

// Get all orders for user
export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the Stoa user ID for the given user
    const stoaUserId = await getStoaUserId(session.user.id);
    
    if (!stoaUserId) {
      return NextResponse.json({ 
        error: 'User not found in Stoa'
      }, { status: 404 });
    }
    
    // Construct the URL with the userId parameter
    const url = `${APP_CONFIG.stoa.api.baseUrl}/purchase-requests/?userId=${encodeURIComponent(stoaUserId)}`;
    
    console.log('Fetching orders from Stoa:', url);
    
    // Make the request to Stoa
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STOA_API_KEY}`
      }
    });
    
    // Parse the response
    let responseData;
    responseData = await response.json();
    
    // Return the result
    if (!response.ok) {
      return NextResponse.json({ 
        error: responseData.error || responseData.message || 'Failed to fetch purchase requests from Stoa'
      }, { status: response.status || 500 });
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching purchase requests from Stoa:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Internal server error fetching purchase requests'
    }, { status: 500 });
  }
} 