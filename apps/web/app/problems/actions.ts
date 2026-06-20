"use server";

import { prisma } from "@/lib/prisma";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProblem(formData: FormData) {
  const user = await getOrCreateUser();

  const title = String(formData.get("title") ?? "").trim();
  const platform = String(formData.get("platform") ?? "Other");
  const platformId = String(formData.get("platformId") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  const difficulty = formData.get("difficulty") ? Number(formData.get("difficulty")) : null;

  if (!title) return;

  const problem = await prisma.problem.create({
    data: { userId: user.id, title, platform, platformId, url, difficulty },
  });

  revalidatePath("/problems");
  redirect(`/problems/${problem.id}`);
}

export async function updateProblem(id: string, formData: FormData) {
  const user = await getOrCreateUser();
  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  const title = String(formData.get("title") ?? "").trim();
  const status = String(formData.get("status") ?? "todo");
  const notes = String(formData.get("notes") ?? "");
  const solutionCode = String(formData.get("solutionCode") ?? "");
  const url = String(formData.get("url") ?? "").trim() || null;
  const difficulty = formData.get("difficulty") ? Number(formData.get("difficulty")) : null;
  const timeTakenMinutes = formData.get("timeTakenMinutes")
    ? Number(formData.get("timeTakenMinutes"))
    : null;
  const topicIds = formData.getAll("topicIds").map(String);

  await prisma.problem.update({
    where: { id },
    data: {
      title,
      status,
      notes,
      solutionCode,
      url,
      difficulty,
      timeTakenMinutes,
      solvedAt: status === "solved" && !existing.solvedAt ? new Date() : existing.solvedAt,
      topics: {
        deleteMany: {},
        create: topicIds.map((topicId) => ({ topicId })),
      },
    },
  });

  revalidatePath("/problems");
  revalidatePath(`/problems/${id}`);
}

export async function deleteProblem(id: string) {
  const user = await getOrCreateUser();
  const existing = await prisma.problem.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Not found");

  await prisma.problem.delete({ where: { id } });
  revalidatePath("/problems");
  redirect("/problems");
}