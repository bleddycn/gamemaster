import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  displayName: string;
}

export const TEST_USERS = {
  siteAdmin: {
    email: 'admin@gamemaster.test',
    password: 'admin123',
    role: 'SITE_ADMIN',
    displayName: 'Site Admin'
  },
  clubAdmin: {
    email: 'clubadmin@cavan.test', 
    password: 'clubadmin123',
    role: 'CLUB_ADMIN',
    displayName: 'Club Admin'
  },
  player: {
    email: 'player@gamemaster.test',
    password: 'player123', 
    role: 'PLAYER',
    displayName: 'Test Player'
  }
} as const;

export async function signIn(page: Page, user: TestUser) {
  await page.goto('/auth/sign-in');
  
  await expect(page.locator('h2')).toHaveText('Sign in');
  
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  
  await page.click('button[type="submit"]');
  
  // Wait for redirect to home page
  await page.waitForURL('/');
  
  // Verify signed in by checking user avatar is visible in header
  await expect(page.locator('header [class*="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full"]')).toBeVisible();
  await expect(page.locator(`text=${user.role}`)).toBeVisible();
}

export async function signOut(page: Page) {
  // In the new design, sign out button is in the navigation sidebar
  await page.click('nav button:has-text("Sign Out")');
  
  // Wait for redirect and verify signed out
  await page.waitForURL('/');
  await expect(page.locator('nav').locator('text=Sign In')).toBeVisible();
  // Check that user avatar is no longer visible
  await expect(page.locator('header [class*="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full"]')).not.toBeVisible();
}

export async function expectSignedIn(page: Page, role: string) {
  // In the new design, user info is in the header avatar section
  await expect(page.locator('header').locator(`text=${role}`)).toBeVisible();
  // Check that user avatar is visible
  await expect(page.locator('[class*="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full"]')).toBeVisible();
}

export async function expectSignedOut(page: Page) {
  // In the new design, sign in button is in the navigation sidebar
  await expect(page.locator('nav').locator('text=Sign In')).toBeVisible();
  // Check that user avatar is not visible in header
  await expect(page.locator('[class*="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full"]')).not.toBeVisible();
}

export async function expectErrorMessage(page: Page, expectedMessage: string) {
  // Updated selectors for new design
  await expect(page.locator('.text-red-600, .text-red-800, .text-red-800').filter({ hasText: expectedMessage })).toBeVisible();
}

export async function expectTemplatesLinkVisible(page: Page, visible: boolean) {
  // In the new design, templates link is in the navigation sidebar
  const templatesLink = page.locator('nav a[href="/admin/templates"]');
  
  if (visible) {
    await expect(templatesLink).toBeVisible();
  } else {
    await expect(templatesLink).not.toBeVisible();
  }
}

export async function expectClubSwitcher(page: Page, expectedBehavior: 'none' | 'single' | 'multiple') {
  switch (expectedBehavior) {
    case 'none':
      await expect(page.locator('text=Your clubs')).not.toBeVisible();
      await expect(page.locator('.bg-white\\/20').filter({ hasText: /GAA$/ })).not.toBeVisible();
      break;
    case 'single':
      await expect(page.locator('.bg-white\\/20').filter({ hasText: /GAA$/ })).toBeVisible();
      await expect(page.locator('text=Your clubs (')).not.toBeVisible();
      break;
    case 'multiple':
      await expect(page.locator('text=Your clubs (')).toBeVisible();
      break;
  }
}