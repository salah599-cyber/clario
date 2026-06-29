import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import type { UserRole } from "@/lib/permissions/types";

export async function syncClerkUser(defaultRole: UserRole = "EXTERNAL") {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  return db.user.upsert({
    where: { clerkId: clerkUser.id },
    create: {
      clerkId: clerkUser.id,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      role: defaultRole,
    },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    },
  });
}
