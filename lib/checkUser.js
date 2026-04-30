import { auth, currentUser } from "@clerk/nextjs/server";
import sql from "./db";

export const checkUser = async () => {
  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    const { has } = await auth();
    const subscriptionTier = has({ plan: "pro" }) ? "pro" : "free";

    // Check if user exists
    const existing = await sql`
      SELECT * FROM users WHERE clerk_id = ${user.id}
    `;

    if (existing.length > 0) {
      const existingUser = existing[0];

      // Update subscription tier if changed
      if (existingUser.subscription_tier !== subscriptionTier) {
        await sql`
          UPDATE users SET subscription_tier = ${subscriptionTier}, updated_at = NOW()
          WHERE clerk_id = ${user.id}
        `;
      }

      return { ...existingUser, subscriptionTier };
    }

    // Create new user
    const username =
      user.username || user.emailAddresses[0].emailAddress.split("@")[0];

    const newUser = await sql`
      INSERT INTO users (clerk_id, email, username, first_name, last_name, image_url, subscription_tier)
      VALUES (
        ${user.id},
        ${user.emailAddresses[0].emailAddress},
        ${username},
        ${user.firstName || ""},
        ${user.lastName || ""},
        ${user.imageUrl || ""},
        ${subscriptionTier}
      )
      RETURNING *
    `;

    return { ...newUser[0], subscriptionTier };
  } catch (error) {
    console.error("Error in checkUser:", error);
    return null;
  }
};