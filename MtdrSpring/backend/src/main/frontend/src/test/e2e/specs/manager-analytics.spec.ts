import { expect, test } from '@playwright/test';
import { AnalyticsPage } from '../pageObjects/AnalyticsPage';
import { AppShellPage } from '../pageObjects/AppShellPage';
import { BacklogPage } from '../pageObjects/BacklogPage';
import { mockVantageApi } from '../support/api-mocks';
import { E2E_CLOCK, NEW_TASKS, TASKS, TEST_TAGS, USERS } from '../support/test-data';

test.describe(`${TEST_TAGS.manager} ${TEST_TAGS.analytics} manager analytics and planning`, () => {
  let totalMockTasks = 0;

  test.beforeAll(async () => {
    totalMockTasks = TASKS.filter((task) => task.sprintId != null).length;
  });

  test.afterAll(async () => {
    totalMockTasks = 0;
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: E2E_CLOCK });
    await mockVantageApi(page, { currentUser: USERS.manager });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({ path: testInfo.outputPath('manager-after-each.png'), fullPage: true });
  });

  test('shows team analytics with mocked API responses and KPI assertions', async ({ page }) => {
    test.slow();

    const app = new AppShellPage(page);
    const analytics = new AnalyticsPage(page);

    await app.goto();
    await app.expectShellVisible();
    await app.openAnalytics();
    await analytics.expectLoaded();
    await analytics.expectKpis(totalMockTasks, 1, 1);

    const analyticsCards = await page.locator('.AN-card').count();
    expect(analyticsCards).toBeGreaterThan(3);
    await expect(page.getByText('No completed tasks yet for this sprint.')).not.toBeVisible();
    await expect.soft(page.getByText('SPRINT PROGRESS')).toBeVisible();
    await expect.soft(page.getByText('TASKS COMPLETED')).toBeVisible();

    await expect(analytics.root).toHaveScreenshot('manager-analytics-dashboard.png');
  });

  test('creates three complete tasks from parameterized data', async ({ page }) => {
    const app = new AppShellPage(page);
    const backlog = new BacklogPage(page);

    await app.goto();
    await app.expectShellVisible();
    await backlog.expectLoaded();

    for (const task of NEW_TASKS) {
      await backlog.createTask(task, 'Diego Developer (developer@vantage.test)');
      await backlog.expectTaskVisible(task.taskName);
    }

    expect(NEW_TASKS).toHaveLength(3);
    await expect.soft(page.getByText('Create Playwright auth suite')).toBeVisible();
    await expect.soft(page.getByText('Create Playwright manager suite')).toBeVisible();
    await expect.soft(page.getByText('Create Playwright developer suite')).toBeVisible();

    await expect(backlog.table).toHaveScreenshot('manager-created-tasks-table.png');
  });

  test.skip('skips manager data download until the UI exposes a download control', async () => {
    // The current Analytics page has KPIs and charts, but no download button yet.
  });
});
