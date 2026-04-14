import { test, expect } from '@playwright/test';

test.describe('Stacq Security & Permissions', () => {
  // Test 1: Access control for non-owners
  test('Non-owners should not see edit/delete controls on a public stacq', async ({ page }) => {
    await page.goto('/explore');
    
    // Check if articles exist
    const firstStacq = page.locator('article').first();
    const articlesCount = await firstStacq.count();

    if (articlesCount > 0) {
        await firstStacq.click();
        
        // Wait for the detail page to load
        await expect(page).toHaveURL(/\/stacq\//);
        
        // The "Add Resource" button should NOT be visible for visitors
        const addBtn = page.locator('button:has-text("Add Resource")');
        await expect(addBtn).not.toBeVisible();
        
        // Resource action buttons (Edit/Delete) should NOT be present
        const editBtn = page.locator('button[aria-label="Edit resource"]');
        await expect(editBtn).not.toBeVisible();
    } else {
        console.log('Skipping stacq detail security check: No articles found in /explore');
    }
  });

  // Test 2: Unauthorized redirect attempts
  test('Accessing /profile while logged out should prompt/show login state', async ({ page }) => {
    await page.goto('/profile');
    
    // Logged out users should not see the profile details
    const profileHeading = page.locator('h1:has-text("My Library")');
    await expect(profileHeading).not.toBeVisible();
  });
});

