import { getOrCreateUser } from "@/lib/auth";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <main className="p-8">
        <p>Sign in to continue.</p>
      </main>
    );
  }

  const user = await getOrCreateUser();

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
      <p className="text-sm text-muted-foreground mt-2">User ID: {user.id}</p>
    </main>
  );
}