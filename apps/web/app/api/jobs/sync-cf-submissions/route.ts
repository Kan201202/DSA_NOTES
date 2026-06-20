import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function handler(req: NextRequest) {
  const { userId } = await req.json();

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.cfHandle) {
    return NextResponse.json({ ok: false, error: "No CF handle" }, { status: 400 });
  }

  // Fetch last 100 submissions
  const res = await fetch(
    `https://codeforces.com/api/user.status?handle=${encodeURIComponent(user.cfHandle)}&from=1&count=100`
  );
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: "CF API failed" }, { status: 502 });
  }
  const data = await res.json();
  if (data.status !== "OK") {
    return NextResponse.json({ ok: false, error: data.comment }, { status: 502 });
  }

  // Filter to AC submissions, dedupe by problem
  const acceptedByProblem = new Map<string, any>();
  for (const sub of data.result) {
    if (sub.verdict !== "OK") continue;
    const key = `${sub.problem.contestId}${sub.problem.index}`;
    if (!acceptedByProblem.has(key)) acceptedByProblem.set(key, sub);
  }

  let updated = 0;
  let created = 0;

  for (const [platformId, sub] of acceptedByProblem) {
    const existing = await prisma.problem.findFirst({
      where: { userId, platform: "CF", platformId },
    });

    if (existing) {
      if (existing.status !== "solved") {
        await prisma.problem.update({
          where: { id: existing.id },
          data: {
            status: "solved",
            solvedAt: existing.solvedAt ?? new Date(sub.creationTimeSeconds * 1000),
          },
        });
        updated++;
      }
    } else {
      // Auto-create the problem
      await prisma.problem.create({
        data: {
          userId,
          platform: "CF",
          platformId,
          title: sub.problem.name,
          difficulty: sub.problem.rating ?? null,
          officialTags: sub.problem.tags ?? [],
          url: `https://codeforces.com/problemset/problem/${sub.problem.contestId}/${sub.problem.index}`,
          status: "solved",
          solvedAt: new Date(sub.creationTimeSeconds * 1000),
        },
      });
      created++;
    }
  }

  return NextResponse.json({ ok: true, userId, updated, created });
}

export const POST = verifySignatureAppRouter(handler);