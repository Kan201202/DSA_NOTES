import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { Client } from "@upstash/qstash";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

async function handler(_req: NextRequest) {
  const users = await prisma.user.findMany({
    where: { cfHandle: { not: null } },
    select: { id: true },
  });

  const qstash = new Client({ token: process.env.QSTASH_TOKEN! });
  const baseUrl = process.env.APP_URL!;

  for (const u of users) {
    await qstash.publishJSON({
      url: `${baseUrl}/api/jobs/sync-cf-submissions`,
      body: { userId: u.id },
      retries: 2,
    });
  }

  return NextResponse.json({ ok: true, enqueued: users.length });
}

export const POST = verifySignatureAppRouter(handler);