import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { user } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { APP_CONFIG } from "@/config/app.config";

// Schema for validating shipping address data
const shippingAddressSchema = z.object({
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().nullable(),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's stoaId
    const userData = await db.select({
      stoaId: user.stoaId,
    }).from(user)
      .where(eq(user.id, session.user.id))
      .execute();

    if (!userData || userData.length === 0 || !userData[0].stoaId) {
      return NextResponse.json({ error: "User not found or missing Stoa ID" }, { status: 404 });
    }

    const stoaId = userData[0].stoaId;

    // Call Stoa API to get the user's shipping address
    const stoaApiUrl = `${APP_CONFIG.stoa.api.baseUrl}/users?userId=${stoaId}`;
    const response = await fetch(stoaApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STOA_API_KEY}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Stoa API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch shipping address from Stoa", details: errorData },
        { status: response.status }
      );
    }

    const stoaUserData = await response.json();
    const stoaUser = stoaUserData[0];
    
    // Map Stoa's schema to our schema
    const shippingAddress = {
      addressLine1: stoaUser.line1 || "",
      addressLine2: stoaUser.line2 || null,
      city: stoaUser.city || "",
      state: stoaUser.state || "",
      postalCode: stoaUser.zip || "",
      country: stoaUser.country || "",
    };

    return NextResponse.json(shippingAddress);
  } catch (error) {
    console.error("Error fetching shipping address:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping address" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's stoaId
    const userData = await db.select({
      stoaId: user.stoaId,
    }).from(user)
      .where(eq(user.id, session.user.id))
      .execute();

    if (!userData || userData.length === 0 || !userData[0].stoaId) {
      return NextResponse.json({ error: "User not found or missing Stoa ID" }, { status: 404 });
    }

    const stoaId = userData[0].stoaId;
    const body = await request.json();
    const validatedData = shippingAddressSchema.parse(body);

    // Map our schema to Stoa's schema
    const stoaAddressData = {
      line1: validatedData.addressLine1,
      line2: validatedData.addressLine2 || "",
      city: validatedData.city,
      state: validatedData.state,
      zip: validatedData.postalCode,
      country: validatedData.country,
    };

    // Call Stoa API to update the user
    const stoaApiUrl = `${APP_CONFIG.stoa.api.baseUrl}/users`;
    
    console.log("Calling Stoa API:", stoaApiUrl, "with data:", {
      agentId: APP_CONFIG.stoa.api.agentId,
      userId: stoaId,
      ...stoaAddressData
    });
    
    const response = await fetch(stoaApiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.STOA_API_KEY}`
      },
      body: JSON.stringify({
        agentId: APP_CONFIG.stoa.api.agentId,
        userId: stoaId,
        ...stoaAddressData
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Stoa API error:", errorData);
      return NextResponse.json(
        { error: "Failed to update shipping address in Stoa", details: errorData },
        { status: response.status }
      );
    }

    return NextResponse.json({ message: "Shipping address updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid shipping address data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating shipping address:", error);
    return NextResponse.json(
      { error: "Failed to update shipping address" },
      { status: 500 }
    );
  }
} 