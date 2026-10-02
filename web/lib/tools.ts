import { z } from "zod";
import type OpenAI from "openai";
import { addTask, deleteTask, editTask, listTasks } from "./store";

// Each tool maps one todo operation to a function the model can call.
// Return values are strings the model reads back; errors are returned as
// text so the model can explain them to the user instead of crashing.

type TodoTool<S extends z.ZodObject> = {
  name: string;
  description: string;
  schema: S;
  run: (input: z.infer<S>) => Promise<string>;
};

function defineTool<S extends z.ZodObject>(t: TodoTool<S>) {
  return t;
}

const dueDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable()
  .describe("Due date as YYYY-MM-DD, or null if none");

export const listTasksTool = defineTool({
  name: "list_tasks",
  description:
    "List all tasks with their ids, titles, done status and due dates. " +
    "Call this first whenever you need a task id for edit or delete.",
  schema: z.object({}),
  run: async () => JSON.stringify(await listTasks()),
});

export const addTaskTool = defineTool({
  name: "add_task",
  description: "Create a new task.",
  schema: z.object({
    title: z.string().min(1).describe("Short description of the task"),
    dueDate: dueDate.optional(),
  }),
  run: async (input) => JSON.stringify(await addTask(input)),
});

export const editTaskTool = defineTool({
  name: "edit_task",
  description:
    "Update an existing task. Only the provided fields change. " +
    "Use done=true to mark a task complete.",
  schema: z.object({
    id: z.string().describe("Task id from list_tasks"),
    title: z.string().min(1).optional(),
    done: z.boolean().optional(),
    dueDate: dueDate.optional(),
  }),
  run: async ({ id, ...patch }) => {
    const task = await editTask(id, patch);
    return task ? JSON.stringify(task) : `Error: no task with id ${id}`;
  },
});

export const deleteTaskTool = defineTool({
  name: "delete_task",
  description: "Permanently delete a task by id.",
  schema: z.object({
    id: z.string().describe("Task id from list_tasks"),
  }),
  run: async ({ id }) => {
    const task = await deleteTask(id);
    return task ? `Deleted: ${JSON.stringify(task)}` : `Error: no task with id ${id}`;
  },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const todoTools: TodoTool<any>[] = [listTasksTool, addTaskTool, editTaskTool, deleteTaskTool];

/** Tool definitions in the OpenAI-compatible chat completions format. */
export const toolDefinitions: OpenAI.Chat.Completions.ChatCompletionTool[] = todoTools.map((t) => ({
  type: "function",
  function: {
    name: t.name,
    description: t.description,
    // Drop the "$schema" key: some providers reject unknown schema fields.
    parameters: withoutSchemaKey(z.toJSONSchema(t.schema)),
  },
}));

function withoutSchemaKey(schema: Record<string, unknown>): Record<string, unknown> {
  const copy = { ...schema };
  delete copy.$schema;
  return copy;
}

/** Validate the model's JSON arguments and run the matching tool. */
export async function runTool(name: string, rawArgs: string): Promise<string> {
  const tool = todoTools.find((t) => t.name === name);
  if (!tool) return `Error: unknown tool ${name}`;
  let parsed: unknown;
  try {
    parsed = rawArgs.trim() ? JSON.parse(rawArgs) : {};
  } catch {
    return `Error: arguments for ${name} were not valid JSON`;
  }
  const check = tool.schema.safeParse(parsed);
  if (!check.success) return `Error: invalid arguments for ${name}: ${check.error.message}`;
  return tool.run(check.data);
}
