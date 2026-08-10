import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

// The database URI will be loaded from the environment (defaulting to the local mongo URI if not specified)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/team_project_planner";

async function main() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  console.log("Database connected successfully.");

  // Generate test user passwords hashed
  const passwordHash = await bcrypt.hash("Password123", 12);

  const testUserId = new ObjectId();
  const testMemberId = new ObjectId();
  const testProjectId = new ObjectId();

  const testUserEmail = `test_${testUserId.toString()}@example.com`;
  const testMemberEmail = `member_${testMemberId.toString()}@example.com`;

  try {
    // 1. Seed database with test users and a project
    console.log("Seeding test users and project...");
    
    // Primary User (Owner)
    await db.collection("users").insertOne({
      _id: testUserId,
      email: testUserEmail,
      passwordHash,
      displayName: "Original Name",
      firstName: "Original",
      lastName: "User",
      profilePictureURL: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Collaborator User (Member)
    await db.collection("users").insertOne({
      _id: testMemberId,
      email: testMemberEmail,
      passwordHash,
      displayName: "Test Member",
      firstName: "Test",
      lastName: "Member",
      profilePictureURL: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Project
    await db.collection("projects").insertOne({
      _id: testProjectId,
      name: "Verification Project",
      description: "A project to verify members endpoint",
      ownerId: testUserId,
      members: [testMemberId],
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      status: "planning",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log("Database seeded successfully.");

    // Helper to store and retrieve cookies
    let cookies: string[] = [];

    function updateCookies(headers: Headers) {
      const setCookies = headers.getSetCookie();
      if (setCookies && setCookies.length > 0) {
        // Keep unique cookies by name
        const cookieMap = new Map<string, string>();
        // Add existing cookies
        cookies.forEach(c => {
          const parts = c.split(';')[0].split('=');
          if (parts.length >= 2) cookieMap.set(parts[0], c.split(';')[0]);
        });
        // Add new cookies
        setCookies.forEach(c => {
          const parts = c.split(';')[0].split('=');
          if (parts.length >= 2) cookieMap.set(parts[0], c.split(';')[0]);
        });
        cookies = Array.from(cookieMap.values());
      }
    }

    function getCookieHeader() {
      return cookies.join("; ");
    }

    // 2. Perform Login Flow
    console.log("\n--- STEP 1: Fetching CSRF Token ---");
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
    if (!csrfRes.ok) {
      throw new Error(`Failed to get CSRF token: ${csrfRes.statusText}`);
    }
    updateCookies(csrfRes.headers);
    const { csrfToken } = await csrfRes.json();
    console.log("CSRF Token obtained successfully.");

    console.log("\n--- STEP 2: Logging in via Credentials Callback ---");
    const loginBody = new URLSearchParams();
    loginBody.append("csrfToken", csrfToken);
    loginBody.append("email", testUserEmail);
    loginBody.append("password", "Password123");
    loginBody.append("redirectTo", "/dashboard");

    const loginRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Cookie": getCookieHeader(),
      },
      body: loginBody.toString(),
      redirect: "manual", // Prevent redirecting to verify response/cookies
    });

    updateCookies(loginRes.headers);
    console.log("Login call complete. Status:", loginRes.status);
    
    // 3. Test GET /api/users/me
    console.log("\n--- STEP 3: Testing GET /api/users/me ---");
    const getProfileRes = await fetch(`${BASE_URL}/api/users/me`, {
      headers: {
        "Cookie": getCookieHeader(),
      },
    });

    if (!getProfileRes.ok) {
      const errText = await getProfileRes.text();
      throw new Error(`GET /api/users/me failed: ${getProfileRes.status} ${errText}`);
    }

    const getProfile = await getProfileRes.json();
    console.log("GET /api/users/me response:", getProfile);
    if (getProfile.email !== testUserEmail) {
      throw new Error("GET /api/users/me returned wrong user email!");
    }

    // 4. Test PATCH /api/users/me
    console.log("\n--- STEP 4: Testing PATCH /api/users/me (Update displayName and names) ---");
    const patchBody = {
      displayName: "Verified Updated Name",
      firstName: "Verified",
      lastName: "Tester",
      profilePictureURL: "https://example.com/tester.jpg"
    };

    const patchRes = await fetch(`${BASE_URL}/api/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Cookie": getCookieHeader(),
      },
      body: JSON.stringify(patchBody),
    });

    if (!patchRes.ok) {
      const errText = await patchRes.text();
      throw new Error(`PATCH /api/users/me failed: ${patchRes.status} ${errText}`);
    }

    const patchProfile = await patchRes.json();
    console.log("PATCH /api/users/me response:", patchProfile);
    if (
      patchProfile.displayName !== patchBody.displayName ||
      patchProfile.firstName !== patchBody.firstName ||
      patchProfile.lastName !== patchBody.lastName ||
      patchProfile.profilePictureURL !== patchBody.profilePictureURL
    ) {
      throw new Error("PATCH /api/users/me did not update fields correctly!");
    }

    // 5. Test GET /api/projects/[id]/members
    console.log("\n--- STEP 5: Testing GET /api/projects/[id]/members ---");
    const getMembersRes = await fetch(`${BASE_URL}/api/projects/${testProjectId.toString()}/members`, {
      headers: {
        "Cookie": getCookieHeader(),
      },
    });

    if (!getMembersRes.ok) {
      const errText = await getMembersRes.text();
      throw new Error(`GET project members failed: ${getMembersRes.status} ${errText}`);
    }

    const members = await getMembersRes.json();
    console.log("GET project members response:", JSON.stringify(members, null, 2));
    
    if (!Array.isArray(members) || members.length !== 2) {
      throw new Error("Project members endpoint did not return exactly 2 members!");
    }

    const owner = members.find(m => m.role === "owner");
    const member = members.find(m => m.role === "member");

    if (!owner || owner.displayName !== "Verified Updated Name" || owner.id !== testUserId.toString()) {
      throw new Error("Owner details incorrect in project members response!");
    }

    if (!member || member.displayName !== "Test Member" || member.id !== testMemberId.toString()) {
      throw new Error("Member details incorrect in project members response!");
    }

    console.log("\n=================================");
    console.log(" 🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("=================================");

  } catch (error) {
    console.error("\n❌ Test verification failed:", error);
    process.exitCode = 1;
  } finally {
    // Cleanup
    console.log("\nCleaning up test database documents...");
    await db.collection("users").deleteOne({ _id: testUserId });
    await db.collection("users").deleteOne({ _id: testMemberId });
    await db.collection("projects").deleteOne({ _id: testProjectId });
    console.log("Cleanup complete.");
    await client.close();
  }
}

main();
