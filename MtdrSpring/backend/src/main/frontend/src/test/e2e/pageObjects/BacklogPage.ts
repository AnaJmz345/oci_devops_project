import { expect, type Page } from '@playwright/test';
import type { TestTask } from '../support/test-data';

export class BacklogPage {
  constructor(private readonly page: Page) {}

  readonly heading = this.page.getByRole('heading', { name: 'Backlog' });
  readonly table = this.page.getByTestId('backlog-table');
  readonly createTaskButton = this.page.getByRole('button', { name: /\+ Create Task/i });
  readonly createSprintButton = this.page.getByRole('button', { name: /CREATE NEW SPRINT/i });
  readonly assigneeFilter = this.page.getByRole('button', { name: 'Assignee' });

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.table).toBeVisible();
    await expect(this.page.getByText('Backlog items')).toBeVisible();
  }

  async expectTaskVisible(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }

  async expectTaskNotVisible(taskName: string) {
    await expect(this.page.getByText(taskName)).not.toBeVisible();
  }

  async openCreateTask() {
    await this.createTaskButton.click();
    await expect(this.page.getByRole('heading', { name: 'Create Task' })).toBeVisible();
  }

  async createTask(task: TestTask, assigneeLabel: string) {
    await this.openCreateTask();
    await this.page.getByLabel(/Task Name/).fill(task.taskName);
    await this.page.getByLabel('Description').fill(task.description);
    await this.page.getByLabel(/Assignee/).selectOption({ label: assigneeLabel });
    await this.page.getByLabel('Status').selectOption(task.status);
    await this.page.getByLabel('Category').selectOption(task.category);
    await this.page.getByLabel('Sprint').selectOption(String(task.sprintId ?? ''));
    await this.page.getByLabel('Story Points').fill(String(task.storyPoints));
    await this.page.getByLabel(/Est\. Time/).fill('6');
    await this.page.getByLabel(/Due Date/).fill(task.dueDate);
    await this.page
      .getByTestId('create-task-modal')
      .getByRole('button', { name: /\+ Create Task/i })
      .click();
    await expect(this.page.getByRole('heading', { name: 'Create Task' })).not.toBeVisible();
  }

  async openAssigneeFilter() {
    await this.assigneeFilter.click();
    await expect(this.page.getByRole('listbox')).toBeVisible();
  }
}
