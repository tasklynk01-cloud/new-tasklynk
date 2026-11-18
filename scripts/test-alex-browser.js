const assert = require("node:assert/strict");
const fs = require("node:fs");
const { chromium } = require("@playwright/test");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");

async function main() {
  let server;
  if (process.env.ALEX_TEST_START_SERVER === "true") {
    server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "-H", "127.0.0.1", "-p", "5000"], { cwd: process.cwd(), stdio: ["ignore", "pipe", "pipe"] });
    const log = fs.createWriteStream(require("node:path").join(require("node:os").tmpdir(), "tasklynk-alex-browser-server.log"));
    server.stdout.pipe(log); server.stderr.pipe(log);
    for (let i = 0; i < 90; i++) {
      try { const socket = require("node:net").connect(5000, "127.0.0.1"); await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("error", reject); }); socket.destroy(); break; } catch { await delay(1000); }
    }
  }
  const executablePath = process.env.ALEX_TEST_BROWSER || [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ].find(file => fs.existsSync(file));
  const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("http://127.0.0.1:5000/privacy", { waitUntil: "domcontentloaded", timeout: 180000 });
    await page.getByRole("button", { name: "Open Alex — TaskLynk AI Assistant" }).click({ timeout: 60000 });
    await page.getByRole("dialog").waitFor();
    assert(await page.getByRole("log").innerText().then(text => text.includes("Hi! I'm Alex")));
    await page.getByLabel("Message Alex", { exact: true }).fill("What is your name?");
    await page.getByRole("button", { name: "Send message to Alex" }).click();
    const typing = page.locator('[data-alex-typing="true"]');
    await typing.waitFor({ timeout: 60000 });
    const initialText = await typing.innerText();
    assert(initialText.length < 150, "Reply must start partially revealed, not pasted in full");
    await page.waitForTimeout(120);
    assert((await typing.innerText()).length > initialText.length, "Reply must reveal more text over time");
    await typing.waitFor({ state: "detached", timeout: 15000 });
    await page.getByRole("log").getByText("I'm Alex, the TaskLynk AI Assistant.", { exact: false }).waitFor({ timeout: 60000 });
    assert.equal(await page.getByRole("link", { name: "Create client account", exact: true }).getAttribute("href"), "/register/client");
    const handover = page.getByRole("link", { name: "WhatsApp our team", exact: true });
    assert((await handover.getAttribute("href")).startsWith("https://wa.me/254701066845"));
    assert(!(await handover.getAttribute("href")).includes("What%20is%20your%20name"));
    const bounds = await page.getByRole("dialog").boundingBox();
    assert(bounds.x >= 0 && bounds.x + bounds.width <= 391);
    assert(bounds.y >= 0 && bounds.y + bounds.height <= 845);
    await page.getByRole("button", { name: "Clear chat", exact: true }).click();
    assert(!(await page.getByRole("log").innerText()).includes("What is your name?"));
    assert(!(await page.getByRole("dialog").innerText()).match(/gemini|generativelanguage|api key/i));
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    assert.equal(await page.getByRole("dialog").count(), 0);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole("button", { name: "Open Alex — TaskLynk AI Assistant" }).click();
    assert((await page.getByRole("dialog").boundingBox()).width <= 460);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByLabel("Message Alex", { exact: true }).fill("What is your name?");
    await page.getByRole("button", { name: "Send message to Alex" }).click();
    await page.getByRole("log").getByText("I'm Alex, the TaskLynk AI Assistant.", { exact: false }).waitFor({ timeout: 60000 });
    assert.equal(await page.locator('[data-alex-typing="true"]').count(), 0);
    console.log(JSON.stringify({ mobile: "passed", desktop: "passed", identity: "passed", typingEffect: "passed", reducedMotion: "passed", links: "passed", clearChat: "passed", keyboardClose: "passed", pageErrors: errors }, null, 2));
    assert.equal(errors.length, 0);
  } finally { await browser.close(); if (server) { spawn("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" }); } }
}
main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });