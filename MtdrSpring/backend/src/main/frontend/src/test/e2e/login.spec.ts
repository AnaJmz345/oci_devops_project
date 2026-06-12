import { test, expect } from '@playwright/test';

const managerUser = {
  oracleId: 1,
  oracle_id: 1,
  name: 'Mariana Manager',
  mail: 'manager@test.com',
  role: 'MANAGER',
};

const developerUser = {
  oracleId: 2,
  oracle_id: 2,
  name: 'Diego Developer',
  mail: 'developer@test.com',
  role: 'DEVELOPER',
};

const loginCases = [
  {
    title: 'manager can see analytics',
    user: managerUser,
    shouldSeeAnalytics: true,
  },
  {
    title: 'developer cannot see analytics',
    user: developerUser,
    shouldSeeAnalytics: false,
  },
];

test.describe('OCI login suite @login @oci', () => {
  test.beforeAll(async () => {
    console.log('Starting OCI login E2E suite');
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({
      time: new Date('2026-06-12T09:00:00'),
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    await page.screenshot({
      path: testInfo.outputPath('login-screenshot.png'),
      fullPage: true,
    });
  });

  test.afterAll(async () => {
    console.log('Finished OCI login E2E suite');
  });

  test('does not sign in when OCI authorization fails @negative', async ({ page }) => {
    await page.route('**/users/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Not authenticated' }),
      });
    });

    await page.route('**/oauth2/authorization/oci', async (route) => {
      await route.fulfill({
        status: 302,
        headers: {
          location: 'http://localhost:3000/',
        },
      });
    });

    await page.goto('/');

    await expect(page.getByRole('region', { name: 'Authentication' })).toBeVisible();

    await page.getByTitle('Start sign in').click();

    await expect(page.getByTestId('auth-root')).toBeVisible();
    await expect(page.getByTestId('vantage-shell')).not.toBeVisible();
  });

  test('signs in with OCI as manager and opens analytics @manager @analytics', async ({ page }) => {
    test.slow();

    expect(managerUser.role).toBe('MANAGER');

    let authorized = false;

    await page.route('**/users/me', async (route) => {
      if (!authorized) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Not authenticated' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(managerUser),
      });
    });

    await page.route('**/oauth2/authorization/oci', async (route) => {
      authorized = true;

      await route.fulfill({
        status: 302,
        headers: {
          location: 'http://localhost:3000/',
        },
      });
    });

    await page.goto('/');

    await expect(page).toHaveURL('/');

    await page.getByRole('button', { name: 'SIGN IN' }).click();

    await expect.soft(page.getByTestId('vantage-shell')).toBeVisible();
    await expect.soft(page.getByText('Mariana Manager')).toBeVisible();
    await expect.soft(page.getByRole('button', { name: 'ANALYTICS' })).toBeVisible();

    await page.getByRole('button', { name: 'ANALYTICS' }).click();

    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('MANAGER VIEW')).toBeVisible();

    await expect(page.getByTestId('vantage-shell')).toHaveScreenshot('manager-oci-login.png');
  });

  for (const loginCase of loginCases) {
    test(`${loginCase.title} @parameterized`, async ({ page }) => {
      expect(loginCase.user.role).toBeDefined();

      let authorized = false;

      await page.route('**/users/me', async (route) => {
        await route.fulfill({
          status: authorized ? 200 : 401,
          contentType: 'application/json',
          body: JSON.stringify(
            authorized
              ? loginCase.user
              : { message: 'Not authenticated' }
          ),
        });
      });

      await page.route('**/oauth2/authorization/oci', async (route) => {
        authorized = true;

        await route.fulfill({
          status: 302,
          headers: {
            location: 'http://localhost:3000/',
          },
        });
      });

      await page.goto('/');

      await page.getByTestId('sign-in-button').click();

      await expect(page.getByTestId('vantage-shell')).toBeVisible();
      await expect.soft(page.getByText(loginCase.user.name)).toBeVisible();

      if (loginCase.shouldSeeAnalytics) {
        await expect(page.getByRole('button', { name: 'ANALYTICS' })).toBeVisible();
      } else {
        await expect(page.getByRole('button', { name: 'ANALYTICS' })).not.toBeVisible();
      }
    });
  }

  test.skip('download analytics data @download', async () => {
    // Pendiente porque todavía no hay botón visible de download en Analytics.
  });
});