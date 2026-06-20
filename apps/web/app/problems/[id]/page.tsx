import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProblem, deleteProblem } from "../actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";

type Similar = {
  id: string;
  title: string;
  platform: string;
  platformId: string | null;
  distance: number;
};

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const problem = await prisma.problem.findUnique({
    where: { id },
    include: { topics: true },
  });
  if (!problem || problem.userId !== user.id) notFound();

  const allTopics = await prisma.topic.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });

  const similar = await prisma.$queryRawUnsafe<Similar[]>(
    `SELECT id, title, platform, "platformId", embedding <=> (SELECT embedding FROM "Problem" WHERE id = $1) AS distance
     FROM "Problem"
     WHERE "userId" = $2
       AND id != $1
       AND embedding IS NOT NULL
       AND (SELECT embedding FROM "Problem" WHERE id = $1) IS NOT NULL
     ORDER BY distance ASC
     LIMIT 3`,
    id,
    user.id
  );

  const selectedTopicIds = new Set(problem.topics.map((t) => t.topicId));
  const update = updateProblem.bind(null, id);
  const del = deleteProblem.bind(null, id);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <form action={update} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={problem.title} required />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={problem.status}
              className="w-full h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="todo">todo</option>
              <option value="attempted">attempted</option>
              <option value="solved">solved</option>
              <option value="to_revise">to_revise</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Input
              id="difficulty"
              name="difficulty"
              type="number"
              defaultValue={problem.difficulty ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeTakenMinutes">Time (min)</Label>
            <Input
              id="timeTakenMinutes"
              name="timeTakenMinutes"
              type="number"
              defaultValue={problem.timeTakenMinutes ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input id="url" name="url" defaultValue={problem.url ?? ""} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Topics</Label>
          <div className="flex flex-wrap gap-2 p-3 border rounded-md">
            {allTopics.length === 0 && (
              <span className="text-sm text-muted-foreground">
                No topics yet. Create some in the Topics page.
              </span>
            )}
            {allTopics.map((t) => (
              <label key={t.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="topicIds"
                  value={t.id}
                  defaultChecked={selectedTopicIds.has(t.id)}
                />
                {t.name}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes (markdown)</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={problem.notes ?? ""}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="solutionCode">Solution code</Label>
          <Textarea
            id="solutionCode"
            name="solutionCode"
            defaultValue={problem.solutionCode ?? ""}
            rows={15}
            className="font-mono text-sm"
          />
        </div>

        <Button type="submit">Save</Button>
      </form>

      {problem.aiSummary && (
        <div className="mt-8 p-4 border rounded-md bg-muted/30">
          <h3 className="text-sm font-semibold mb-2">AI Summary</h3>
          <p className="text-sm text-muted-foreground">{problem.aiSummary}</p>
        </div>
      )}

      {similar.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-3">
            Similar problems you've worked on
          </h3>
          <div className="space-y-2">
            {similar.map((s) => (
              <Link
                key={s.id}
                href={`/problems/${s.id}`}
                className="block p-3 border rounded-md hover:bg-accent transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">
                    {s.platform}
                    {s.platformId ? ` ${s.platformId}` : ""}
                  </span>
                  <span className="font-medium">{s.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {(1 - s.distance).toFixed(2)} similarity
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <form action={del} className="mt-4">
        <Button type="submit" variant="destructive">
          Delete problem
        </Button>
      </form>
    </main>
  );
}