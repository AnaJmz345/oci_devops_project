import { expect, type Page } from '@playwright/test';

export class BoardPage {
  constructor(private readonly page: Page) {}

  readonly heading = this.page.getByRole('heading', { name: 'Board' });
  readonly board = this.page.getByTestId('kanban-board');
  readonly todoColumn = this.page.getByTestId('kanban-column-TODO');
  readonly inProgressColumn = this.page.getByTestId('kanban-column-IN_PROGRESS');
  readonly doneColumn = this.page.getByTestId('kanban-column-DONE');
  readonly blockedColumn = this.page.getByTestId('kanban-column-BLOCKED');

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.board).toBeVisible();
    await expect(this.todoColumn).toBeVisible();
    await expect(this.inProgressColumn).toBeVisible();
    await expect(this.doneColumn).toBeVisible();
    await expect(this.blockedColumn).toBeVisible();
  }

  async expectCardInColumn(taskName: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED') {
    await expect(this.page.getByTestId(`kanban-column-${status}`).getByText(taskName)).toBeVisible();
  }

  async moveCardToStatus(taskName: string, status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED') {
    await this.page.getByTestId(`kanban-card-${taskName}`).dragTo(this.page.getByTestId(`kanban-column-${status}`));
  }
}
