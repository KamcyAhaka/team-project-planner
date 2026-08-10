import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { z } from "zod";

const updateProfileSchema = z.object({
  displayName: z.string().trim().max(100).optional(),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
  profilePictureURL: z.union([z.string().url().max(500), z.literal("")]).optional(),
});

export async function GET() {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const db = await getDb();
    let user = null;

    if (session.user.id && ObjectId.isValid(session.user.id)) {
      user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(session.user.id) });
    }

    if (!user) {
      user = await db.collection("users").findOne({
        email: session.user.email.toLowerCase().trim(),
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id.toString(),
      email: user.email,
      displayName: user.displayName || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      profilePictureURL: user.profilePictureURL || "",
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request payload
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { displayName, firstName, lastName, profilePictureURL } = validationResult.data;

    // Build update document dynamically with only provided fields
    const updateDoc: Record<string, any> = {};
    if (displayName !== undefined) updateDoc.displayName = displayName;
    if (firstName !== undefined) updateDoc.firstName = firstName;
    if (lastName !== undefined) updateDoc.lastName = lastName;
    if (profilePictureURL !== undefined) updateDoc.profilePictureURL = profilePictureURL;

    // If nothing to update, return error
    if (Object.keys(updateDoc).length === 0) {
      return NextResponse.json(
        { error: "No fields to update provided." },
        { status: 400 }
      );
    }

    updateDoc.updatedAt = new Date();

    const db = await getDb();
    let query: Record<string, any> = {};

    if (session.user.id && ObjectId.isValid(session.user.id)) {
      query._id = new ObjectId(session.user.id);
    } else {
      query.email = session.user.email.toLowerCase().trim();
    }

    const result = await db.collection("users").findOneAndUpdate(
      query,
      { $set: updateDoc },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: result._id.toString(),
      email: result.email,
      displayName: result.displayName || "",
      firstName: result.firstName || "",
      lastName: result.lastName || "",
      profilePictureURL: result.profilePictureURL || "",
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to update profile." },
      { status: 500 }
    );
  }
}
