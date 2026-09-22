export type Task = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null; // ISO date (YYYY-MM-DD) or null
  createdAt: string; // ISO timestamp
};

export type ToolCallTrace = {
  tool: string;
  input: unknown;
  result: string;
};

export type ChatTurn =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: ToolCallTrace[] };
