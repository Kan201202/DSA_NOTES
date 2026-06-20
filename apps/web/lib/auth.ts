import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { redirect } from "next/navigation";

export async function getOrCreateUser() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "unknown@unknown.com";

  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, email },
  });

  return user;
}