import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  Card,
  ConfigProvider,
  Form,
  Input,
  Layout,
  Menu,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Typography,
} from "antd";
import zhCN from "antd/locale/zh_CN";
import {
  ApartmentOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  DashboardOutlined,
  LogoutOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  FolderOpenOutlined,
  ContactsOutlined,
  CheckSquareOutlined,
} from "@ant-design/icons";
import {
  api,
  ApiError,
  type Profile,
  type Member,
  type Dashboard,
  type Role,
  type DemoConfig,
} from "./api";
import "./style.css";
import DemoWorkspace from "./DemoWorkspace";
import { resetDemo } from "./demo-store";
import ProjectGoalModal from "./ProjectGoalModal";
const uniqueDemoEmail = () => {
  const values = crypto.getRandomValues(new Uint32Array(4));
  const id = Array.from(values, (value) =>
    value.toString(16).padStart(8, "0"),
  ).join("-");
  return `demo-${id}@example.com`;
};
const roles = { admin: "管理员", member: "经办人", viewer: "只读成员" };
const roleOptions = Object.entries(roles).map(([value, label]) => ({
  value,
  label,
}));
const errorText = (e: unknown) =>
  e instanceof Error ? e.message : "操作失败，请稍后重试";

function Auth({ onSuccess }: { onSuccess: (user: Profile) => void }) {
  const [tab, setTab] = useState("login");
  const [demo, setDemo] = useState<DemoConfig>();
  const [registerEmail, setRegisterEmail] = useState(uniqueDemoEmail);
  useEffect(() => {
    const controller = new AbortController();
    api<DemoConfig>("/demo/config", { signal: controller.signal })
      .then((d) => {
        if (!controller.signal.aborted) setDemo(d);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (values: Record<string, string>) => {
    setBusy(true);
    setError("");
    try {
      onSuccess(
        await api<Profile>(`/auth/${tab}`, { method: "POST", body: values }),
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand">
          <span className="brand-mark">序</span>知序 <small>IP WORKSPACE</small>
        </div>
        <div className="story-content">
          <div className="eyebrow">让专业协作，更有条理</div>
          <h1>
            每一份创新，
            <br />
            都有清晰的下一步。
          </h1>
          <p>
            连接团队、案件与材料，让知识产权工作
            <br />
            从分散的信息，走向有序的协作。
          </p>
          <Space size={24} wrap>
            <span>
              <CheckCircleOutlined /> 团队协作
            </span>
            <span>
              <SafetyCertificateOutlined /> 组织切换体验
            </span>
          </Space>
        </div>
        <div className="auth-footer">
          知序 · 知识产权协作平台 / 前端交互演示
        </div>
      </section>
      <section className="auth-form">
        <div className="auth-box">
          <Tag color="cyan">团队工作空间</Tag>
          <Typography.Title level={2}>
            {tab === "login" ? "欢迎回来" : "开启团队协作"}
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            {tab === "login"
              ? "登录你的账号，继续今天的工作。"
              : "创建账号与首个组织，你将成为团队管理员。"}
          </Typography.Paragraph>
          <Tabs
            activeKey={tab}
            onChange={(v) => {
              if (!busy) {
                if (v === "register") setRegisterEmail(uniqueDemoEmail());
                setTab(v);
                setError("");
              }
            }}
            items={[
              { key: "login", label: "账号登录" },
              { key: "register", label: "创建团队" },
            ]}
          />
          {error && (
            <Alert
              type="error"
              showIcon
              message={error}
              style={{ marginBottom: 20 }}
            />
          )}
          {demo?.enabled && (
            <Alert
              style={{ marginBottom: 16 }}
              type="info"
              showIcon
              message="MVP DEMO · 前端演示 · 数据仅保存在此浏览器"
              description="登录与权限为交互模拟。表单已预填，可直接体验；注册会创建独立样例团队，请勿填写真实信息或真实密码。"
            />
          )}
          <Form
            key={`${tab}-${demo?.enabled ? "demo" : "normal"}`}
            initialValues={
              demo?.enabled
                ? tab === "login"
                  ? { email: demo.email, password: demo.password }
                  : {
                      name: demo.name,
                      organization_name: demo.organization_name,
                      email: registerEmail,
                      password: demo.password,
                    }
                : undefined
            }
            layout="vertical"
            onFinish={submit}
            requiredMark={false}
          >
            {tab === "register" && (
              <>
                <Form.Item
                  name="name"
                  label="你的姓名"
                  rules={[
                    { required: true, whitespace: true, message: "请输入姓名" },
                  ]}
                >
                  <Input maxLength={80} placeholder="怎么称呼你" />
                </Form.Item>
                <Form.Item
                  name="organization_name"
                  label="组织名称"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: "请输入组织名称",
                    },
                  ]}
                >
                  <Input maxLength={100} placeholder="例如：创新知识产权团队" />
                </Form.Item>
              </>
            )}
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, type: "email", message: "请输入有效邮箱" },
              ]}
            >
              <Input
                autoComplete="email"
                placeholder="name@company.com"
                maxLength={254}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="密码"
              rules={[
                {
                  required: true,
                  min: 10,
                  max: 128,
                  message: "密码需为 10–128 位",
                },
              ]}
            >
              <Input.Password
                autoComplete={
                  tab === "login" ? "current-password" : "new-password"
                }
                placeholder="至少 10 位"
                maxLength={128}
              />
            </Form.Item>
            <Button
              block
              type="primary"
              htmlType="submit"
              loading={busy}
              size="large"
            >
              {tab === "login" ? "进入工作台" : "创建团队并登录"}{" "}
              <ArrowRightOutlined />
            </Button>
          </Form>
          <p className="muted auth-note">为知识产权团队打造的专属协作空间。</p>
        </div>
      </section>
    </div>
  );
}

function Workspace({
  user,
  setUser,
}: {
  user: Profile;
  setUser: (u: Profile | null) => void;
}) {
  const { message, modal } = AntApp.useApp();
  const [orgId, setOrgId] = useState(() => {
    const saved = Number(
      localStorage.getItem("zhixu-static-demo:organization"),
    );
    return user.organizations.some((o) => o.id === saved)
      ? saved
      : user.organizations[0]?.id;
  });
  const org =
    user.organizations.find((o) => o.id === orgId) ?? user.organizations[0];
  const activeOrg = useRef(orgId);
  activeOrg.current = orgId;
  const [loadedOrgId, setLoadedOrgId] = useState<number>();
  const [page, setPage] = useState("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [memberOpen, setMemberOpen] = useState(false);
  const [orgOpen, setOrgOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberForm] = Form.useForm();
  const [orgForm] = Form.useForm();
  const [demo, setDemo] = useState<DemoConfig>();
  useEffect(() => {
    const controller = new AbortController();
    api<DemoConfig>("/demo/config", { signal: controller.signal })
      .then((d) => {
        if (!controller.signal.aborted) setDemo(d);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  const enterDemo = async () => {
    if (!demo?.enabled) return;
    setSaving(true);
    try {
      const profile = await api<Profile>("/auth/login", {
        method: "POST",
        body: { email: demo.email, password: demo.password },
      });
      const selected = profile.organizations[0]?.id;
      localStorage.setItem("zhixu-static-demo:organization", String(selected));
      setUser(profile);
      setOrgId(selected);
      setPage("dashboard");
      setRevision((r) => r + 1);
    } catch (e) {
      message.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };
  const pageTitles: Record<string, string> = {
    dashboard: "工作台",
    cases: "案件项目",
    clients: "客户档案",
    tasks: "任务清单",
    members: "团队成员",
    organization: "组织设置",
  };
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setDashboard(undefined);
    setMembers([]);
    localStorage.setItem("zhixu-static-demo:organization", String(orgId));
    Promise.all([
      api<Dashboard>("/dashboard", { org: orgId, signal: controller.signal }),
      api<Member[]>("/members", { org: orgId, signal: controller.signal }),
    ])
      .then(([d, m]) => {
        if (!controller.signal.aborted) {
          setDashboard(d);
          setMembers(m);
          setLoadedOrgId(orgId);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(errorText(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [orgId, revision]);
  const refresh = async () => {
    const me = await api<Profile>("/auth/me");
    setUser(me);
    setRevision((r) => r + 1);
  };
  const switchOrg = (nextId: number) => {
    if (saving) return;
    setMemberOpen(false);
    setOrgOpen(false);
    memberForm.resetFields();
    setOrgId(nextId);
  };
  useEffect(() => {
    if (!user.organizations.some((o) => o.id === orgId))
      setOrgId(user.organizations[0]?.id);
  }, [user.organizations, orgId]);
  const addMember = async (values: unknown) => {
    const targetOrgId = orgId;
    setSaving(true);
    try {
      await api("/members", { method: "POST", org: targetOrgId, body: values });
      if (activeOrg.current === targetOrgId) {
        setMemberOpen(false);
        memberForm.resetFields();
      }
      await refresh();
      message.success("成员账号已创建");
    } catch (e) {
      message.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };
  const addOrg = async (values: unknown) => {
    setSaving(true);
    try {
      const me = await api<Profile>("/organizations", {
        method: "POST",
        body: values,
      });
      setUser(me);
      setOrgId(me.organizations[me.organizations.length - 1].id);
      setOrgOpen(false);
      orgForm.resetFields();
      message.success("新组织已创建");
    } catch (e) {
      message.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };
  const updateRole = async (id: number, role: Role) => {
    setSaving(true);
    try {
      await api(`/members/${id}`, {
        method: "PATCH",
        org: orgId,
        body: { role },
      });
      await refresh();
      message.success("角色已更新");
    } catch (e) {
      message.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };
  const confirmReset = () =>
    modal.confirm({
      title: "重置此浏览器中的演示数据？",
      content:
        "将删除本应用保存的演示账号、组织、任务和登录状态，并恢复初始样例。此操作无法撤销。",
      okText: "确认重置",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () => {
        resetDemo();
        window.location.reload();
      },
    });
  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
      setUser(null);
    } catch (e) {
      message.error(errorText(e));
    }
  };
  return (
    <Layout className="workspace">
      <Layout.Sider
        width={232}
        breakpoint="lg"
        collapsedWidth={64}
        theme="light"
      >
        <div className="sidebar-brand">
          <span className="brand-mark">序</span>
          <span>知序</span>
        </div>
        <div className="nav-caption">工作空间</div>
        <Menu
          selectedKeys={[page]}
          onClick={({ key }) => setPage(key)}
          items={[
            { key: "dashboard", icon: <DashboardOutlined />, label: "工作台" },
            { key: "cases", icon: <FolderOpenOutlined />, label: "案件项目" },
            { key: "clients", icon: <ContactsOutlined />, label: "客户档案" },
            { key: "tasks", icon: <CheckSquareOutlined />, label: "任务清单" },
            { key: "members", icon: <TeamOutlined />, label: "团队成员" },
            {
              key: "organization",
              icon: <ApartmentOutlined />,
              label: "组织设置",
            },
          ]}
        />
        <div className="sidebar-bottom">
          <Tag color="cyan">MVP DEMO</Tag>
          <p>让创新有序生长</p>
        </div>
      </Layout.Sider>
      <Layout>
        <Layout.Header className="topbar">
          <Space>
            <span className="muted">当前组织</span>
            <Select
              aria-label="切换组织"
              value={orgId}
              onChange={switchOrg}
              disabled={saving}
              style={{ minWidth: 180, maxWidth: 280 }}
              options={user.organizations.map((o) => ({
                value: o.id,
                label: o.name,
              }))}
            />
          </Space>
          <Space>
            <Avatar style={{ background: "#dbece7", color: "#175b50" }}>
              {user.name.slice(0, 1)}
            </Avatar>
            <span>{user.name}</span>
            <Button
              type="text"
              aria-label="退出登录"
              icon={<LogoutOutlined />}
              onClick={logout}
            />
          </Space>
        </Layout.Header>
        <Layout.Content className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                WORKSPACE /{" "}
                {page === "dashboard"
                  ? "OVERVIEW"
                  : page === "members"
                    ? "TEAM"
                    : "SETTINGS"}
              </div>
              <h1>{pageTitles[page]}</h1>
              <p className="muted">
                {page === "dashboard"
                  ? `${user.name}，欢迎回来。这里是团队工作的起点。`
                  : page === "members"
                    ? "清晰的角色分工，让协作顺畅开展。"
                    : page === "organization"
                      ? "管理工作空间，保持团队数据独立。"
                      : "围绕客户与专利案件，查看材料和推进任务。"}
              </p>
            </div>
            <Tag color="green">{roles[org.role]}</Tag>
          </div>
          {demo?.enabled && (
            <Alert
              style={{ marginBottom: 20 }}
              type="info"
              showIcon
              message="MVP DEMO · 前端演示 · 数据仅保存在此浏览器；登录与权限为交互模拟。"
              description="可以浏览案件、推进任务，或进入预置演示空间。这里的修改仅影响当前浏览器，不会与其他访客共享。"
              action={
                <Button size="small" loading={saving} onClick={enterDemo}>
                  进入预置演示空间
                </Button>
              }
            />
          )}
          {error ? (
            <Alert
              type="error"
              showIcon
              message={error}
              action={
                <Button onClick={() => setRevision((r) => r + 1)}>重试</Button>
              }
            />
          ) : (
            <Spin spinning={busy || loadedOrgId !== orgId}>
              <div style={{ minHeight: 240 }}>
                {loadedOrgId === orgId && (
                  <>
                    {["dashboard", "cases", "clients", "tasks"].includes(
                      page,
                    ) && (
                      <DemoWorkspace
                        key={orgId}
                        orgId={orgId}
                        role={org.role}
                        page={page}
                        dashboard={dashboard}
                        revision={revision}
                        refresh={() => setRevision((r) => r + 1)}
                      />
                    )}
                    {page === "members" && (
                      <Card
                        title={`成员列表 · ${members.length}`}
                        extra={
                          org.role === "admin" && (
                            <Button
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => setMemberOpen(true)}
                            >
                              新增成员
                            </Button>
                          )
                        }
                      >
                        <Table
                          rowKey="id"
                          dataSource={members}
                          pagination={{ pageSize: 10 }}
                          scroll={{ x: 650 }}
                          columns={[
                            {
                              title: "成员",
                              dataIndex: "name",
                              render: (name: string, row: Member) => (
                                <Space>
                                  <Avatar>{name.slice(0, 1)}</Avatar>
                                  <strong>{name}</strong>
                                  {row.id === user.id && <Tag>我</Tag>}
                                </Space>
                              ),
                            },
                            { title: "邮箱", dataIndex: "email" },
                            {
                              title: "角色",
                              dataIndex: "role",
                              render: (role: Role) => (
                                <Tag
                                  color={role === "admin" ? "cyan" : "default"}
                                >
                                  {roles[role]}
                                </Tag>
                              ),
                            },
                            {
                              title: "调整角色",
                              render: (_, row: Member) =>
                                org.role === "admin" ? (
                                  <Select
                                    aria-label={`调整${row.name}角色`}
                                    value={row.role}
                                    disabled={saving}
                                    style={{ width: 120 }}
                                    options={roleOptions}
                                    onChange={(role) =>
                                      updateRole(row.id, role)
                                    }
                                  />
                                ) : (
                                  <span className="muted">仅管理员可操作</span>
                                ),
                            },
                          ]}
                        />
                      </Card>
                    )}
                    {page === "organization" && (
                      <>
                        <Card title="组织信息">
                          <div className="org-details">
                            <ApartmentOutlined
                              style={{ fontSize: 40, color: "#237265" }}
                            />
                            <Typography.Title level={3}>
                              {org.name}
                            </Typography.Title>
                            <p className="muted">
                              组织编号 #{org.id} · 当前角色：{roles[org.role]}
                            </p>
                            <p>同一账号可加入多个组织，通过页面顶部切换。</p>
                            <Button
                              icon={<PlusOutlined />}
                              onClick={() => setOrgOpen(true)}
                            >
                              创建另一个组织
                            </Button>
                          </div>
                          <Alert
                            showIcon
                            type="info"
                            message="每个演示组织都有独立的样例数据。创建者自动成为模拟管理员。"
                          />
                        </Card>
                        <Card title="演示数据" style={{ marginTop: 20 }}>
                          <Typography.Paragraph type="secondary">
                            演示账号、角色、组织和任务只保存在此浏览器。重置会恢复初始样例，不会清理其他网站的数据。
                          </Typography.Paragraph>
                          <Button danger onClick={confirmReset}>
                            重置演示数据
                          </Button>
                        </Card>
                      </>
                    )}
                  </>
                )}
              </div>
            </Spin>
          )}
        </Layout.Content>
        <Layout.Footer className="footer">
          知序 · 知识产权协作平台 <span>前端演示 · 浏览器本地保存</span>
        </Layout.Footer>
      </Layout>
      <Modal
        title="新增成员"
        open={memberOpen}
        onCancel={() => {
          if (!saving) {
            setMemberOpen(false);
            memberForm.resetFields();
          }
        }}
        closable={!saving}
        maskClosable={!saving}
        footer={null}
        destroyOnClose
      >
        <Alert
          type="info"
          message="仅创建本浏览器中的演示成员。请勿填写真实个人信息或真实密码。"
          style={{ marginBottom: 20 }}
        />
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={addMember}
          initialValues={{ role: "member" }}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ required: true, type: "email" }]}
          >
            <Input maxLength={254} />
          </Form.Item>
          <Form.Item
            name="password"
            label="初始密码"
            rules={[{ required: true, min: 10, max: 128 }]}
          >
            <Input.Password maxLength={128} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select options={roleOptions} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block>
            创建成员
          </Button>
        </Form>
      </Modal>
      <Modal
        title="创建新组织"
        open={orgOpen}
        onCancel={() => {
          if (!saving) setOrgOpen(false);
        }}
        closable={!saving}
        maskClosable={!saving}
        footer={null}
      >
        <Form
          form={orgForm}
          layout="vertical"
          onFinish={addOrg}
          initialValues={
            demo?.enabled
              ? { name: `${demo.organization_name || "知序"} · 新协作空间` }
              : undefined
          }
        >
          <Form.Item
            name="name"
            label="组织名称"
            rules={[{ required: true, whitespace: true }]}
          >
            <Input maxLength={100} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving} block>
            创建组织
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
}

function Root() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<Profile>("/auth/me", { signal: controller.signal })
      .then((profile) => {
        if (!controller.signal.aborted) setUser(profile);
      })
      .catch((e) => {
        if (
          !controller.signal.aborted &&
          !(e instanceof ApiError && e.status === 401)
        )
          setError("浏览器中的演示数据读取失败，请刷新后重试");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const listener = () => setUser(null);
    window.addEventListener("session-expired", listener);
    return () => window.removeEventListener("session-expired", listener);
  }, []);
  return loading ? (
    <div className="loading">
      <Spin size="large" />
    </div>
  ) : error ? (
    <div className="loading">
      <Alert
        type="error"
        message={error}
        action={<Button onClick={() => setRetry((r) => r + 1)}>重试</Button>}
      />
    </div>
  ) : user ? (
    <Workspace key={user.id} user={user} setUser={setUser} />
  ) : (
    <Auth onSuccess={setUser} />
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#17675a",
          borderRadius: 10,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif',
          colorBgLayout: "#f4f6f7",
        },
        components: {
          Button: { controlHeight: 38 },
          Input: { controlHeight: 42 },
          Menu: { itemSelectedBg: "#e7f2ee" },
        },
      }}
    >
      <AntApp>
        <ProjectGoalModal />
        <Root />
      </AntApp>
    </ConfigProvider>
  </React.StrictMode>,
);
