import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTopic, deleteTopic } from "../actions";
import { notFound } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getOrCreateUser();

  const topic = await prisma.topic.findUnique({ where: { id } });
  if (!topic || topic.userId !== user.id) notFound();

  const update = updateTopic.bind(null, id);
  const del = deleteTopic.bind(null, id);

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <form action={update} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Topic name</Label>
          <Input id="name" name="name" defaultValue={topic.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="theory">Theory / Notes (markdown)</Label>
          <Textarea
            id="theory"
            name="theory"
            defaultValue={topic.theory ?? ""}
            rows={15}
            className="font-mono text-sm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="codeTemplate">Code template</Label>
          <Textarea
            id="codeTemplate"
            name="codeTemplate"
            defaultValue={topic.codeTemplate ?? ""}
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit">Save</Button>
        </div>
      </form>

      <form action={del} className="mt-4">
        <Button type="submit" variant="destructive">Delete topic</Button>
      </form>
    </main>
  );
}