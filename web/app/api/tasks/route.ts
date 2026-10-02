import { listTasks } from "@/lib/store";

export async function GET() {
  return Response.json(await listTasks());
}
