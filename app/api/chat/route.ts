import OpenAI from "openai";
import { runTool, toolDefinitions } from "@/lib/tools";
import type { ChatTurn, ToolCallTrace } from "@/lib/types";

type Msg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

// Any OpenAI-compatible provider works. Defaults target Groq's free tier.
// Gemini:     LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/  LLM_MODEL=gemini-3.6-flash
// OpenRouter: LLM_BASE_URL=https://openrouter.ai/api/v1  LLM_MODEL=<any free model>
const BASE_URL = process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1";
const MODEL = process.env.LLM_MODEL ?? "llama-3.3-70b-versatile";
const MAX_ITERATIONS = 10;

const SYSTEM_PROMPT = `You are a todo assistant. You manage the user's daily tasks
using the provided tools. Today's date is ${new Date().toISOString().slice(0, 10)}.

Rules:
- Use list_tasks to find task ids before editing or deleting. Never guess an id.
- If a request is ambiguous (e.g. several tasks match), ask which one.
- Do the work with tools, then confirm briefly in plain text what changed.
- Do not describe tool calls; just report the outcome.`;

export async function POST(request: Request) {
  const { messages } = (await request.json()) as { messages: ChatTurn[] };
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages[] is required" }, { status: 400 });
  }
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "LLM_API_KEY is not set. Copy .env.example to .env.local and add a key." },
      { status: 401 },
    );
  }
  const client = new OpenAI({ apiKey, baseURL: BASE_URL });

  // The UI keeps a plain-text transcript; the model only needs role + text.
  const history: Msg[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m): Msg => ({ role: m.role, content: m.content })),
  ];
  const toolCalls: ToolCallTrace[] = [];

  try {
    // Agent loop: ask the model, run any tools it requests, feed results back,
    // repeat until it answers in plain text.
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const completion = await client.chat.completions.create({
        model: MODEL, 
        messages: history,
        tools: toolDefinitions,
        tool_choice: "auto",
      });
      const msg = completion.choices[0]?.message;
      if (!msg) throw new Error("Empty response from model");
      history.push(msg);

      const calls = (msg.tool_calls ?? []).filter((c) => c.type === "function");
      if (calls.length === 0) {
        return Response.json({
          reply: msg.content?.trim() || "(no reply)",
          toolCalls,
          finishReason: completion.choices[0].finish_reason,
        });
      }

      // Run every requested tool and return all results before the next call.
      for (const call of calls) {
        const result = await runTool(call.function.name, call.function.arguments);
        toolCalls.push({
          tool: call.function.name,
          input: safeJson(call.function.arguments),
          result,
        });
        history.push({ role: "tool", tool_call_id: call.id, content: result });
      }
    }
    return Response.json(
      { reply: "I stopped after too many steps. Please try a simpler request.", toolCalls },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof OpenAI.AuthenticationError) {
      return Response.json({ error: "Invalid LLM_API_KEY for the configured provider." }, { status: 401 });
    }
    if (err instanceof OpenAI.RateLimitError) {
      return Response.json({ error: "Rate limited by the provider, try again shortly." }, { status: 429 });
    }
    if (err instanceof OpenAI.APIError) {
      return Response.json({ error: err.message }, { status: err.status ?? 500 });
    }
    throw err;
  }
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
