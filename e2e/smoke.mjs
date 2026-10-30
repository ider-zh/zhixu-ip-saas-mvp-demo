import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

const baseURL = process.env.BASE_URL || "http://localhost:4173";
const browser = await chromium.launch({
  executablePath: chromium.executablePath(),
  headless: true,
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await context.newPage();
const errors = [];
const apiRequests = [];
const dynamicRequests = [];
const cspViolations = [];
await page.exposeFunction("reportDemoCspViolation", (event) =>
  cspViolations.push(event),
);
await page.addInitScript(() =>
  window.addEventListener("securitypolicyviolation", (event) =>
    window.reportDemoCspViolation({
      directive: event.violatedDirective,
      blocked: event.blockedURI,
    }),
  ),
);
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (["fetch", "xhr", "websocket"].includes(request.resourceType()))
    dynamicRequests.push(request.url());
  if (new URL(request.url()).pathname.startsWith("/api"))
    apiRequests.push(request.url());
});
const ready = async () => {
  await page.waitForFunction(
    () =>
      !document.querySelector(
        ".main-content .ant-spin-spinning,.main-content .ant-spin-blur",
      ),
  );
};
const screenshot = async (name) => {
  if (!process.env.SCREENSHOTS) return;
  await ready();
  await fs.mkdir(process.env.SCREENSHOTS, { recursive: true });
  await page.screenshot({
    path: `${process.env.SCREENSHOTS}/${name}.png`,
    fullPage: true,
    style: ".ant-message,.ant-tooltip{visibility:hidden!important}",
  });
};
const navigate = async (name) => {
  await page.getByRole("menuitem", { name }).click();
  await ready();
};
const taskRow = (title) =>
  page
    .locator(".main-content .ant-table-tbody > tr.ant-table-row")
    .filter({ hasText: title });
try {
  await page.goto(baseURL);
  const goal = page.getByRole("dialog", { name: "项目开发目标" });
  await goal.waitFor();
  const initialGoalTimestamp = await page.evaluate(() =>
    localStorage.getItem("zhixu-static-demo:goal-last-shown-at"),
  );
  assert.ok(
    Number(initialGoalTimestamp) > 0,
    "Goal display time must be recorded while visible",
  );
  await page.waitForTimeout(1000);
  assert.ok(
    await goal.isVisible(),
    "Project goals should remain visible before five seconds",
  );
  await goal.waitFor({ state: "hidden", timeout: 5500 });
  await page.reload();
  assert.equal(
    await page.getByRole("dialog", { name: "项目开发目标" }).count(),
    0,
    "Project goals must not repeat on refresh",
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("zhixu-static-demo:goal-last-shown-at"),
    ),
    initialGoalTimestamp,
    "Refresh within cooldown must not rewrite timestamp",
  );
  const reopenedPage = await page.context().newPage();
  await reopenedPage.goto(baseURL);
  await reopenedPage.getByText("欢迎回来", { exact: true }).waitFor();
  assert.equal(
    await reopenedPage.getByRole("dialog", { name: "项目开发目标" }).count(),
    0,
    "Reopening within an hour must not repeat goals",
  );
  await reopenedPage.close();
  await page.evaluate(() =>
    localStorage.setItem(
      "zhixu-static-demo:goal-last-shown-at",
      String(Date.now() - 3600001),
    ),
  );
  await page.reload();
  await goal.waitFor();
  const renewedTimestamp = await page.evaluate(() =>
    Number(localStorage.getItem("zhixu-static-demo:goal-last-shown-at")),
  );
  assert.ok(
    renewedTimestamp > Number(initialGoalTimestamp),
    "Expired cooldown must display again and record a new timestamp",
  );
  await page.locator(".ant-modal-wrap").click({ position: { x: 8, y: 8 } });
  await goal.waitFor({ state: "hidden" });
  for (const invalidTimestamp of ['not-a-timestamp', String(Date.now()+3600000)]) {
    await page.evaluate(value => localStorage.setItem('zhixu-static-demo:goal-last-shown-at',value), invalidTimestamp);
    await page.reload(); await goal.waitFor();
    await page.locator('.ant-modal-wrap').click({position:{x:8,y:8}}); await goal.waitFor({state:'hidden'});
  }
  const maskContext = await browser.newContext();
  const maskPage = await maskContext.newPage();
  maskPage.on("pageerror", (error) => errors.push(error.message));
  await maskPage.exposeFunction("reportDemoCspViolation", (event) =>
    cspViolations.push(event),
  );
  await maskPage.addInitScript(() =>
    window.addEventListener("securitypolicyviolation", (event) =>
      window.reportDemoCspViolation({
        directive: event.violatedDirective,
        blocked: event.blockedURI,
      }),
    ),
  );
  await maskPage.goto(baseURL);
  await maskPage.getByRole("dialog", { name: "项目开发目标" }).waitFor();
  await maskPage.locator(".ant-modal-wrap").click({ position: { x: 8, y: 8 } });
  await maskPage
    .getByRole("dialog", { name: "项目开发目标" })
    .waitFor({ state: "hidden" });
  assert.ok(
    await maskPage.evaluate(
      () =>
        Number(localStorage.getItem("zhixu-static-demo:goal-last-shown-at")) >
        0,
    ),
  );
  await maskContext.close();
  await page.getByText("欢迎回来", { exact: true }).waitFor();
  await page.waitForFunction(() =>
    Boolean(document.querySelector('input[autocomplete="email"]')?.value),
  );
  assert.ok(await page.getByLabel("邮箱", { exact: true }).inputValue());
  assert.ok(await page.getByLabel("密码", { exact: true }).inputValue());
  await page.getByText(/登录与权限为交互模拟/).waitFor();
  await screenshot("login");
  await page.getByRole("button", { name: "进入工作台" }).click();
  await page.getByText("知识产权协作流程", { exact: true }).waitFor();
  await ready();
  await page.getByText("正在推进的案件", { exact: true }).waitFor();
  assert.ok(
    (await page
      .locator(".main-content .ant-table-tbody > tr.ant-table-row")
      .count()) > 0,
  );
  await screenshot("workspace");
  await navigate("案件项目");
  const caseRows = page.locator(
    ".main-content .ant-table-tbody > tr.ant-table-row",
  );
  assert.ok((await caseRows.count()) > 0);
  await caseRows.first().getByRole("button").click();
  const drawer = page.getByRole("dialog", { name: "案件详情" });
  await drawer.getByText("示例材料目录", { exact: true }).waitFor();
  await drawer.getByText(/不提供真实文件下载/).waitFor();
  await screenshot("case-detail");
  await drawer.locator(".ant-drawer-close").click();
  await navigate("客户档案");
  assert.ok(
    (await page
      .locator(".main-content .ant-table-tbody > tr.ant-table-row")
      .count()) > 0,
  );
  await navigate("任务清单");
  const todoRow = page
    .locator(".main-content .ant-table-tbody > tr.ant-table-row")
    .filter({
      has: page.getByRole("button", { name: "完成任务" }),
    })
    .first();
  const taskTitle = await todoRow.locator("td").first().innerText();
  await todoRow.getByRole("button", { name: "完成任务" }).click();
  await ready();
  await taskRow(taskTitle)
    .getByRole("button", { name: "重新打开" })
    .waitFor();
  await page.reload();
  await page.getByText("知识产权协作流程", { exact: true }).waitFor();
  await navigate("任务清单");
  await taskRow(taskTitle)
    .getByRole("button", { name: "重新打开" })
    .waitFor();
  // Create a second organization: the same sample task must remain independently pending.
  const originalOrg = await page
    .locator(".topbar .ant-select-selection-item")
    .innerText();
  await navigate("组织设置");
  await page
    .getByRole("button", { name: "创建另一个组织" })
    .click();
  const orgDialog = page.getByRole("dialog");
  assert.ok(
    await orgDialog.getByLabel("组织名称", { exact: true }).inputValue(),
  );
  await orgDialog.getByLabel("组织名称", { exact: true }).fill("隔离验证团队");
  await orgDialog
    .getByRole("button", { name: "创建组织" })
    .click();
  await page
    .getByRole("heading", { name: "隔离验证团队" })
    .waitFor();
  await navigate("任务清单");
  await taskRow(taskTitle)
    .getByRole("button", { name: "完成任务" })
    .waitFor();
  await page.locator(".topbar .ant-select-selector").click();
  await page.getByText(originalOrg, { exact: true }).last().click();
  await ready();
  await taskRow(taskTitle)
    .getByRole("button", { name: "重新打开" })
    .waitFor();
  await taskRow(taskTitle)
    .getByRole("button", { name: "重新打开" })
    .click();
  await ready();
  await taskRow(taskTitle)
    .getByRole("button", { name: "完成任务" })
    .waitFor();
  // Register without manually filling fields: create an independent seeded team.
  await page.getByRole("button", { name: "退出登录" }).click();
  await page.getByRole("tab", { name: "创建团队" }).click();
  await page.waitForFunction(() =>
    document
      .querySelector('input[autocomplete="email"]')
      ?.value.startsWith("demo-"),
  );
  const firstEmail = await page
    .getByLabel("邮箱", { exact: true })
    .inputValue();
  for (const label of ["你的姓名", "组织名称", "密码"])
    assert.ok(await page.getByLabel(label, { exact: true }).inputValue());
  await page.getByRole("tab", { name: "账号登录" }).click();
  await page.getByRole("tab", { name: "创建团队" }).click();
  assert.notEqual(
    await page.getByLabel("邮箱", { exact: true }).inputValue(),
    firstEmail,
  );
  await page
    .getByRole("button", { name: "创建团队并登录" })
    .click();
  await page.getByText("知识产权协作流程", { exact: true }).waitFor();
  await navigate("案件项目");
  assert.ok(
    (await page
      .locator(".main-content .ant-table-tbody > tr.ant-table-row")
      .count()) > 0,
  );
  // Reset must preserve unrelated keys and restore the default login screen.
  await page.evaluate(() => {
    localStorage.setItem("unrelated-site-test", "keep");
    sessionStorage.setItem("unrelated-session-test", "keep");
  });
  await navigate("组织设置");
  await page.getByRole("button", { name: "重置演示数据" }).click();
  let modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: /取\s*消/ }).click();
  await page
    .getByRole("button", { name: "重置演示数据" })
    .waitFor();
  await page.getByRole("button", { name: "重置演示数据" }).click();
  modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "确认重置" }).click();
  await page.getByText("欢迎回来", { exact: true }).waitFor();
  assert.equal(
    await page.evaluate(() => localStorage.getItem("unrelated-site-test")),
    "keep",
  );
  assert.equal(
    await page.evaluate(() => sessionStorage.getItem("unrelated-session-test")),
    "keep",
  );
  await page.waitForFunction(() =>
    Boolean(document.querySelector('input[autocomplete="email"]')?.value),
  );
  await page.getByRole("button", { name: "进入工作台" }).click();
  await page.getByText("知识产权协作流程", { exact: true }).waitFor();
  await navigate("任务清单");
  await taskRow(taskTitle)
    .getByRole("button", { name: "完成任务" })
    .waitFor();
  assert.deepEqual(
    apiRequests,
    [],
    "Static demo must never issue /api requests",
  );
  assert.deepEqual(
    dynamicRequests,
    [],
    "Only static resource requests are allowed",
  );
  assert.deepEqual(cspViolations, [], "No CSP violations expected");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: static demo default login, cases/detail/material directory, clients, task toggle and reload persistence, organization isolation, prefilled registration, confirmed reset preserving unrelated browser storage; zero API requests and runtime errors",
  );
} finally {
  await browser.close();
}
