import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const currentUserId = session.user.id;

    // 2. Await and validate the project ID parameter
    const { id: projectId } = await params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format." },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 3. Find the project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // 4. Verify authorization (current user must be the project owner or a member)
    const currentUserIdStr = currentUserId.toString();
    const ownerIdStr = project.ownerId?.toString();
    
    const isOwner = ownerIdStr === currentUserIdStr;
    const isMember = project.members?.some(
      (memberId: unknown) => String(memberId) === currentUserIdStr
    );

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this project." },
        { status: 403 }
      );
    }

    // 5. Gather all member user IDs (owner + list of members)
    const memberIds: (string | ObjectId)[] = [];
    if (project.ownerId) {
      memberIds.push(project.ownerId as string | ObjectId);
    }
    if (Array.isArray(project.members)) {
      memberIds.push(...project.members);
    }

    // Deduplicate IDs
    const uniqueMemberIdStrings = Array.from(
      new Set(memberIds.map((id) => id.toString()))
    );
    const uniqueMemberObjectIds = uniqueMemberIdStrings
      .filter((idStr) => ObjectId.isValid(idStr))
      .map((idStr) => new ObjectId(idStr));

    // 6. Query the users details
    const users = await db
      .collection("users")
      .find({ _id: { $in: uniqueMemberObjectIds } })
      .project({ passwordHash: 0 }) // Omit security-sensitive fields
      .toArray();

    // 7. Format members response
    const membersList = users.map((user) => {
      const userIdStr = user._id.toString();
      const role = userIdStr === ownerIdStr ? "owner" : "member";
      return {
        id: userIdStr,
        email: user.email,
        displayName: user.displayName || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        profilePictureURL: user.profilePictureURL || "",
        role,
      };
    });

    return NextResponse.json(membersList);
  } catch (error) {
    console.error("Get project members error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to retrieve project members." },
      { status: 500 }
    );
  }
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate the user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const currentUserIdStr = session.user.id.toString();

    // 2. Validate parameters
    const { id: projectId } = await params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format." },
        { status: 400 }
      );
    }

    // 3. Read body
    const { email } = await request.json();
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const inviteEmail = email.trim().toLowerCase();

    const db = await getDb();

    // 4. Retrieve the project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // 5. Verify the requester is the project owner
    const ownerIdStr = project.ownerId?.toString();
    if (ownerIdStr !== currentUserIdStr) {
      return NextResponse.json(
        { error: "Forbidden. Only the project owner can invite members." },
        { status: 403 }
      );
    }

    // 6. Find user to invite
    const userToInvite = await db.collection("users").findOne({
      email: inviteEmail,
    });

    if (!userToInvite) {
      return NextResponse.json(
        { error: `User with email "${inviteEmail}" not found.` },
        { status: 404 }
      );
    }

    const inviteUserId = userToInvite._id;
    const inviteUserIdStr = inviteUserId.toString();

    // 7. Check if user is already the owner or a member
    if (ownerIdStr === inviteUserIdStr) {
      return NextResponse.json(
        { error: "User is already the owner of this project." },
        { status: 400 }
      );
    }

    const members: (string | ObjectId)[] = project.members || [];
    const isAlreadyMember = members.some(
      (m) => m.toString() === inviteUserIdStr
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { error: "User is already a member of this project." },
        { status: 400 }
      );
    }

    // 8. Add user to members list
    const updatedMembers = [...members, inviteUserId];
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { members: updatedMembers, updatedAt: new Date() } }
    );

    return NextResponse.json({
      message: "Member invited successfully.",
      user: {
        id: inviteUserIdStr,
        email: userToInvite.email,
        name: userToInvite.displayName || [userToInvite.firstName, userToInvite.lastName].filter(Boolean).join(" ") || userToInvite.email.split("@")[0],
        displayName: userToInvite.displayName || "",
        firstName: userToInvite.firstName || "",
        lastName: userToInvite.lastName || "",
        profilePictureURL: userToInvite.profilePictureURL || "",
        role: "member",
      },
    });
  } catch (error) {
    console.error("Invite member error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to invite member." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const currentUserIdStr = session.user.id.toString();

    // 2. Validate parameters
    const { id: projectId } = await params;
    if (!projectId || !ObjectId.isValid(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID format." },
        { status: 400 }
      );
    }

    // 3. Read member ID from query params
    const { searchParams } = new URL(request.url);
    const memberIdToRemove = searchParams.get("userId");

    if (!memberIdToRemove || !ObjectId.isValid(memberIdToRemove)) {
      return NextResponse.json(
        { error: "Valid member user ID is required." },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 4. Retrieve project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found." },
        { status: 404 }
      );
    }

    // 5. Verify current user is the owner
    const ownerIdStr = project.ownerId?.toString();
    if (ownerIdStr !== currentUserIdStr) {
      return NextResponse.json(
        { error: "Forbidden. Only the project owner can remove members." },
        { status: 403 }
      );
    }

    // 6. Check if target member is the owner
    if (ownerIdStr === memberIdToRemove) {
      return NextResponse.json(
        { error: "Cannot remove the project owner." },
        { status: 400 }
      );
    }

    const members: (string | ObjectId)[] = project.members || [];
    const isMember = members.some((m) => m.toString() === memberIdToRemove);

    if (!isMember) {
      return NextResponse.json(
        { error: "User is not a member of this project." },
        { status: 404 }
      );
    }

    // 7. Remove member
    const updatedMembers = members.filter(
      (m) => m.toString() !== memberIdToRemove
    );

    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      { $set: { members: updatedMembers, updatedAt: new Date() } }
    );

    return NextResponse.json({
      message: "Member removed successfully.",
      removedId: memberIdToRemove,
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal server error. Failed to remove member." },
      { status: 500 }
    );
  }
}