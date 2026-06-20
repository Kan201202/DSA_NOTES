import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";
import { classifyProblem, embedProblem } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  const { problemId } = await req.json();

  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: { topics: true },
  });
  if (!problem) {
    return NextResponse.json({ ok: false, error: "Problem not found" }, { status: 404 });
  }

  // Skip if no code yet (nothing to classify)
  if (!problem.solutionCode || problem.solutionCode.trim().length < 20) {
    return NextResponse.json({ ok: true, skipped: "no code" });
  }

  const availableTopics = await prisma.topic.findMany({
    where: { userId: problem.userId },
    select: { id: true, name: true },
  });

  // 1. Classify into topics + generate summary
  const { topicIds, summary } = await classifyProblem({
    title: problem.title,
    officialTags: problem.officialTags,
    notes: problem.notes ?? "",
    code: problem.solutionCode,
    availableTopics,
  });

  // 2. Generate embedding for similarity search
  const embeddingText = `${problem.title}\n\nTags: ${problem.officialTags.join(", ")}\n\nNotes: ${problem.notes ?? ""}\n\nCode:\n${problem.solutionCode.slice(0, 2000)}`;
  const embedding = await embedProblem(embeddingText);

  // 3. Update problem
  await prisma.problem.update({
    where: { id: problemId },
    data: {
      aiSummary: summary,
      topics: {
        // Merge: keep existing user-set topics, add AI-suggested ones (deduped)
        upsert: topicIds.map((topicId) => ({
          where: { problemId_topicId: { problemId, topicId } },
          create: { topicId },
          update: {},
        })),
      },
    },
  });

  // pgvector update via raw SQL (Prisma doesn't natively support vector type)
  if (embedding.length === 768) {
    const vectorString = `[${embedding.join(",")}]`;
    await prisma.$executeRawUnsafe(
      `UPDATE "Problem" SET embedding = $1::vector WHERE id = $2`,
      vectorString,
      problemId
    );
  }

  return NextResponse.json({ ok: true, topicIds, summary });
}

export const POST = verifySignatureAppRouter(handler);