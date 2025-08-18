import { test, expect } from '@playwright/test';
import { signIn, signOut, TEST_USERS, expectSignedIn, expectSignedOut, expectTemplatesLinkVisible, expectClubSwitcher } from './auth-utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start each test signed out
    await page.goto('/');
  });

  test('should start signed out', async ({ page }) => {
    await expectSignedOut(page);
    await expectTemplatesLinkVisible(page, false);
    await expectClubSwitcher(page, 'none');
  });

  test('should sign in as Site Admin', async ({ page }) => {
    await signIn(page, TEST_USERS.siteAdmin);
    
    // Verify signed in with correct role
    await expectSignedIn(page, 'SITE_ADMIN');
    
    // Site admin should see templates link
    await expectTemplatesLinkVisible(page, true);
    
    // Should be able to access admin templates page
    await page.click('a[href="/admin/templates"]');
    await expect(page.locator('h1')).toHaveText('Game Templates');
    await expect(page.locator('h2').filter({ hasText: 'Create template' })).toBeVisible();
  });

  test('should sign in as Club Admin', async ({ page }) => {
    await signIn(page, TEST_USERS.clubAdmin);
    
    // Verify signed in with correct role  
    await expectSignedIn(page, 'CLUB_ADMIN');
    
    // Club admin should not see templates link
    await expectTemplatesLinkVisible(page, false);
    
    // Should see single club link (Cavan GAA)
    await expectClubSwitcher(page, 'single');
    await expect(page.locator('text=Cavan GAA')).toBeVisible();
    
    // Should be able to click club link
    await page.click('text=Cavan GAA');
    await expect(page.locator('h1')).toHaveText('Cavan GAA');
  });

  test('should sign in as Player', async ({ page }) => {
    await signIn(page, TEST_USERS.player);
    
    // Verify signed in with correct role
    await expectSignedIn(page, 'PLAYER');
    
    // Player should not see templates link
    await expectTemplatesLinkVisible(page, false);
    
    // Player should not see club switcher
    await expectClubSwitcher(page, 'none');
  });

  test('should sign out successfully', async ({ page }) => {
    await signIn(page, TEST_USERS.siteAdmin);
    await expectSignedIn(page, 'SITE_ADMIN');
    
    await signOut(page);
    await expectSignedOut(page);
    await expectTemplatesLinkVisible(page, false);
  });

  test('should reject invalid credentials', async ({ page }) => {
    await page.goto('/auth/sign-in');
    
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should show error message
    await expect(page.locator('.text-red-800')).toBeVisible();
    
    // Should still be on sign-in page
    await expect(page.locator('h2')).toHaveText('Sign in');
  });

  test('should redirect to sign-in when accessing protected admin page', async ({ page }) => {
    // Try to access admin templates without being signed in
    await page.goto('/admin/templates');
    
    // Should redirect to sign-in
    await page.waitForURL('/auth/sign-in');
    await expect(page.locator('h2')).toHaveText('Sign in');
  });

  test('should redirect non-admin users from admin pages', async ({ page }) => {
    await signIn(page, TEST_USERS.player);
    
    // Try to access admin templates as player
    await page.goto('/admin/templates');
    
    // Should redirect to sign-in
    await page.waitForURL('/auth/sign-in');
  });
});