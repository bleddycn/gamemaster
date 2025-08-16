import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/GameMaster/);
});

test('navigate to clubs page', async ({ page }) => {
  await page.goto('/');

  // Click the clubs link.
  await page.click('text=Clubs');
  
  // Expects page to have a heading with the name of Clubs.
  await expect(page.locator('h1')).toContainText('Clubs');
});