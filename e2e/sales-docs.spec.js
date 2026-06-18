import { test, expect } from '@playwright/test';

const BASE_API = 'http://localhost:5000/api';
const TEST_EMAIL = 'playwright@test.gobook';
const TEST_PASSWORD = 'Playwright123!';

async function getAuthToken() {
  // Try login first; if user doesn't exist, register then login
  let res = await fetch(`${BASE_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });

  if (!res.ok) {
    await fetch(`${BASE_API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Playwright Test',
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        businessName: 'Test Business',
      }),
    });
    res = await fetch(`${BASE_API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    });
  }

  const data = await res.json();
  return data.token;
}

let authToken;

test.beforeAll(async () => {
  authToken = await getAuthToken();
});

async function openPage(page, hash) {
  await page.addInitScript((token) => {
    localStorage.setItem('gobook.token', token);
    localStorage.setItem('gobook.user', JSON.stringify({ name: 'Playwright Test' }));
  }, authToken);
  await page.goto(`http://localhost:5173/#${hash}`);
  // Wait for the app shell to render
  await page.waitForSelector('h1, [class*="text-"]', { timeout: 10000 });
}

// ── List Pages ────────────────────────────────────────────────────────────────

test('Credit Note list page loads', async ({ page }) => {
  await openPage(page, '/billing/credit-note');
  await expect(page.locator('h1')).toContainText('Credit Note');
  await expect(page.locator('a[href*="credit-note/new"]')).toBeVisible();
});

test('Debit Note list page loads', async ({ page }) => {
  await openPage(page, '/billing/debit-note');
  await expect(page.locator('h1')).toContainText('Debit Note');
  await expect(page.locator('a[href*="debit-note/new"]')).toBeVisible();
});

test('Delivery Challan list page loads', async ({ page }) => {
  await openPage(page, '/billing/delivery-challan');
  await expect(page.locator('h1')).toContainText('Delivery Challan');
  await expect(page.locator('a[href*="delivery-challan/new"]')).toBeVisible();
});

test('E-Invoice list page loads', async ({ page }) => {
  await openPage(page, '/billing/e-invoice');
  await expect(page.locator('h1')).toContainText('E-Invoice');
  await expect(page.locator('a[href*="e-invoice/new"]')).toBeVisible();
});

test('E-Way Bill list page loads', async ({ page }) => {
  await openPage(page, '/billing/e-way-bill');
  await expect(page.locator('h1')).toContainText('E-Way Bill');
  await expect(page.locator('a[href*="e-way-bill/new"]')).toBeVisible();
});

// ── Create Pages ──────────────────────────────────────────────────────────────

test('Create Credit Note page renders form', async ({ page }) => {
  await openPage(page, '/billing/credit-note/new');
  await expect(page.locator('h1')).toContainText('Credit Note');
  await expect(page.locator('button:has-text("Create Credit Note")')).toBeVisible();
  // number field must be populated with next number
  await expect(page.locator('input[value^="CRN-"]')).toBeVisible();
});

test('Create Debit Note page renders form', async ({ page }) => {
  await openPage(page, '/billing/debit-note/new');
  await expect(page.locator('h1')).toContainText('Debit Note');
  await expect(page.locator('button:has-text("Create Debit Note")')).toBeVisible();
  await expect(page.locator('input[value^="DBN-"]')).toBeVisible();
});

test('Create Delivery Challan page renders form', async ({ page }) => {
  await openPage(page, '/billing/delivery-challan/new');
  await expect(page.locator('h1')).toContainText('Delivery Challan');
  await expect(page.locator('button:has-text("Create Delivery Challan")')).toBeVisible();
  await expect(page.locator('input[value^="DC-"]')).toBeVisible();
});

test('Create E-Invoice page renders form', async ({ page }) => {
  await openPage(page, '/billing/e-invoice/new');
  await expect(page.locator('h1')).toContainText('E-Invoice');
  await expect(page.locator('button:has-text("Generate E-Invoice")')).toBeVisible();
  await expect(page.locator('input[value^="EI-"]')).toBeVisible();
});

test('Create E-Way Bill page renders form', async ({ page }) => {
  await openPage(page, '/billing/e-way-bill/new');
  await expect(page.locator('button:has-text("Generate E-Way Bill")')).toBeVisible();
});
