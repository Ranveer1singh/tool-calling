# Tool-calling Todo

A small todo app where an LLM agent adds, edits and deletes tasks by calling
functions (tools) instead of the user clicking buttons. It uses the
OpenAI-compatible chat API, so any provider with a free tier works. The
default is Groq (free key, no card).

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
