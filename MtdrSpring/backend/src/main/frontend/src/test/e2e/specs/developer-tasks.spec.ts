import { expect, test } from '@playwright/test';
import { AppShellPage } from '../pageObjects/AppShellPage';
import { BacklogPage } from '../pageObjects/BacklogPage';
import { BoardPage } from '../pageObjects/BoardPage';
import { mockVantageApi } from '../support/api-mocks';
import {
  E2E_CLOCK,
  PARAMETERIZED_STATUS_CHANGES,
  TASKS,
  TASK_ASSIGNEES,
  TEST_TAGS,
  USERS,
} from '../support/test-data';

test.describe(`${TEST_TAGS.developer} ${TEST_TAGS.tasks} developer task workflow`, () => {
  let assignedTaskCount = 0;

  test.beforeAll(async () => {
    assignedTaskCount = TASK_ASSIGNEES.filter(
      (assignee) => assignee.oracleId === USERS.developer.oracleId
    ).length;
  });

  test.afterAll(async () => {
    assignedTaskCount = 0;
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: E2E_CLOCK });
    await mockVantageApi(page, { currentUser: USERS.developer });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({ path: testInfo.outputPath('developer-after-each.png'), fullPage: true });
  });

  test('shows assigned work and hides manager-only analytics', async ({ page }) => {
    const app = new AppShellPage(page);
    const backlog = new BacklogPage(page);

    await app.goto();
    await app.expectShellVisible();
    await backlog.expectLoaded();

    await expect(page.getByText('Diego')).toHaveCount(assignedTaskCount);
    await expect(page.getByRole('button', { name: 'ANALYTICS' })).not.toBeVisible();
    await expect.soft(page.getByText('Create authentication smoke tests')).toBeVisible();
    expect(assignedTaskCount).toBe(2);

    await expect(backlog.table).toHaveScreenshot('developer-backlog-table.png');
  });

  for (const statusChange of PARAMETERIZED_STATUS_CHANGES) {
    test(`updates "${statusChange.taskName}" to ${statusChange.nextStatus}`, async ({ page }) => {
      const app = new AppShellPage(page);
      const task = TASKS.find((item) => item.taskName === statusChange.taskName);
      expect(task).toBeTruthy();

      await app.goto();
      await app.expectShellVisible();

      await page.getByTestId(`task-status-${task!.taskId}`).selectOption(statusChange.nextStatus);

      if (statusChange.nextStatus === 'DONE') {
        await expect(page.getByRole('heading', { name: statusChange.taskName })).toBeVisible();
        await page.getByLabel('Actual Hours').fill('7');
        await page.getByRole('button', { name: 'Complete task' }).click();
      }

      await expect(page.getByTestId(`task-status-${task!.taskId}`)).toHaveValue(statusChange.nextStatus);
      await expect.soft(page.getByText(statusChange.taskName)).toBeVisible();
    });
  }

  test('opens the board and verifies tasks by status columns', async ({ page }) => {
    const app = new AppShellPage(page);
    const board = new BoardPage(page);

    await app.goto();
    await app.openBoard();
    await board.expectLoaded();

    await board.expectCardInColumn('Create authentication smoke tests', 'DONE');
    await board.expectCardInColumn('Build analytics cards', 'IN_PROGRESS');
    await board.expectCardInColumn('Fix blocked status color', 'TODO');

    const columnCount = await page.locator('.KB-column').count();
    expect(columnCount).toBe(4);
    await expect.soft(board.board).toBeVisible();
    await expect(board.board).toHaveScreenshot('developer-kanban-board.png');
  });
});
