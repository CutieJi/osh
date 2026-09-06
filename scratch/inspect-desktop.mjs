import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
await page.setViewportSize({ width: 1280, height: 800 });

await page.addInitScript(() => {
  window.__FORCE_BELL = true;
});

await page.goto("http://localhost:3000/", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(1500);

// Capture initial desktop screenshot
await page.screenshot({ path: "scratch/desktop-initial.png" });

// Inspect sidebar elements
const info = await page.evaluate(() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const bells = [...document.querySelectorAll('button[aria-label="Notifications"]')];
  const bell = bells.find(visible);
  const toggles = [...document.querySelectorAll('[data-theme-toggle]')];
  const toggle = toggles.find(visible);
  const rail = document.querySelector('div[class*="w-62"]');
  
  return {
    bellCount: bells.length,
    bellRect: bell ? bell.getBoundingClientRect() : null,
    toggleCount: toggles.length,
    toggleRect: toggle ? toggle.getBoundingClientRect() : null,
    railRect: rail ? rail.getBoundingClientRect() : null,
  };
});

console.log("DESKTOP INSPECT:", JSON.stringify(info, null, 2));

// Click the visible bell via real Playwright click
console.log("Clicking bell with page.click...");
await page.click('div[class*="w-62"] button[aria-label="Notifications"]');
await page.waitForTimeout(600);

const popoverInfo = await page.evaluate(() => {
  const pop = document.getElementById("notification-popover");
  const bell = document.querySelector('div[class*="w-62"] button[aria-label="Notifications"]');
  return {
    bellExpanded: bell?.getAttribute("aria-expanded"),
    popFound: !!pop,
    popRect: pop ? pop.getBoundingClientRect() : null,
  };
});
console.log("POPOVER INSPECT:", JSON.stringify(popoverInfo, null, 2));
await page.screenshot({ path: "scratch/desktop-bell-open.png" });

// Mobile check
const pageMobile = await browser.newPage();
await pageMobile.setViewportSize({ width: 375, height: 667 });
await pageMobile.addInitScript(() => {
  window.__FORCE_BELL = true;
});
await pageMobile.goto("http://localhost:3000/", { waitUntil: "load", timeout: 60000 });
await pageMobile.waitForTimeout(1000);

await pageMobile.screenshot({ path: "scratch/mobile-initial.png" });

// Click mobile bell
await pageMobile.click('header.md\\:hidden button[aria-label="Notifications"]');
await pageMobile.waitForTimeout(600);

const mobilePop = await pageMobile.evaluate(() => {
  const pop = document.getElementById("notification-popover");
  return {
    popFound: !!pop,
    popRect: pop ? pop.getBoundingClientRect() : null,
  };
});
console.log("MOBILE POPOVER INSPECT:", JSON.stringify(mobilePop, null, 2));
await pageMobile.screenshot({ path: "scratch/mobile-bell-open.png" });

await browser.close();
