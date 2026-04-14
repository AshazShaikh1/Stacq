import { test, expect } from '@playwright/test';

test.describe('Stacq Happy Path', () => {
  test.beforeEach(async ({ context, page }) => {
    // Inject the E2E Auth Bypass cookie
    await context.addCookies([{
      name: 'e2e-auth-bypass',
      value: 'stacq-test-secret',
      domain: 'localhost',
      path: '/',
    }]);
    
    // Start at home
    await page.goto('/');
  });

  test('User can bypass auth and see profile', async ({ page }) => {
    // 1. Click the Avatar to open the dropdown using data-testid
    const avatar = page.getByTestId('nav-avatar-btn');
    await avatar.first().click();

    // 2. Now the profile link should be visible in the dropdown
    const profileLink = page.getByTestId('nav-profile-link');
    await expect(profileLink).toBeVisible();
  });

  test('User can create a Stacq and add a resource', async ({ page }) => {
    // 1. Open Create Modal using aria-label (robust for mobile icons)
    await page.getByLabel('Create Stacq').click();
    
    // Wait for modal to be visible
    await expect(page.locator('h2:has-text("Create a Stacq")')).toBeVisible();

    // 2. Fill in Stacq details using data-testid
    await page.getByTestId('create-stacq-title').fill('Playwright Test Collection');
    await page.getByTestId('create-stacq-category').fill('Testing');
    await page.getByTestId('create-stacq-description').fill('Self-verification test.');
    
    // 3. Submit
    await page.getByTestId('create-stacq-submit').click();
    
    // 4. Verify Redirect to the new stacq page
    await page.waitForURL(/\/stacq\/playwright-test-collection/, { timeout: 30000 });

    
    // 5. Add a resource
    await page.getByRole('button', { name: 'Add Resource' }).click({ timeout: 15000 });
    await page.fill('input[placeholder*="example.com/article"]', 'https://playwright.dev');
    
    await page.fill('textarea[placeholder*="Why is this valuable?"]', 'Essential tool for full-stack reliability.');
    
    // Wait for the UI to reflect the input
    await expect(page.locator('text=Essential tool')).toBeVisible({ timeout: 10000 });

    
    // Explicitly scroll into view for restricted viewports (mobile)
    const submitBtn = page.getByRole('button', { name: 'Save to Stack' });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true }); // Bypass visibility checks for clipped mobile views
    
    // 6. Verify resource appears on board
    // Increased timeout for masonry hydration and server action roundtrip
    const resourceCard = page.locator('article', { hasText: /playwright/i });
    await expect(resourceCard.first()).toBeVisible({ timeout: 30000 });
  });



  test('User can see error feedback in modal', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Create Stacq').click();
    
    // Try to submit empty form
    await page.getByTestId('create-stacq-submit').click();
    
    // Check for inline validation errors with resilience for mobile transitions
    const error = page.locator('p.text-destructive');
    await error.first().waitFor({ state: 'attached' });
    await expect(error.first()).toBeVisible();
  });
});



