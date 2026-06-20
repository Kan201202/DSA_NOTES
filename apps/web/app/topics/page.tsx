import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTopic } from "./actions";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

export default async function TopicsPage() {
  const user = await getOrCreateUser();
  const topics = await prisma.topic.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Topics</h1>

      <form action={createTopic} className="flex gap-2 mb-8">
        <Input name="name" placeholder="e.g. Rolling Hash, Segment Tree" required />
        <Button type="submit">Create</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/topics/${topic.id}`}>
            <Card className="hover:bg-accent transition">
              <CardHeader>
                <CardTitle>{topic.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {topic.theory?.slice(0, 120) || "No notes yet"}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {topics.length === 0 && (
          <p className="text-muted-foreground col-span-full">
            No topics yet. Create one above.
          </p>
        )}
      </div>
    </main>
  );
}