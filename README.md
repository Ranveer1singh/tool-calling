# Tool-calling Todo

A small todo app where an LLM agent adds, edits and deletes tasks by calling
functions (tools) instead of the user clicking buttons. It uses the
OpenAI-compatible chat API, so any provider with a free tier works. The
default is Groq (free key, no card).

![Demo: a natural-language request turning into tool calls](docs/demo.gif)

<!-- Record with QuickTime or Kap, export as docs/demo.gif (keep under ~5 MB). -->

## Setup

```bash
cp .env.example .env.local   # add your LLM_API_KEY (Groq by default)
pnpm install
pnpm dev                     # http://localhost:3000
```

## How it works

| File | Role |
| --- | --- |
| `lib/types.ts` | Shared `Task` and chat types |
| `lib/store.ts` | JSON-file task store (`data/tasks.json`) |
| `lib/tools.ts` | Tool definitions: `list_tasks`, `add_task`, `edit_task`, `delete_task` |
| `app/api/chat/route.ts` | Agent loop: call model, run requested tools, feed results back, repeat |
| `app/api/tasks/route.ts` | `GET` tasks for the UI |
| `app/page.tsx` | Task list + chat UI, shows which tools were called |

Flow: user message -> `/api/chat` -> the model decides which tool to call ->
tool runs against the store -> result goes back to the model -> plain-text reply.
The UI refetches the task list after every reply.

## What I learned

I built this to understand how LLM agents call functions, without a framework
hiding the mechanics.

- **The model never runs anything.** It only proposes a tool name and JSON
  arguments. My code decides whether to execute, runs it, and sends the result
  back. The "agent" is a plain loop in `app/api/chat/route.ts`.
- **Validate everything the model sends.** Arguments arrive as a string that
  may not be valid JSON, may miss required fields, or may use the wrong types.
  Every tool's input goes through a Zod schema before it touches the store.
- **Return errors as text, not exceptions.** If a tool fails (bad id, invalid
  arguments), the error string goes back to the model so it can correct itself
  or explain the problem. Throwing would kill the whole request.
- **Prompt rules come from watching failures.** "Call `list_tasks` before
  editing, never guess an id" exists because the model guessed ids. "Ask when
  several tasks match" exists because it deleted the wrong one.
- **Always cap the loop.** A model can keep requesting tools forever.
  `MAX_ITERATIONS` stops runaway calls and returns a clear message.
- **One client, many providers.** Groq, Gemini and OpenRouter all speak the
  OpenAI chat completions format, so switching is two env vars.

## Next steps

- Stream the reply so long answers show up token by token
- Detect the model calling the same tool with the same arguments repeatedly
- Replace the JSON file with SQLite and add tests around the tool layer
- Add a confirmation step before destructive tools like `delete_task`
