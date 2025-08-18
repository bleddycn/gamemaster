import { test, expect } from '@playwright/test';

test.describe('Design Verification', () => {
  test('should show new GameMaster design on home page', async ({ page }) => {
    await page.goto('/');
    
    // Check that GameMaster logo is visible
    await expect(page.locator('text=GameMaster')).toBeVisible();
    
    // Check that navigation sidebar is present
    await expect(page.locator('nav')).toBeVisible();
    
    // Check that main dashboard title is showing
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
    
    // Check that welcome card is present
    await expect(page.locator('text=Welcome to GameMaster')).toBeVisible();
    
    // Check that quick stats card is showing
    await expect(page.locator('text=Quick Stats')).toBeVisible();
    await expect(page.locator('text=Active Clubs')).toBeVisible();
    
    // Check that quick actions are present
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    
    console.log('✅ Home page design verification passed');
  });

  test('should show clubs page with new table design', async ({ page }) => {
    await page.goto('/clubs');
    
    // Check that clubs page loads with new design
    await expect(page.locator('h1').filter({ hasText: 'Clubs' })).toBeVisible();
    await expect(page.locator('text=Sports clubs and organizations')).toBeVisible();
    
    // Check that table structure is present
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th').filter({ hasText: 'Club Name' })).toBeVisible();
    
    // Check that club data is showing
    await expect(page.locator('text=Cavan GAA')).toBeVisible();
    await expect(page.locator('text=Monaghan GAA')).toBeVisible();
    
    console.log('✅ Clubs page design verification passed');
  });

  test('should show sign-in page with logo', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    // Check that sign in page loads with logo
    await expect(page.locator('h2').filter({ hasText: 'Sign in' })).toBeVisible();
    await expect(page.locator('text=GameMaster')).toBeVisible();
    
    // Check that form is present
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    
    console.log('✅ Sign-in page design verification passed');
  });

  test('should show club detail page with new layout', async ({ page }) => {
    await page.goto('/clubs/cavan-gaa');
    
    // Check that club page loads with new design
    await expect(page.locator('h1').filter({ hasText: 'Cavan GAA' })).toBeVisible();
    
    // Check that competitions card is present
    await expect(page.locator('text=Competitions')).toBeVisible();
    
    console.log('✅ Club detail page design verification passed');
  });

  test('navigation should work correctly', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to clubs
    await page.click('nav a[href="/clubs"]');
    await expect(page).toHaveURL('/clubs');
    await expect(page.locator('h1').filter({ hasText: 'Clubs' })).toBeVisible();
    
    // Test navigation to sign in
    await page.click('nav a[href="/auth/sign-in"]');
    await expect(page).toHaveURL('/auth/sign-in');
    await expect(page.locator('h2').filter({ hasText: 'Sign in' })).toBeVisible();
    
    // Test navigation back to home
    await page.click('nav a[href="/"]');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
    
    console.log('✅ Navigation verification passed');
  });
});