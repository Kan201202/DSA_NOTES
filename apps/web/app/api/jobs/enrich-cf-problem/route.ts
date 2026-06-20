import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  const { problemId, platformId } = await req.json();

  // Parse CF problem ID like "1840C" -> contestId=1840, index="C"
  const match = /^(\d+)([A-Z]\d?)$/.exec(platformId);
  if (!match) {
    return NextResponse.json({ ok: false, error: "Invalid platformId" }, { status: 400 });
  }
  const [, contestId, index] = match;

  // Idempotency: if already enriched (has tags), skip
  const existing = await prisma.problem.findUnique({ where: { id: problemId } });
  if (!existing) return NextResponse.json({ ok: false, error: "Problem not found" }, { status: 404 });
  if (existing.officialTags.length > 0) {
    return NextResponse.json({ ok: true, skipped: "already enriched" });
  }

  // Hit Codeforces API
  const cfRes = await fetch(
    `https://codeforces.com/api/problemset.problems?tags=`,
    { next: { revalidate: 3600 } }
  );
  if (!cfRes.ok) {
    return NextResponse.json({ ok: false, error: "CF API failed" }, { status: 502 });
  }
  const cfData = await cfRes.json();
  if (cfData.status !== "OK") {
    return NextResponse.json({ ok: false, error: cfData.comment }, { status: 502 });
  }

  const found = cfData.result.problems.find(
    (p: any) => String(p.contestId) === contestId && p.index === index
  );
  if (!found) {
    return NextResponse.json({ ok: false, error: "Problem not in CF dataset" }, { status: 404 });
  }

  await prisma.problem.update({
    where: { id: problemId },
    data: {
      title: found.name,
      difficulty: found.rating ?? null,
      officialTags: found.tags ?? [],
      url: `https://codeforces.com/problemset/problem/${contestId}/${index}`,
    },
  });

  return NextResponse.json({ ok: true });
}

export const POST = verifySignatureAppRouter(handler);