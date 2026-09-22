import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Task } from "./types";

// JSON-file store. Simple and inspectable; swap for a DB later if needed.
const DATA_FILE = path.join(process.cwd(), "data", "tasks.json");

async function readAll(): Promise<Task[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw) as Task[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function writeAll(tasks: Task[]): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), "utf8");
}

export async function listTasks(): Promise<Task[]> {
  return readAll();
}

export async function addTask(input: {
  title: string;
  dueDate?: string | null;
}): Promise<Task> {
  const tasks = await readAll();
  const task: Task = {
    id: randomUUID().slice(0, 8),
    title: input.title.trim(),
    done: false,
    dueDate: input.dueDate ?? null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(task);
  await writeAll(tasks);
  return task;
}

export async function editTask(
  id: string,
  patch: { title?: string; done?: boolean; dueDate?: string | null },
): Promise<Task | null> {
  const tasks = await readAll();
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  if (patch.title !== undefined) task.title = patch.title.trim();
  if (patch.done !== undefined) task.done = patch.done;
  if (patch.dueDate !== undefined) task.dueDate = patch.dueDate;
  await writeAll(tasks);
  return task;
}

export async function deleteTask(id: string): Promise<Task | null> {
  const tasks = await readAll();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const [removed] = tasks.splice(idx, 1);
  await writeAll(tasks);
  return removed;
}
