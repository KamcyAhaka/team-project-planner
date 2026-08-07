import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
