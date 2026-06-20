import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createProblem } from "./actions";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";

const STATUS_COLORS: Record<string, string> = {
  todo: "bg-gray-500",
  attempted: "bg-yellow-500",
  solved: "bg-green-600",
  to_revise: "bg-orange-500",
};

export default async function ProblemsPage() {
  const user = await getOrCreateUser();
  const problems = await prisma.problem.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { topics: { include: { topic: true } } },
  });

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Problems</h1>

      <form action={createProblem} className="flex flex-wrap gap-2 mb-8 items-end">
        <div className="flex-1 min-w-[200px]">
          <Input name="title" placeholder="Problem title" required />
        </div>
        <select
          name="platform"
          defaultValue="CF"
          className="h-9 rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="CF">CF</option>
          <option value="LC">LC</option>
          <option value="AC">AC</option>
          <option value="Other">Other</option>
        </select>
        <Input name="platformId" placeholder="e.g. 1840C" className="w-32" />
        <Input name="url" placeholder="URL (optional)" className="flex-1 min-w-[200px]" />
        <Input name="difficulty" type="number" placeholder="Rating" className="w-24" />
        <Button type="submit">Add</Button>
      </form>

      <div className="space-y-2">
        {problems.map((p) => (
          <Link key={p.id} href={`/problems/${p.id}`}>
            <Card className="hover:bg-accent transition">
              <CardContent className="p-4 flex items-center gap-3">
                <Badge className={STATUS_COLORS[p.status]}>{p.status}</Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {p.platform}
                  {p.platformId ? ` ${p.platformId}` : ""}
                </span>
                <span className="font-medium">{p.title}</span>
                {p.difficulty && (
                  <span className="text-xs text-muted-foreground">★ {p.difficulty}</span>
                )}
                <div className="ml-auto flex gap-1">
                  {p.topics.map((t) => (
                    <Badge key={t.topicId} variant="outline" className="text-xs">
                      {t.topic.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {problems.length === 0 && (
          <p className="text-muted-foreground">No problems yet. Add one above.</p>
        )}
      </div>
    </main>
  );
}