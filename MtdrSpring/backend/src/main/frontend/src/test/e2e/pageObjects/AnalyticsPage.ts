import { expect, type Page } from '@playwright/test';

export class AnalyticsPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.getByTestId('analytics-root');
  readonly heading = this.page.getByRole('heading', { name: 'Analytics' });
  readonly totalTasksPill = this.page.getByTestId('analytics-pill-Total Tasks');
  readonly donePill = this.page.getByTestId('analytics-pill-Done');
  readonly inProgressPill = this.page.getByTestId('analytics-pill-In Progress');
  readonly progressCard = this.page.getByTestId('analytics-progress-card');

  async expectLoaded() {
    await expect(this.root).toBeVisible();
    await expect(this.heading).toBeVisible();
    await expect(this.totalTasksPill).toBeVisible();
    await expect(this.donePill).toBeVisible();
    await expect(this.inProgressPill).toBeVisible();
    await expect(this.progressCard).toBeVisible();
  }

  async expectKpis(totalTasks: number, doneTasks: number, inProgressTasks: number) {
    await expect(this.totalTasksPill).toContainText(String(totalTasks));
    await expect(this.donePill).toContainText(String(doneTasks));
    await expect(this.inProgressPill).toContainText(String(inProgressTasks));
  }
}
