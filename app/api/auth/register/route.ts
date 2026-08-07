import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getDb } from "@/lib/mongodb";

const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address")
    .max(255, "Email is too long"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().trim().max(100).optional(),
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request payload
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name, firstName, lastName } = validationResult.data;
    const normalizedEmail = String(email).trim().toLowerCase();

    const db = await getDb();

    // Check for existing user (NoSQL injection safe by using explicit string primitives)
    const existingUser = await db.collection("users").findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Salt and hash password (cost factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    const displayName =
      name ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      normalizedEmail.split("@")[0];

    const newUser = {
      email: normalizedEmail,
      passwordHash,
      displayName,
      firstName: firstName || "",
      lastName: lastName || "",
      profilePictureURL: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("users").insertOne(newUser);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: result.insertedId.toString(),
          email: newUser.email,
          displayName: newUser.displayName,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          profilePictureURL: newUser.profilePictureURL,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to register user." },
      { status: 500 }
    );
  }
}
