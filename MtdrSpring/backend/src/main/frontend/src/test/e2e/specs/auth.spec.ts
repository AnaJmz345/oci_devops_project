import { expect, test } from '@playwright/test';
import { AppShellPage } from '../pageObjects/AppShellPage';
import { AuthPage } from '../pageObjects/AuthPage';
import { mockVantageApi } from '../support/api-mocks';
import { E2E_CLOCK, TEST_TAGS } from '../support/test-data';

test.describe(`${TEST_TAGS.auth} ${TEST_TAGS.mockedApi} authentication`, () => {
  let suiteReady = false;

  test.beforeAll(async () => {
    suiteReady = true;
  });

  test.afterAll(async () => {
    suiteReady = false;
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: E2E_CLOCK });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({ path: testInfo.outputPath('after-each.png'), fullPage: true });
  });

  test('shows unauthenticated landing with seven visible locator styles', async ({ page }) => {
    await mockVantageApi(page, { currentUser: null });

    const auth = new AuthPage(page);
    await auth.goto();
    await auth.expectLandingVisible();
    await auth.openRegisterRequest();

    await expect(page.getByTestId('auth-card')).toBeVisible();
    await expect(page.getByRole('button', { name: 'BACK TO SIGN IN' })).toBeVisible();
    await expect(page.getByText('REQUEST ACCESS')).toBeVisible();
    await expect(page.locator('.AuthOverlay')).toBeVisible();
    await expect(page.getByTestId('auth-root')).toHaveClass(/AuthRoot/);
    await expect(page.getByTestId('vantage-shell')).not.toBeVisible();
    await expect.soft(page.getByText('Contact your project manager')).toBeVisible();
    expect(suiteReady).toBe(true);

    await expect(page.getByTestId('auth-root')).toHaveScreenshot('auth-request-access.png');
  });

  test(`${TEST_TAGS.har} loads manager session from HAR and enters the app shell`, async ({ page }) => {
    await mockVantageApi(page, { useHar: true });

    const app = new AppShellPage(page);
    await app.goto();
    await app.expectShellVisible();
    await app.searchProject('SIXTH');

    await expect(page.getByText('Mariana Manager')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Backlog' })).toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'ANALYTICS' })).toBeVisible();

    await expect(app.shell).toHaveScreenshot('manager-shell-from-har.png');
  });

  test.fail('documents the old username/password negative-login scenario as replaced by OCI OAuth', async ({ page }) => {
    await mockVantageApi(page, { currentUser: null });

    const auth = new AuthPage(page);
    await auth.goto();

    await expect(auth.signInButton).not.toBeVisible();
  });

  test.skip('skips live OCI OAuth redirect because E2E tests must never hit the real API', async () => {
    // Live identity-provider redirects are intentionally outside this mocked E2E suite.
  });
});
