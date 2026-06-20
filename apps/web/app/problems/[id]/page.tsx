import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateProblem, deleteProblem } from "../actions";
import { notFound } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";

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

      <form action={del} className="mt-4">
        <Button type="submit" variant="destructive">Delete problem</Button>
      </form>
    </main>
  );
}