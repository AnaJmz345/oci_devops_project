import { expect, type Page } from '@playwright/test';

export class AuthPage {
  constructor(private readonly page: Page) {}

  readonly root = this.page.getByTestId('auth-root');
  readonly authCard = this.page.getByRole('region', { name: 'Authentication' });
  readonly title = this.page.getByText('WELCOME BACK TO');
  readonly brand = this.page.getByText('VANTAGE').first();
  readonly signInButton = this.page.getByRole('button', { name: 'SIGN IN' });
  readonly signUpButton = this.page.getByRole('button', { name: 'SIGN UP' });

  async goto() {
    await this.page.goto('/');
  }

  async expectLandingVisible() {
    await expect(this.root).toBeVisible();
    await expect(this.authCard).toBeVisible();
    await expect(this.title).toBeVisible();
    await expect(this.brand).toBeVisible();
    await expect(this.signInButton).toBeEnabled();
  }

  async openRegisterRequest() {
    await this.signUpButton.click();
    await expect(this.page.getByText('REQUEST ACCESS')).toBeVisible();
  }

  async startOciSignIn() {
    await this.signInButton.click();
  }
}
