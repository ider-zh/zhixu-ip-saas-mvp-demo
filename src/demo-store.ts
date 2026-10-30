/** Browser-only demonstration. Roles are a UI simulation, not secure authorization.
 * Never store entered passwords. Non-default demo accounts accept any 10–128 character password.
 */
export class DemoError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = 'DemoError'; }
}
type Role = 'admin' | 'member' | 'viewer';
type User = { id: number; name: string; email: string };
type Organization = { id: number; name: string };
type Membership = { id: number; user_id: number; organization_id: number; role: Role };
type Client = { id: number; organization_id: number; name: string; contact: string };
type Case = { id: number; organization_id: number; client_id: number; owner_id: number; number: string; title: string; status: string; kind: string; created_at: string };
type Task = { id: number; organization_id: number; case_id: number; owner_id: number; title: string; status: 'todo' | 'done'; due_at: string };
type Document = { id: number; organization_id: number; case_id: number; filename: string; status: string };
type Audit = { id: number; organization_id: number; action: string; target: string; created_at: string };
type State = { version: 1; nextId: number; users: User[]; organizations: Organization[]; memberships: Membership[]; clients: Client[]; cases: Case[]; tasks: Task[]; documents: Document[]; events: Audit[] };
const STORAGE_KEY = 'zhixu-static-demo-v1';
const SESSION_KEY = 'zhixu-static-demo-session-v1';
const DEMO = { enabled: true, email: 'demo@zhixu.local', password: 'Demo123456!', name: '林知远', organization_name: '知序知识产权演示团队' };
const roles: Role[] = ['admin', 'member', 'viewer'];
const id = (s: State) => s.nextId++;
const timestamp = () => new Date().toISOString();
const clone = <T>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value));
function emit(name: string) { if (typeof window !== 'undefined') window.dispatchEvent(new Event(name)); }
function audit(s: State, org: number, action: string, target: string) { s.events.push({ id: id(s), organization_id: org, action, target, created_at: timestamp() }); }
function seedWorkspace(s: State, organization: Organization, user: User) {
  const org = organization.id;
  const clients = [
    ['杭州青禾智能科技有限公司（示例）', '陈工 · chen@example.com'],
    ['宁波远川新材料有限公司（示例）', '周经理 · zhou@example.com'],
    ['苏州云栈医疗科技有限公司（示例）', '李博士 · li@example.com'],
  ].map(([name, contact]) => ({ id: id(s), organization_id: org, name, contact }));
  s.clients.push(...clients);
  const titles = ['面向工业设备的异常检测方法', '低能耗温室环境控制系统', '高韧性可降解复合材料制备方法', '电池隔膜表面处理工艺', '便携式生理信号采集装置', '医学影像数据脱敏处理方法'];
  const statuses = ['materials', 'review', 'draft', 'filed', 'review', 'completed'];
  const taskTitles = ['补充技术交底中的实施示例', '内部审核技术方案描述', '确认材料清单与联系人', '核对案件归档信息', '整理专业人员反馈意见', '完成项目资料归档'];
  const offsets = [-2, 1, 3, 5, 2, -3];
  const today = new Date(); today.setUTCHours(9, 0, 0, 0);
  const days = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();
  titles.forEach((title, i) => {
    const c: Case = { id: id(s), organization_id: org, client_id: clients[Math.floor(i / 2)].id, owner_id: user.id, number: `ZX-${today.getUTCFullYear()}-${String(i + 1).padStart(3, '0')}`, title, status: statuses[i], kind: 'invention', created_at: days(i - 12) };
    s.cases.push(c);
    s.tasks.push({ id: id(s), organization_id: org, case_id: c.id, owner_id: user.id, title: taskTitles[i], status: i === 5 ? 'done' : 'todo', due_at: days(offsets[i]) });
    s.documents.push({ id: id(s), organization_id: org, case_id: c.id, filename: `${c.number}-技术交底书（示例记录，无实际文件）.pdf`, status: 'metadata_only' });
    s.events.push({ id: id(s), organization_id: org, action: '创建示例案件', target: c.number, created_at: days(i - 6) });
  });
  audit(s, org, '初始化演示工作区', '3 客户 / 6 案件 / 6 任务（示例）');
}
function freshState(): State {
  const s: State = { version: 1, nextId: 1, users: [], organizations: [], memberships: [], clients: [], cases: [], tasks: [], documents: [], events: [] };
  const user = { id: id(s), name: DEMO.name, email: DEMO.email };
  const org = { id: id(s), name: DEMO.organization_name };
  s.users.push(user); s.organizations.push(org);
  s.memberships.push({ id: id(s), user_id: user.id, organization_id: org.id, role: 'admin' });
  seedWorkspace(s, org, user);
  return s;
}
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const positive = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v > 0;
const string = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const date = (v: unknown) => string(v) && Number.isFinite(Date.parse(v));
function validState(value: unknown): value is State {
  if (!object(value) || value.version !== 1 || !positive(value.nextId)) return false;
  const fields: Record<string, string[]> = {
    users: ['name', 'email'], organizations: ['name'], memberships: ['role'], clients: ['name', 'contact'],
    cases: ['number', 'title', 'status', 'kind', 'created_at'], tasks: ['title', 'status', 'due_at'], documents: ['filename', 'status'], events: ['action', 'target', 'created_at'],
  };
  const allIds = new Set<number>();
  for (const [table, strings] of Object.entries(fields)) {
    const rows = value[table];
    if (!Array.isArray(rows)) return false;
    for (const row of rows) {
      if (!object(row) || !positive(row.id) || allIds.has(row.id) || row.id >= value.nextId || strings.some(k => !string(row[k]))) return false;
      allIds.add(row.id);
      if (table !== 'users' && table !== 'organizations' && !positive(row.organization_id)) return false;
      if (['cases', 'events'].includes(table) && !date(row.created_at)) return false;
      if (table === 'tasks' && (!date(row.due_at) || !['todo', 'done'].includes(String(row.status)))) return false;
      if (table === 'memberships' && (!positive(row.user_id) || !roles.includes(row.role as Role))) return false;
    }
  }
  const s = value as unknown as State;
  if (!s.users.length || !s.organizations.length) return false;
  const users = new Set(s.users.map(u => u.id)); const orgs = new Set(s.organizations.map(o => o.id));
  if (new Set(s.users.map(u => u.email)).size !== s.users.length) return false;
  if (new Set(s.memberships.map(m => `${m.organization_id}:${m.user_id}`)).size !== s.memberships.length) return false;
  const hasMember = (org: number, user: number) => s.memberships.some(m => m.organization_id === org && m.user_id === user);
  if (s.memberships.some(m => !orgs.has(m.organization_id) || !users.has(m.user_id))) return false;
  if (s.organizations.some(o => !s.memberships.some(m => m.organization_id === o.id && m.role === 'admin'))) return false;
  for (const rows of [s.clients, s.cases, s.tasks, s.documents, s.events]) if (rows.some(row => !orgs.has(row.organization_id))) return false;
  if (s.cases.some(c => !s.clients.some(v => v.id === c.client_id && v.organization_id === c.organization_id) || !hasMember(c.organization_id, c.owner_id))) return false;
  for (const row of [...s.tasks, ...s.documents]) if (!s.cases.some(c => c.id === row.case_id && c.organization_id === row.organization_id)) return false;
  if (s.tasks.some(t => !hasMember(t.organization_id, t.owner_id))) return false;
  return true;
}
function storageFailure(): never { throw new DemoError(503, '无法访问浏览器存储。请允许本站使用本地存储，并检查存储空间后重试。'); }
function save(s: State) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { storageFailure(); } }
function clearSession() { try { sessionStorage.removeItem(SESSION_KEY); } catch { storageFailure(); } }
function load(): State {
  let raw: string | null;
  try { raw = localStorage.getItem(STORAGE_KEY); } catch { return storageFailure(); }
  if (raw !== null) {
    try { const state: unknown = JSON.parse(raw); if (validState(state)) return state; } catch { /* Recover malformed JSON using a fresh demo. */ }
  }
  const state = freshState(); save(state); clearSession();
  if (raw !== null) emit('demo-storage-recovered');
  return state;
}
function setSession(user: User) { try { sessionStorage.setItem(SESSION_KEY, String(user.id)); } catch { storageFailure(); } }
function currentUser(s: State) {
  let raw: string | null;
  try { raw = sessionStorage.getItem(SESSION_KEY); } catch { return storageFailure(); }
  const user = s.users.find(u => u.id === Number(raw));
  if (!user) { clearSession(); throw new DemoError(401, '请登录演示工作空间'); }
  return user;
}
function profile(s: State, user: User) { return { ...user, organizations: s.memberships.filter(m => m.user_id === user.id).map(m => ({ ...s.organizations.find(o => o.id === m.organization_id)!, role: m.role })) }; }
function bodyObject(value: unknown): Record<string, unknown> { if (!object(value)) throw new DemoError(422, '请输入有效表单'); return value; }
function textField(body: Record<string, unknown>, field: string, label: string, max: number) { const v = body[field]; if (typeof v !== 'string' || !v.trim() || v.trim().length > max) throw new DemoError(422, `请输入有效${label}`); return v.trim(); }
function credentials(body: Record<string, unknown>) {
  const email = textField(body, 'email', '邮箱', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DemoError(422, '请输入有效邮箱');
  if (typeof body.password !== 'string' || body.password.length < 10 || body.password.length > 128) throw new DemoError(422, '密码需为 10–128 位（演示输入，不保存）');
  return { email, password: body.password };
}
function roleField(body: Record<string, unknown>, defaultRole?: Role): Role { const r = body.role ?? defaultRole; if (!roles.includes(r as Role)) throw new DemoError(422, '无效角色'); return r as Role; }
function caseData(s: State, c: Case) { return { id: c.id, number: c.number, title: c.title, status: c.status, kind: c.kind, client_name: s.clients.find(v => v.id === c.client_id)!.name, owner_name: s.users.find(u => u.id === c.owner_id)?.name ?? null, created_at: c.created_at }; }
function taskData(s: State, t: Task) { return { id: t.id, title: t.title, status: t.status, due_at: t.due_at, case_id: t.case_id, case_title: s.cases.find(c => c.id === t.case_id)!.title, owner_name: s.users.find(u => u.id === t.owner_id)?.name ?? null }; }

/** Restores the public sample workspace; clears all locally entered demo data and current session. */
export function resetDemo(): void {
  save(freshState()); clearSession();
  try { localStorage.removeItem('zhixu-static-demo:organization'); } catch { storageFailure(); }
  emit('demo-reset'); emit('session-expired');
}

export async function demoRequest<T>(path: string, options: { method?: string; body?: unknown; org?: number; signal?: AbortSignal } = {}): Promise<T> {
  if (options.signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
  const method = (options.method ?? 'GET').toUpperCase();
  const result = route(path, method, options.body, options.org);
  return clone(result) as T;
}
function route(path: string, method: string, body: unknown, orgId?: number): unknown {
  if (path === '/demo/config' && method === 'GET') return { ...DEMO };
  const s = load();
  if (path === '/auth/logout' && method === 'POST') { clearSession(); return undefined; }
  if (path === '/auth/login' && method === 'POST') {
    const c = credentials(bodyObject(body)); const user = s.users.find(u => u.email === c.email);
    if (!user || (user.email === DEMO.email && c.password !== DEMO.password)) throw new DemoError(401, '演示邮箱或密码错误');
    setSession(user); return profile(s, user);
  }
  if (path === '/auth/register' && method === 'POST') {
    const b = bodyObject(body); const { email } = credentials(b);
    const name = textField(b, 'name', '姓名', 80); const orgName = textField(b, 'organization_name', '组织名称', 100);
    if (s.users.some(u => u.email === email)) throw new DemoError(409, '此演示邮箱已注册');
    const user = { id: id(s), email, name }; const org = { id: id(s), name: orgName };
    s.users.push(user); s.organizations.push(org); s.memberships.push({ id: id(s), user_id: user.id, organization_id: org.id, role: 'admin' });
    seedWorkspace(s, org, user); save(s); setSession(user); return profile(s, user);
  }
  if (path === '/auth/me' && method === 'GET') return profile(s, currentUser(s));
  if (path === '/organizations' && method === 'POST') {
    const user = currentUser(s); const name = textField(bodyObject(body), 'name', '组织名称', 100);
    const org = { id: id(s), name }; s.organizations.push(org); s.memberships.push({ id: id(s), user_id: user.id, organization_id: org.id, role: 'admin' });
    seedWorkspace(s, org, user); save(s); return profile(s, user);
  }
  const known = (['/members', '/dashboard', '/cases', '/clients', '/tasks'].includes(path) && method === 'GET') || (path === '/members' && method === 'POST') || (/^\/(members|tasks)\/\d+$/.test(path) && method === 'PATCH') || (/^\/cases\/\d+$/.test(path) && method === 'GET');
  if (!known) throw new DemoError(404, '演示功能不存在');
  const user = currentUser(s); const member = s.memberships.find(m => m.user_id === user.id && m.organization_id === orgId);
  if (!member) throw new DemoError(403, '无权访问此演示组织');
  const org = member.organization_id;
  if (path === '/members' && method === 'GET') return s.memberships.filter(m => m.organization_id === org).map(m => ({ ...s.users.find(u => u.id === m.user_id)!, role: m.role }));
  if (path === '/members' && method === 'POST') {
    if (member.role !== 'admin') throw new DemoError(403, '仅演示管理员可操作');
    const b = bodyObject(body); const { email } = credentials(b); const name = textField(b, 'name', '姓名', 80); const role = roleField(b, 'member');
    if (s.users.some(u => u.email === email)) throw new DemoError(409, '邮箱已存在，演示版仅支持创建新成员');
    const added = { id: id(s), name, email }; s.users.push(added); s.memberships.push({ id: id(s), user_id: added.id, organization_id: org, role });
    audit(s, org, '新增成员', name); save(s); return { ...added, role };
  }
  if (path.startsWith('/members/') && method === 'PATCH') {
    if (member.role !== 'admin') throw new DemoError(403, '仅演示管理员可操作');
    const targetId = Number(path.split('/')[2]); const target = s.memberships.find(m => m.user_id === targetId && m.organization_id === org);
    if (!target) throw new DemoError(404, '成员不存在');
    const role = roleField(bodyObject(body));
    if (target.role === 'admin' && role !== 'admin' && s.memberships.filter(m => m.organization_id === org && m.role === 'admin').length <= 1) throw new DemoError(409, '必须保留至少一位管理员');
    target.role = role; audit(s, org, '修改角色', `${targetId} → ${role}`); save(s); return { id: targetId, role };
  }
  const cases = s.cases.filter(c => c.organization_id === org); const tasks = s.tasks.filter(t => t.organization_id === org); const clients = s.clients.filter(c => c.organization_id === org);
  if (path === '/dashboard') {
    const now = Date.now();
    return { clients: clients.length, cases: cases.length, tasks: tasks.length, members: s.memberships.filter(m => m.organization_id === org).length, done_tasks: tasks.filter(t => t.status === 'done').length,
      overdue_tasks: tasks.filter(t => t.status === 'todo' && Date.parse(t.due_at) < now).length,
      upcoming_tasks: tasks.filter(t => t.status === 'todo' && Date.parse(t.due_at) >= now && Date.parse(t.due_at) <= now + 7 * 86400000).length,
      events: s.events.filter(e => e.organization_id === org).sort((a, b) => b.id - a.id).slice(0, 8).map(({ id, action, target, created_at }) => ({ id, action, target, created_at })) };
  }
  if (path === '/cases') return [...cases].reverse().map(c => caseData(s, c));
  if (path.startsWith('/cases/')) {
    const c = cases.find(c => c.id === Number(path.split('/')[2])); if (!c) throw new DemoError(404, '案件不存在');
    return { ...caseData(s, c), tasks: tasks.filter(t => t.case_id === c.id).map(t => taskData(s, t)), documents: s.documents.filter(d => d.organization_id === org && d.case_id === c.id).map(({ id, filename, status }) => ({ id, filename, status })) };
  }
  if (path === '/clients') return clients.map(c => ({ id: c.id, name: c.name, contact: c.contact, case_count: cases.filter(v => v.client_id === c.id).length }));
  if (path === '/tasks') return [...tasks].sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at)).map(t => taskData(s, t));
  if (path.startsWith('/tasks/') && method === 'PATCH') {
    if (member.role === 'viewer') throw new DemoError(403, '只读成员不能修改任务');
    const target = tasks.find(t => t.id === Number(path.split('/')[2])); if (!target) throw new DemoError(404, '任务不存在');
    const status = bodyObject(body).status; if (status !== 'todo' && status !== 'done') throw new DemoError(422, '无效任务状态');
    if (target.status !== status) { target.status = status; audit(s, org, '更新任务状态', `${target.id} → ${status}`); save(s); }
    return { id: target.id, status: target.status };
  }
  throw new DemoError(404, '演示功能不存在');
}
