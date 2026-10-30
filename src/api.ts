import { demoRequest, DemoError } from "./demo-store";
export type Role = "admin" | "member" | "viewer";
export type Org = { id: number; name: string; role: Role };
export type Profile = {
  id: number;
  name: string;
  email: string;
  organizations: Org[];
};
export type Member = { id: number; name: string; email: string; role: Role };
export type Dashboard = {
  clients: number;
  cases: number;
  tasks: number;
  members: number;
  done_tasks: number;
  overdue_tasks: number;
  events: { id: number; action: string; target: string; created_at: string }[];
};
export { DemoError as ApiError };
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; org?: number; signal?: AbortSignal } = {},
): Promise<T> {
  try {
    return await demoRequest<T>(path, options);
  } catch (error) {
    if (error instanceof DemoError && error.status === 401 && !["/auth/login", "/auth/register"].includes(path)) {
      window.dispatchEvent(new Event("session-expired"));
    }
    throw error;
  }
}

export type DemoConfig = {
  enabled: boolean;
  email?: string;
  password?: string;
  name?: string;
  organization_name?: string;
};
export type CaseItem = {
  id: number;
  number: string;
  title: string;
  status: string;
  kind: string;
  client_name: string;
  owner_name: string | null;
  created_at: string;
};
export type TaskItem = {
  id: number;
  title: string;
  status: string;
  due_at: string | null;
  case_id: number;
  case_title: string;
  owner_name: string | null;
};
export type CaseDetail = CaseItem & {
  tasks: TaskItem[];
  documents: { id: number; filename: string; status: string }[];
};
export type ClientItem = {
  id: number;
  name: string;
  contact: string | null;
  case_count: number;
};
