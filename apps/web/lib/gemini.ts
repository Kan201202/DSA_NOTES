import { GoogleGenAI } from "@google/genai";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function classifyProblem(input: {
  title: string;
  officialTags: string[];
  notes: string;
  code: string;
  availableTopics: { id: string; name: string }[];
}): Promise<{ topicIds: string[]; summary: string }> {
  const topicList = input.availableTopics.map((t) => `- ${t.name} (id: ${t.id})`).join("\n");

  const prompt = `You are classifying a competitive programming problem solution into algorithmic patterns from a user's personal library.

Problem title: ${input.title}
Official tags: ${input.officialTags.join(", ") || "none"}
User notes: ${input.notes || "none"}
Solution code:
\`\`\`
${input.code.slice(0, 2000)}
\`\`\`

Available topics from the user's library:
${topicList || "(none yet)"}

Return STRICT JSON with two fields:
- "topicIds": array of 1-3 topic IDs (from the available list above) that best describe the algorithmic patterns used. Empty array if none fit.
- "summary": a single sentence (max 20 words) describing the core technique.

JSON only, no prose, no markdown fences.`;

  const res = await genai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  const text = res.text ?? "";
  const cleaned = text.replace(/```json|```/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    const validIds = new Set(input.availableTopics.map((t) => t.id));
    const topicIds = (parsed.topicIds ?? []).filter((id: string) => validIds.has(id));
    return { topicIds, summary: String(parsed.summary ?? "") };
  } catch {
    return { topicIds: [], summary: "" };
  }
}

export async function embedProblem(text: string): Promise<number[]> {
  const res = await genai.models.embedContent({
    model: "gemini-embedding-001",
    contents: text,
    config: { outputDimensionality: 768 },
  });
  return res.embeddings?.[0]?.values ?? [];
}