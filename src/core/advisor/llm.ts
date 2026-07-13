export type LlmComplete = (prompt: string) => Promise<string>;

/** Calls the Anthropic Messages API with the user-supplied key. */
export const anthropicComplete: LlmComplete = async (prompt) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.MUSICPRODUCTIONUP_MODEL || "claude-sonnet-5",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Anthropic API error ${response.status}: ${body.slice(0, 300)}`,
    );
  }

  const data = (await response.json()) as {
    content: { type: string; text?: string }[];
  };
  const text = data.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Anthropic API returned no text content");
  return text;
};
