import { expect, type Page } from '@playwright/test';

export class AppShellPage {
  constructor(private readonly page: Page) {}

  readonly shell = this.page.getByTestId('vantage-shell');
  readonly sidebar = this.page.getByTestId('vantage-sidebar');
  readonly projectSearch = this.page.getByLabel('Search for projects or teams');
  readonly backlogLink = this.page.getByRole('button', { name: 'BACKLOG' });
  readonly boardLink = this.page.getByRole('button', { name: 'BOARD' });
  readonly analyticsLink = this.page.getByRole('button', { name: 'ANALYTICS' });
  readonly logoutButton = this.page.getByRole('button', { name: 'Logout' });

  async goto() {
    await this.page.goto('/');
  }

  async expectShellVisible() {
    await expect(this.shell).toBeVisible();
    await expect(this.sidebar).toBeVisible();
    await expect(this.projectSearch).toBeVisible();
    await expect(this.backlogLink).toBeVisible();
  }

  async openBacklog() {
    await this.backlogLink.click();
    await expect(this.page.getByRole('heading', { name: 'Backlog' })).toBeVisible();
  }

  async openBoard() {
    await this.boardLink.click();
    await expect(this.page.getByRole('heading', { name: 'Board' })).toBeVisible();
  }

  async openAnalytics() {
    await this.analyticsLink.click();
    await expect(this.page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  }

  async searchProject(query: string) {
    await this.projectSearch.fill(query);
    await expect(this.projectSearch).toHaveValue(query);
  }
}
