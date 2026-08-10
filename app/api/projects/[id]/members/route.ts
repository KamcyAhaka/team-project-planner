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
      (memberId: any) => memberId.toString() === currentUserIdStr
    );

    if (!isOwner && !isMember) {
      return NextResponse.json(
        { error: "Forbidden. You are not a member of this project." },
        { status: 403 }
      );
    }

    // 5. Gather all member user IDs (owner + list of members)
    const memberIds: any[] = [];
    if (project.ownerId) {
      memberIds.push(project.ownerId);
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
