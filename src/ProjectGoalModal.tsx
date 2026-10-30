import { useEffect, useRef, useState } from "react";
import { Alert, Modal, Tag, Typography } from "antd";

const LAST_SHOWN_KEY = "zhixu-static-demo:goal-last-shown-at";
const COOLDOWN_MS = 60 * 60 * 1000;
function shouldShowGoal() {
  try {
    const raw = localStorage.getItem(LAST_SHOWN_KEY);
    if (!raw) return true;
    const timestamp = Number(raw);
    const now = Date.now();
    return (
      !Number.isFinite(timestamp) ||
      timestamp <= 0 ||
      timestamp > now ||
      now - timestamp >= COOLDOWN_MS
    );
  } catch {
    return true;
  }
}

export default function ProjectGoalModal() {
  const [open, setOpen] = useState(shouldShowGoal);
  const recorded = useRef(false);
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    if (!recorded.current) {
      recorded.current = true;
      try {
        localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      } catch {
        /* 禁用存储时仍可正常显示和关闭。 */
      }
    }
  }, [open]);

  return (
    <Modal
      title="项目开发目标"
      open={open}
      onCancel={close}
      footer={null}
      centered
      maskClosable
      closable
      width={620}
    >
      <Tag color="orange" style={{ marginBottom: 16 }}>
        MVP DEMO · 仅供交互演示
      </Tag>
      <Typography.Title level={3}>
        让知识产权团队的协作流程看得见
      </Typography.Title>
      <Typography.Paragraph>
        这个原型展示从客户档案到案件跟进，再到任务分配与团队协作的工作过程，帮助大家直观了解页面、操作和信息之间的关系。
      </Typography.Paragraph>
      <Typography.Paragraph>
        开发目标是用可操作的界面支持产品沟通，确认业务流程是否清楚、功能安排是否符合团队使用习惯，用于演示讲解和收集界面反馈，不作为正式业务系统的交付承诺。
      </Typography.Paragraph>
      <Alert
        type="warning"
        showIcon
        message="这是交互演示，不用于真实业务办理。"
        description="所有客户、案件和材料均为示例；请勿录入真实业务信息。"
      />
      <Typography.Paragraph
        type="secondary"
        style={{ marginTop: 20, marginBottom: 0 }}
      >
        阅读完成后，点击弹窗外的空白区域或右上角关闭按钮。
      </Typography.Paragraph>
    </Modal>
  );
}
