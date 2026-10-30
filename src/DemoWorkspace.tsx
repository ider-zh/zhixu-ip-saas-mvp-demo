import { useEffect, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  List,
  Row,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  api,
  type CaseDetail,
  type CaseItem,
  type ClientItem,
  type Dashboard,
  type Role,
  type TaskItem,
} from "./api";

const states: Record<string, string> = {
  draft: "草稿",
  collecting: "材料收集中",
  materials: "材料收集中",
  completed: "已归档",
  metadata_only: "示例目录",
  review: "专业审核中",
  filed: "已提交",
  closed: "已归档",
  todo: "待完成",
  done: "已完成",
  uploaded: "已上传",
  ready: "已就绪",
  invention: "发明专利",
};
export function StateTag({ value }: { value: string }) {
  return (
    <Tag
      color={
        value === "done" || value === "closed" || value === "completed"
          ? "green"
          : value === "review"
            ? "gold"
            : "cyan"
      }
    >
      {states[value] || value}
    </Tag>
  );
}
const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("zh-CN") : "未设置";
export default function DemoWorkspace({
  orgId,
  role,
  page,
  dashboard,
  revision,
  refresh,
}: {
  orgId: number;
  role: Role;
  page: string;
  dashboard?: Dashboard;
  revision: number;
  refresh: () => void;
}) {
  const { message } = App.useApp();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [data, setData] = useState<{
    org: number;
    cases: CaseItem[];
    clients: ClientItem[];
    tasks: TaskItem[];
  }>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number>();
  const [detail, setDetail] = useState<CaseDetail>();
  const [detailError, setDetailError] = useState("");
  const [saving, setSaving] = useState<number>();
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError("");
    setSelected(undefined);
    setDetail(undefined);
    Promise.all([
      api<CaseItem[]>("/cases", { org: orgId, signal: controller.signal }),
      api<ClientItem[]>("/clients", { org: orgId, signal: controller.signal }),
      api<TaskItem[]>("/tasks", { org: orgId, signal: controller.signal }),
    ])
      .then(([cases, clients, tasks]) => {
        if (!controller.signal.aborted)
          setData({ org: orgId, cases, clients, tasks });
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [orgId, revision]);
  useEffect(() => {
    const controller = new AbortController();
    setDetail(undefined);
    setDetailError("");
    if (selected !== undefined)
      api<CaseDetail>(`/cases/${selected}`, {
        org: orgId,
        signal: controller.signal,
      })
        .then((result) => {
          if (!controller.signal.aborted) setDetail(result);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setDetailError(e.message);
        });
    return () => controller.abort();
  }, [orgId, selected]);
  const current = data?.org === orgId ? data : undefined;
  const toggle = async (task: TaskItem) => {
    setSaving(task.id);
    try {
      await api(`/tasks/${task.id}`, {
        org: orgId,
        method: "PATCH",
        body: { status: task.status === "done" ? "todo" : "done" },
      });
      if (!mounted.current) return;
      message.success(task.status === "done" ? "任务已重新打开" : "任务已完成");
      refresh();
    } catch (e) {
      if (mounted.current)
        message.error(e instanceof Error ? e.message : "操作失败");
    } finally {
      if (mounted.current) setSaving(undefined);
    }
  };
  const columns = [
    { title: "案件编号", dataIndex: "number", width: 150 },
    {
      title: "案件名称",
      dataIndex: "title",
      render: (title: string, row: CaseItem) => (
        <Button
          type="link"
          style={{
            padding: 0,
            height: "auto",
            whiteSpace: "normal",
            textAlign: "left",
          }}
          onClick={() => setSelected(row.id)}
        >
          {title}
        </Button>
      ),
    },
    { title: "客户", dataIndex: "client_name" },
    {
      title: "负责人",
      dataIndex: "owner_name",
      render: (v: string | null) => v || "未分配",
    },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => <StateTag value={v} />,
    },
  ];
  const taskColumns = [
    { title: "任务", dataIndex: "title" },
    {
      title: "所属案件",
      dataIndex: "case_title",
      render: (v: string, t: TaskItem) => (
        <Button type="link" onClick={() => setSelected(t.case_id)}>
          {v}
        </Button>
      ),
    },
    {
      title: "负责人",
      dataIndex: "owner_name",
      render: (v: string | null) => v || "未分配",
    },
    { title: "截止日期", dataIndex: "due_at", render: date },
    {
      title: "状态",
      dataIndex: "status",
      render: (v: string) => <StateTag value={v} />,
    },
    {
      title: "操作",
      render: (_: unknown, t: TaskItem) =>
        role === "viewer" ? (
          <Typography.Text type="secondary">只读</Typography.Text>
        ) : (
          <Button
            size="small"
            disabled={saving !== undefined}
            loading={saving === t.id}
            onClick={() => toggle(t)}
          >
            {t.status === "done" ? "重新打开" : "完成任务"}
          </Button>
        ),
    },
  ];
  if (error)
    return (
      <Alert
        type="error"
        message={error}
        action={<Button onClick={refresh}>重试</Button>}
      />
    );
  return (
    <>
      <Spin spinning={busy || !current}>
        <div style={{ minHeight: 260 }}>
          {current && (
            <>
              {page === "dashboard" && (
                <>
                  <Card className="workflow-card" title="知识产权协作流程">
                    <Steps
                      size="small"
                      responsive
                      current={1}
                      items={[
                        { title: "建立客户" },
                        { title: "创建案件" },
                        { title: "收集材料" },
                        { title: "推进任务" },
                        { title: "完成归档" },
                      ]}
                    />
                    <Typography.Paragraph
                      type="secondary"
                      style={{ margin: "18px 0 0" }}
                    >
                      先建立客户档案，再为客户创建专利案件；围绕案件整理材料、分配期限任务，审核与提交后完成归档。
                    </Typography.Paragraph>
                  </Card>
                  <Row
                    gutter={[16, 16]}
                    className="stats"
                    style={{ marginTop: 20 }}
                  >
                    {[
                      {
                        title: "客户",
                        value: dashboard?.clients ?? current.clients.length,
                      },
                      {
                        title: "案件",
                        value: dashboard?.cases ?? current.cases.length,
                      },
                      {
                        title: "待办任务",
                        value: current.tasks.filter((t) => t.status !== "done")
                          .length,
                      },
                      {
                        title: "已完成任务",
                        value:
                          dashboard?.done_tasks ??
                          current.tasks.filter((t) => t.status === "done")
                            .length,
                      },
                      {
                        title: "逾期任务",
                        value:
                          dashboard?.overdue_tasks ??
                          current.tasks.filter(
                            (t) =>
                              t.status !== "done" &&
                              t.due_at &&
                              new Date(t.due_at).getTime() < Date.now(),
                          ).length,
                      },
                      { title: "团队成员", value: dashboard?.members ?? 0 },
                    ].map((s) => (
                      <Col xs={12} lg={4} key={s.title}>
                        <Card>
                          <Statistic title={s.title} value={s.value} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Card title="正在推进的案件" style={{ marginBottom: 20 }}>
                    <Table
                      rowKey="id"
                      columns={columns}
                      dataSource={current.cases
                        .filter(
                          (item) =>
                            !["completed", "closed"].includes(item.status),
                        )
                        .slice(0, 5)}
                      pagination={false}
                      scroll={{ x: 700 }}
                      locale={{ emptyText: "暂无案件" }}
                    />
                  </Card>
                  <Card title="团队待办">
                    <Table
                      rowKey="id"
                      columns={taskColumns}
                      dataSource={current.tasks
                        .filter((t) => t.status !== "done")
                        .slice(0, 6)}
                      pagination={false}
                      scroll={{ x: 850 }}
                      locale={{ emptyText: "所有任务已完成" }}
                    />
                  </Card>
                  <Card title="最近活动" style={{ marginTop: 20 }}>
                    <List
                      dataSource={dashboard?.events ?? []}
                      locale={{ emptyText: "暂无团队活动" }}
                      renderItem={(event) => (
                        <List.Item>
                          <List.Item.Meta
                            title={event.action}
                            description={event.target}
                          />
                          <Typography.Text type="secondary">
                            {new Date(event.created_at).toLocaleString("zh-CN")}
                          </Typography.Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                </>
              )}
              {page === "cases" && (
                <Card title={`案件项目 · ${current.cases.length}`}>
                  <Typography.Paragraph type="secondary">
                    点击案件名称，查看关联任务与示例材料目录。
                  </Typography.Paragraph>
                  <Table
                    rowKey="id"
                    columns={columns}
                    dataSource={current.cases}
                    scroll={{ x: 750 }}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              )}
              {page === "clients" && (
                <Card title={`客户档案 · ${current.clients.length}`}>
                  <Table
                    rowKey="id"
                    dataSource={current.clients}
                    columns={[
                      { title: "客户名称", dataIndex: "name" },
                      {
                        title: "联系信息",
                        dataIndex: "contact",
                        render: (v: string | null) => v || "暂未填写",
                      },
                      {
                        title: "关联案件",
                        dataIndex: "case_count",
                        render: (v: number) => `${v} 件`,
                      },
                    ]}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 500 }}
                  />
                </Card>
              )}
              {page === "tasks" && (
                <Card title={`任务清单 · ${current.tasks.length}`}>
                  <Table
                    rowKey="id"
                    columns={taskColumns}
                    dataSource={current.tasks}
                    scroll={{ x: 850 }}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              )}
            </>
          )}
        </div>
      </Spin>
      <Drawer
        title="案件详情"
        open={selected !== undefined}
        onClose={() => setSelected(undefined)}
        width="min(720px, 100vw)"
      >
        {detailError ? (
          <Alert type="error" message={detailError} />
        ) : !detail || detail.id !== selected ? (
          <Spin />
        ) : (
          <>
            <Typography.Title level={4}>{detail.title}</Typography.Title>
            <Descriptions
              column={1}
              bordered
              size="small"
              items={[
                { key: "number", label: "案件编号", children: detail.number },
                { key: "client", label: "客户", children: detail.client_name },
                {
                  key: "owner",
                  label: "负责人",
                  children: detail.owner_name || "未分配",
                },
                {
                  key: "status",
                  label: "状态",
                  children: <StateTag value={detail.status} />,
                },
                {
                  key: "kind",
                  label: "类型",
                  children: states[detail.kind] || detail.kind,
                },
              ]}
            />
            <Typography.Title level={5} style={{ marginTop: 24 }}>
              关联任务
            </Typography.Title>
            <List
              dataSource={detail.tasks}
              locale={{ emptyText: <Empty description="暂无任务" /> }}
              renderItem={(t) => (
                <List.Item>
                  <List.Item.Meta
                    title={t.title}
                    description={`${t.owner_name || "未分配"} · 截止 ${date(t.due_at)}`}
                  />
                  <StateTag value={t.status} />
                </List.Item>
              )}
            />
            <Typography.Title level={5}>示例材料目录</Typography.Title>
            <Alert
              type="info"
              showIcon
              message="此处仅展示示例材料目录，不提供真实文件下载、上传或解析。"
            />
            <List
              dataSource={detail.documents}
              locale={{ emptyText: "暂无材料目录" }}
              renderItem={(d) => (
                <List.Item>
                  <Space>
                    <span>{d.filename}</span>
                    <StateTag value={d.status} />
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>
    </>
  );
}
