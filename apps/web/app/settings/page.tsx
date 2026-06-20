import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

async function updateHandles(formData: FormData) {
  "use server";
  const user = await getOrCreateUser();
  const cfHandle = String(formData.get("cfHandle") ?? "").trim() || null;
  const lcHandle = String(formData.get("lcHandle") ?? "").trim() || null;
  await prisma.user.update({
    where: { id: user.id },
    data: { cfHandle, lcHandle },
  });
  revalidatePath("/settings");
}

export default async function SettingsPage() {
  const user = await getOrCreateUser();
  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <form action={updateHandles} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cfHandle">Codeforces handle</Label>
          <Input id="cfHandle" name="cfHandle" defaultValue={user.cfHandle ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lcHandle">LeetCode handle</Label>
          <Input id="lcHandle" name="lcHandle" defaultValue={user.lcHandle ?? ""} />
        </div>
        <Button type="submit">Save</Button>
      </form>
    </main>
  );
}