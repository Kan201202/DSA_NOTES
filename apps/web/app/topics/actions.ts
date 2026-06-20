"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function createTopic(formData: FormData) {
  const user = await getOrCreateUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const topic = await prisma.topic.create({
    data: { userId: user.id, name, slug: slugify(name) },
  });

  revalidatePath("/topics");
  redirect(`/topics/${topic.id}`);
}

export async function updateTopic(id: string, formData: FormData) {
  const user = await getOrCreateUser();

  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  const name = String(formData.get("name") ?? "").trim();
  const theory = String(formData.get("theory") ?? "");
  const codeTemplate = String(formData.get("codeTemplate") ?? "");

  await prisma.topic.update({
    where: { id },
    data: { name, slug: slugify(name), theory, codeTemplate },
  });

  revalidatePath("/topics");
  revalidatePath(`/topics/${id}`);
}

export async function deleteTopic(id: string) {
  const user = await getOrCreateUser();

  const existing = await prisma.topic.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  await prisma.topic.delete({ where: { id } });
  revalidatePath("/topics");
  redirect("/topics");
}