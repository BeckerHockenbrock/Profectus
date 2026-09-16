import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CURRENT_ROOT = "C:\\Users\\Bhock\\compiler\\web";
const LEGACY_ROOT = "C:\\Users\\Bhock\\compiler\\.refactor-verification-legacy";
const BASELINE_DIR = "C:\\Users\\Bhock\\.gemini\\antigravity\\brain\\36bcd627-e1be-4e4b-b042-81163774bc57\\baselines";
const OUTPUT_ROOT = path.join(CURRENT_ROOT, "verification", "refactor-parity");
const SCREENSHOT_DIR = path.join(OUTPUT_ROOT, "post-refactor");
const LEGACY_SCREENSHOT_DIR = path.join(OUTPUT_ROOT, "legacy-reference");
const INVALID_BACKUP_DIR = path.join(OUTPUT_ROOT, "invalid-baseline-backups");
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const CURRENT_PORT = 3100;
const LEGACY_PORT = 3101;
const DEBUG_PORT = 9331;
const FIXED_CLOCK_MS = Date.parse("2026-09-16T08:57:30-07:00");

const VIEWPORTS = {
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
  tablet: { width: 820, height: 1180, deviceScaleFactor: 2, mobile: true },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
};

const TEST_USER = {
  uid: "isolated-test-pilot-uid",
  displayName: "Test Pilot",
  email: "pilot@altiora.internal",
};

const SAMPLE_QUESTS = [
  { id: "quest-1", title: "Review AP Physics Chapter 4 notes", description: "Newtonian mechanics and circular orbital motion problem sets", category: "School", dueDate: "2026-09-16", completed: false, focusMinutes: 45, order: 0 },
  { id: "quest-2", title: "Morning 5km endurance run", description: "Keep heart rate under 160 bpm, park perimeter trail", category: "Fitness", dueDate: "2026-09-16", completed: false, focusMinutes: 25, order: 1 },
  { id: "quest-3", title: "Refactor compiler parser AST visitor", description: "Preserve exact behavior and DOM structure", category: "Coding", dueDate: "2026-09-17", completed: false, focusMinutes: 90, order: 2 },
  { id: "quest-4", title: "Deep work reading: Systems Architecture", description: "Read chapters 3 and 4 on modular boundary design", category: "Intellect", dueDate: "", completed: false, focusMinutes: 30, order: 3 },
  { id: "quest-5", title: "Clean desk and cable management", description: "", category: "Habits", dueDate: "2026-09-15", completed: true, focusMinutes: 15, order: 4 },
  { id: "quest-6", title: "Drink 2L water & morning stretch", description: "", category: "Fitness", dueDate: "2026-09-16", completed: true, focusMinutes: 10, order: 5 },
];

const SAMPLE_PERIODS = [
  { id: "p1", name: "Period 1: Mathematics", startTime: "08:30", endTime: "09:25", room: "Room 102", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], color: "#4f46e5", icon: "calculator" },
  { id: "p2", name: "Period 2: Chemistry", startTime: "09:35", endTime: "10:30", room: "Lab B", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], color: "#059669", icon: "flask" },
  { id: "p3", name: "Period 3: English Literature", startTime: "10:40", endTime: "11:35", room: "Room 204", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], color: "#d97706", icon: "book" },
  { id: "p4", name: "Lunch Break", startTime: "11:35", endTime: "12:15", room: "Cafeteria", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], color: "#6b7280", icon: "coffee" },
  { id: "p5", name: "Period 4: History", startTime: "12:20", endTime: "13:15", room: "Room 310", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], color: "#dc2626", icon: "globe" },
];

const CURRENT_HOOKS = {
  user: 0,
  authError: 1,
  activeTab: 2,
  view: 3,
  sheetOpen: 4,
  form: 5,
  focusQuest: 6,
  selectedQuestId: 7,
  showHomeScreenHint: 8,
  quests: 9,
  loadError: 10,
  savingQuestId: 11,
  isCreating: 12,
  saveError: 13,
  draggedId: 14,
  dragStartIndex: 15,
  targetDropIndex: 16,
  dragDeltaY: 17,
  dragItemHeight: 18,
};

const LEGACY_HOOKS = {
  quests: 0,
  user: 1,
  activeTab: 2,
  view: 3,
  sheetOpen: 4,
  form: 5,
  savingQuestId: 6,
  isCreating: 7,
  authError: 8,
  saveError: 8,
  showHomeScreenHint: 9,
  focusQuest: 10,
  selectedQuestId: 11,
  draggedId: 12,
  dragStartIndex: 13,
  targetDropIndex: 14,
  dragDeltaY: 15,
  dragItemHeight: 16,
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function ensureOutputDirectories() {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(LEGACY_SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(INVALID_BACKUP_DIR, { recursive: true });
}

function verificationEnvironment() {
  return {
    ...process.env,
    NEXT_PUBLIC_FIREBASE_API_KEY: "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "",
    NEXT_PUBLIC_FIREBASE_APP_ID: "",
    TZ: "America/Los_Angeles",
  };
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString(); });
    child.stderr.on("data", (chunk) => { output += chunk.toString(); });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} exited with ${code}\n${output}`));
    });
  });
}

async function buildApplication(root, label) {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  console.log(`Building ${label} with Firebase disabled...`);
  await runProcess(process.execPath, [nextBin, "build"], {
    cwd: root,
    env: verificationEnvironment(),
  });
}

function startApplication(root, port) {
  const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
  return spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
    cwd: root,
    env: verificationEnvironment(),
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function waitForUrl(url, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await wait(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

class CdpPage {
  constructor(name, websocketUrl) {
    this.name = name;
    this.websocketUrl = websocketUrl;
    this.socket = null;
    this.nextId = 1;
    this.callbacks = new Map();
    this.consoleErrors = [];
  }

  async connect() {
    this.socket = new WebSocket(this.websocketUrl);
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.callbacks.has(message.id)) {
        const { resolve, reject, timeout } = this.callbacks.get(message.id);
        this.callbacks.delete(message.id);
        clearTimeout(timeout);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      if (message.method === "Runtime.exceptionThrown") {
        this.consoleErrors.push(`exception: ${message.params.exceptionDetails.text}`);
      }
      if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
        const text = message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ");
        this.consoleErrors.push(`console: ${text}`);
      }
      if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
        this.consoleErrors.push(`log: ${message.params.entry.text}`);
      }
    };
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
    await this.send("Page.enable");
    await this.send("Runtime.enable");
    await this.send("Log.enable");
  }

  send(method, params = {}, timeoutMilliseconds = 20000) {
    return new Promise((resolve, reject) => {
      const id = this.nextId;
      this.nextId += 1;
      const timeout = setTimeout(() => {
        this.callbacks.delete(id);
        reject(new Error(`${this.name} CDP ${method} timed out after ${timeoutMilliseconds}ms`));
      }, timeoutMilliseconds);
      this.callbacks.set(id, { resolve, reject, timeout });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(`${this.name} evaluation failed: ${result.exceptionDetails.text}`);
    }
    return result.result.value;
  }

  async setViewport(viewportName) {
    const viewport = VIEWPORTS[viewportName];
    await this.send("Emulation.setDeviceMetricsOverride", viewport);
  }

  async settle(milliseconds = 350) {
    await this.evaluate(`(async () => {
      if (document.fonts?.ready) await document.fonts.ready;
      const imageReadiness = Promise.all(
        Array.from(document.images).map((image) => image.decode?.().catch(() => undefined)),
      );
      await Promise.race([
        imageReadiness,
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
      return document.readyState;
    })()`);
    await wait(milliseconds);
  }

  async screenshot(filePath) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await this.send("Page.captureScreenshot", { format: "png" }, 15000);
        fs.writeFileSync(filePath, Buffer.from(result.data, "base64"));
        return;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  clearConsoleErrors() {
    this.consoleErrors = [];
  }

  takeConsoleErrors() {
    const errors = [...new Set(this.consoleErrors)];
    this.consoleErrors = [];
    return errors;
  }

  close() {
    this.socket?.close();
  }
}

async function createPage(url, name) {
  const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: "PUT" });
  const target = await response.json();
  const page = new CdpPage(name, target.webSocketDebuggerUrl);
  await page.connect();
  await page.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `(() => {
      const NativeDate = Date;
      const fixedClock = ${FIXED_CLOCK_MS};
      const realStart = NativeDate.now();
      class VerificationDate extends NativeDate {
        constructor(...args) {
          super(...(args.length ? args : [fixedClock + (NativeDate.now() - realStart)]));
        }
        static now() { return fixedClock + (NativeDate.now() - realStart); }
      }
      Date = VerificationDate;
    })();`,
  });
  await page.send("Page.navigate", { url });
  await page.settle(1600);
  return page;
}

async function setState(page, hooks, values) {
  const expectedSetterCount = page.name === "refactor" ? 19 : 20;
  const updates = Object.entries(values).map(([name, value]) => {
    const index = hooks[name];
    if (index === undefined) throw new Error(`No hook mapping for ${name} on ${page.name}`);
    return [index, value];
  });

  const result = await page.evaluate(`(() => {
    const element = document.querySelector('.authShell, .appShell, .focusScreen');
    if (!element) return { error: 'No application root found' };
    const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber'));
    let fiber = element[fiberKey];
    let setters = [];
    const observedSetterCounts = [];
    while (fiber) {
      const candidate = [];
      let hook = fiber.memoizedState;
      while (hook) {
        if (hook.queue?.dispatch) candidate.push(hook.queue.dispatch);
        hook = hook.next;
      }
      if (candidate.length > 0) observedSetterCounts.push(candidate.length);
      if (candidate.length === ${expectedSetterCount}) {
        setters = candidate;
        break;
      }
      fiber = fiber.return;
    }
    if (setters.length !== ${expectedSetterCount}) {
      return { error: 'Orchestrator setter shape not found', observedSetterCounts };
    }
    const updates = ${JSON.stringify(updates)};
    for (const [index, value] of updates) {
      if (typeof setters[index] !== 'function') return { error: 'Missing setter', index, setterCount: setters.length };
      setters[index](value);
    }
    return { setterCount: setters.length };
  })()`);

  if (result?.error) throw new Error(`${page.name} state injection failed: ${JSON.stringify(result)}`);
  await page.settle(450);
}

async function setBothState(current, legacy, currentValues, legacyValues = currentValues) {
  await current.send("Page.bringToFront");
  await setState(current, CURRENT_HOOKS, currentValues);
  await legacy.send("Page.bringToFront");
  await setState(legacy, LEGACY_HOOKS, legacyValues);
}

async function evaluateBoth(current, legacy, expression) {
  return Promise.all([current.evaluate(expression), legacy.evaluate(expression)]);
}

async function clickBoth(current, legacy, selector) {
  const results = await evaluateBoth(current, legacy, `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    element.click();
    return true;
  })()`);
  if (results.some((value) => value !== true)) {
    throw new Error(`Could not click ${selector}: ${JSON.stringify(results)}`);
  }
  await Promise.all([current.settle(450), legacy.settle(450)]);
}

async function setInputBoth(current, legacy, selector, value) {
  const expression = `(() => {
    const input = document.querySelector(${JSON.stringify(selector)});
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(value)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`;
  const results = await evaluateBoth(current, legacy, expression);
  if (results.some((value) => value !== true)) {
    throw new Error(`Could not set ${selector}: ${JSON.stringify(results)}`);
  }
  await Promise.all([current.settle(250), legacy.settle(250)]);
}

async function domStructure(page) {
  return page.evaluate(`(() => {
    const ignoredTags = new Set(['SCRIPT', 'STYLE', 'LINK']);
    const serialize = (node) => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent.trim() ? '#text' : null;
      if (node.nodeType !== Node.ELEMENT_NODE || ignoredTags.has(node.tagName)) return null;
      const attributes = Array.from(node.attributes)
        .filter((attribute) => !attribute.name.startsWith('__react'))
        .map((attribute) => {
          if (node.matches?.('.sisyphusFrame') && attribute.name === 'src') {
            return [attribute.name, '<animated-frame>'];
          }
          if (node.matches?.('.focusTimerBox') && attribute.name === 'aria-label') {
            return [attribute.name, '<elapsed-focus-time>'];
          }
          return [attribute.name, attribute.value];
        });
      const children = Array.from(node.childNodes).map(serialize).filter(Boolean);
      return [node.tagName.toLowerCase(), attributes, children];
    };
    return JSON.stringify(Array.from(document.body.childNodes).map(serialize).filter(Boolean));
  })()`);
}

function digest(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function firstStructureDifference(current, legacy, pathLabel = "body") {
  if (current === legacy) return null;
  if (!Array.isArray(current) || !Array.isArray(legacy)) {
    return { path: pathLabel, current, legacy };
  }
  if (current.length !== legacy.length) {
    return {
      path: `${pathLabel}.length`,
      current: current.length,
      legacy: legacy.length,
    };
  }
  for (let index = 0; index < current.length; index += 1) {
    const difference = firstStructureDifference(
      current[index],
      legacy[index],
      `${pathLabel}[${index}]`,
    );
    if (difference) return difference;
  }
  return null;
}

function postFilename(baselineFilename) {
  return baselineFilename.replace(/^baseline_/, "post_");
}

async function captureState({
  current,
  legacy,
  filename,
  viewport,
  description,
  recaptureBaseline = false,
  requiredSelector,
  results,
}) {
  await Promise.all([current.setViewport(viewport), legacy.setViewport(viewport)]);
  await Promise.all([current.settle(320), legacy.settle(320)]);

  if (requiredSelector) {
    const checks = await evaluateBoth(current, legacy, `Boolean(document.querySelector(${JSON.stringify(requiredSelector)}))`);
    if (checks.some((value) => value !== true)) {
      throw new Error(`Required selector ${requiredSelector} missing for ${filename}: ${JSON.stringify(checks)}`);
    }
  }

  const postName = postFilename(filename);
  const postPath = path.join(SCREENSHOT_DIR, postName);
  const legacyName = filename.replace(/^baseline_/, "legacy_");
  const legacyPath = path.join(LEGACY_SCREENSHOT_DIR, legacyName);
  await current.send("Page.bringToFront");
  await current.settle(180);
  await current.screenshot(postPath);
  await legacy.send("Page.bringToFront");
  await legacy.settle(180);
  await legacy.screenshot(legacyPath);

  const baselinePath = path.join(BASELINE_DIR, filename);
  if (recaptureBaseline) {
    const backupPath = path.join(INVALID_BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) fs.copyFileSync(baselinePath, backupPath);
    fs.copyFileSync(legacyPath, baselinePath);
  }

  const [currentDom, legacyDom] = await Promise.all([domStructure(current), domStructure(legacy)]);
  const domDifference = firstStructureDifference(JSON.parse(currentDom), JSON.parse(legacyDom));
  const consoleErrors = current.takeConsoleErrors();
  legacy.takeConsoleErrors();
  results.push({
    filename,
    postFilename: postName,
    legacyFilename: legacyName,
    description,
    viewport,
    viewportSize: `${VIEWPORTS[viewport].width}x${VIEWPORTS[viewport].height}@${VIEWPORTS[viewport].deviceScaleFactor}x`,
    baselineRecaptured: recaptureBaseline,
    domMatch: currentDom === legacyDom,
    domFirstDifference: domDifference,
    currentDomSha256: digest(currentDom),
    legacyDomSha256: digest(legacyDom),
    consoleErrorCount: consoleErrors.length,
    consoleErrors,
  });
  console.log(`Captured ${filename}`);
}

async function captureViewportSeries(context, number, slug, description, viewports = ["mobile", "tablet", "desktop"], options = {}) {
  for (const viewport of viewports) {
    await captureState({
      ...context,
      filename: `baseline_${number}_${slug}_${viewport}.png`,
      viewport,
      description,
      ...options,
    });
  }
}

async function captureAllStates(current, legacy, chromeVersion) {
  const results = [];
  const context = { current, legacy, results };

  await setBothState(current, legacy, { authError: "", user: null }, { authError: "", user: null });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "01", "signed_out", "Signed-out authentication card");

  await setBothState(current, legacy, { user: undefined });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_loading_auth_mobile.png", viewport: "mobile", description: "Authentication loading state", requiredSelector: ".authShell" });

  await evaluateBoth(current, legacy, `(() => {
    localStorage.clear();
    const periods = ${JSON.stringify(SAMPLE_PERIODS)};
    localStorage.setItem('todo-quest-periods-isolated-test-pilot-uid', JSON.stringify(periods));
    localStorage.setItem('todo-quest-periods-default', JSON.stringify(periods));
    return true;
  })()`);
  await setBothState(current, legacy, {
    authError: "",
    user: TEST_USER,
    quests: SAMPLE_QUESTS,
    activeTab: "tasks",
    view: "all",
  }, {
    authError: "",
    user: TEST_USER,
    quests: SAMPLE_QUESTS,
    activeTab: "tasks",
    view: "all",
  });

  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "02", "tasks_all", "Tasks All view", undefined, { requiredSelector: ".questListContainer" });

  await clickBoth(current, legacy, ".completedToggle");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "03", "tasks_completed", "Tasks Completed section expanded", undefined, { requiredSelector: ".completedQuestList" });
  await clickBoth(current, legacy, ".completedToggle");

  await setBothState(current, legacy, { view: "categories" });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "04", "tasks_categories", "Tasks Categories view", undefined, { requiredSelector: ".categoryList" });
  await setBothState(current, legacy, { view: "all" });

  await setBothState(current, legacy, { sheetOpen: true });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "05", "new_quest_sheet", "New quest sheet", undefined, { requiredSelector: ".sheetLayer[data-open='true']" });
  await setBothState(current, legacy, { sheetOpen: false });

  await setBothState(current, legacy, { selectedQuestId: "quest-1" });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "06", "task_detail_modal", "Quest detail modal", undefined, { requiredSelector: ".detailModalSheet" });
  await setBothState(current, legacy, { selectedQuestId: null });

  await setBothState(current, legacy, { focusQuest: SAMPLE_QUESTS[0] });
  await Promise.all([current.settle(600), legacy.settle(600)]);
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "07", "focus_mode", "Focus mode running", undefined, { requiredSelector: ".focusScreen" });

  await clickBoth(current, legacy, ".focusQuitButton");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_08_focus_quit_modal_mobile.png", viewport: "mobile", description: "Focus discard confirmation", requiredSelector: ".focusModalCard" });
  await clickBoth(current, legacy, ".quitConfirmButton");
  await setBothState(current, legacy, { focusQuest: null });

  await setBothState(current, legacy, { activeTab: "school" });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "09", "school_view", "School schedule", undefined, { requiredSelector: ".schoolContent" });

  await clickBoth(current, legacy, ".periodCard");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "10", "school_detail_modal", "School period detail modal", undefined, { requiredSelector: ".detailModalSheet" });
  await clickBoth(current, legacy, ".detailCloseButton");

  await clickBoth(current, legacy, ".schoolAddButton");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "11", "school_add_sheet", "Add school period sheet", undefined, { requiredSelector: ".sheetLayer[data-open='true'] .sheet" });
  await clickBoth(current, legacy, ".sheetHeading .closeButton");

  await setBothState(current, legacy, { activeTab: "stats" });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "12", "stats_view", "Stats overview", undefined, { requiredSelector: ".statsContainer" });

  await clickBoth(current, legacy, ".statAttributeCard");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "13", "stats_attribute_detail", "Stats attribute detail", undefined, { requiredSelector: ".attrDetailSheet" });

  await clickBoth(current, legacy, ".rankSecondaryBtn");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureViewportSeries(context, "14", "stats_history_modal", "Stats history modal", undefined, { requiredSelector: ".historyModalCard" });

  await setBothState(current, legacy, {
    activeTab: "tasks",
    view: "all",
    showHomeScreenHint: true,
  });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_pwa_hint_mobile.png", viewport: "mobile", description: "PWA home-screen hint", requiredSelector: ".homeScreenHint" });
  await setBothState(current, legacy, { showHomeScreenHint: false });

  await setBothState(current, legacy, { saveError: "That change did not save. Try again." });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_quest_error_banner_mobile.png", viewport: "mobile", description: "Quest mutation error banner", requiredSelector: ".questSection .formError" });
  await setBothState(current, legacy, { saveError: "" });

  await setBothState(current, legacy, {
    draggedId: "quest-1",
    dragStartIndex: 0,
    targetDropIndex: 1,
    dragDeltaY: 68,
    dragItemHeight: 68,
  });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_drag_active_mobile.png", viewport: "mobile", description: "Quest drag active", requiredSelector: "[data-dragging='true']" });
  await setBothState(current, legacy, { draggedId: null, dragStartIndex: -1, targetDropIndex: -1, dragDeltaY: 0 });

  const categoryForm = { title: "Read Chapter 5", description: "", category: "Philosophy", dueDate: "2026-09-18" };
  await setBothState(current, legacy, { sheetOpen: true, form: categoryForm });
  await evaluateBoth(current, legacy, `(() => {
    const select = document.querySelector('.sheet select');
    if (!select) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
    setter.call(select, '__new__');
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);
  await Promise.all([current.settle(350), legacy.settle(350)]);
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_new_category_entry_mobile.png", viewport: "mobile", description: "New category entry", requiredSelector: ".sheet input[placeholder='New category name…']" });
  await clickBoth(current, legacy, ".sheet .closeButton");

  await setBothState(current, legacy, { focusQuest: SAMPLE_QUESTS[0] });
  await clickBoth(current, legacy, ".focusPauseButton");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_focus_paused_mobile.png", viewport: "mobile", description: "Focus timer paused", requiredSelector: ".focusScreen[data-paused='true']" });

  await clickBoth(current, legacy, ".focusPauseButton");
  await Promise.all([current.settle(1100), legacy.settle(1100)]);
  await clickBoth(current, legacy, ".focusQuitButton");
  await clickBoth(current, legacy, ".quitCancelButton");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({
    ...context,
    filename: "baseline_state_focus_quit_cancelled_resume_mobile.png",
    viewport: "mobile",
    description: "Focus resumes after quit cancellation",
    recaptureBaseline: true,
    requiredSelector: ".focusScreen[data-paused='false']",
  });

  const currentFocusErrorSet = await current.evaluate(`(() => {
    const element = document.querySelector('.focusScreen');
    const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber'));
    let fiber = element[fiberKey];
    let setters = [];
    while (fiber && setters.length < 5) {
      const candidate = [];
      let hook = fiber.memoizedState;
      while (hook) {
        if (hook.queue?.dispatch) candidate.push(hook.queue.dispatch);
        hook = hook.next;
      }
      if (candidate.length >= 5) setters = candidate;
      fiber = fiber.return;
    }
    if (!setters[1]) return false;
    setters[1]('Could not save focus session. Please check your connection and retry.');
    return true;
  })()`);
  const legacyFocusErrorSet = await legacy.evaluate(`(() => {
    const element = document.querySelector('.focusScreen');
    const fiberKey = Object.keys(element).find((key) => key.startsWith('__reactFiber'));
    let fiber = element[fiberKey];
    let setters = [];
    while (fiber && setters.length < 5) {
      const candidate = [];
      let hook = fiber.memoizedState;
      while (hook) {
        if (hook.queue?.dispatch) candidate.push(hook.queue.dispatch);
        hook = hook.next;
      }
      if (candidate.length >= 5) setters = candidate;
      fiber = fiber.return;
    }
    if (!setters[3]) return false;
    setters[3]('Could not save focus session. Please check your connection and retry.');
    return true;
  })()`);
  if (!currentFocusErrorSet || !legacyFocusErrorSet) throw new Error("Could not inject focus failure state");
  await Promise.all([current.settle(450), legacy.settle(450)]);
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({
    ...context,
    filename: "baseline_state_focus_finish_error_retry_mobile.png",
    viewport: "mobile",
    description: "Focus finish failure with Retry",
    recaptureBaseline: true,
    requiredSelector: ".focusErrorBanner .focusErrorRetryButton",
  });
  await setBothState(current, legacy, { focusQuest: null });

  // Keep this independent state deterministic after the preceding cross-feature captures.
  await evaluateBoth(current, legacy, `(() => {
    const periods = ${JSON.stringify(SAMPLE_PERIODS)};
    localStorage.setItem('todo-quest-periods-isolated-test-pilot-uid', JSON.stringify(periods));
    localStorage.setItem('todo-quest-periods-default', JSON.stringify(periods));
    return true;
  })()`);
  await setBothState(current, legacy, { activeTab: "school" });
  await clickBoth(current, legacy, ".periodCard");
  await clickBoth(current, legacy, ".detailModalSheet .schoolPrimaryButton");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_school_edit_period_sheet_mobile.png", viewport: "mobile", description: "Edit school period sheet", requiredSelector: ".periodDeleteDirectBtn" });

  await setInputBoth(current, legacy, ".formTimeInput", "10:00");
  const timeInputCount = await current.evaluate("document.querySelectorAll('.formTimeInput').length");
  if (timeInputCount < 2) throw new Error("Expected two school time inputs");
  const setSecondTime = `(() => {
    const inputs = document.querySelectorAll('.formTimeInput');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inputs[1], '09:00');
    inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`;
  await evaluateBoth(current, legacy, setSecondTime);
  await clickBoth(current, legacy, ".sheet .saveButton");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_school_form_validation_error_mobile.png", viewport: "mobile", description: "School form validation error", requiredSelector: ".sheet .formError" });
  await clickBoth(current, legacy, ".sheet .closeButton");

  await setBothState(current, legacy, { activeTab: "stats" });
  await clickBoth(current, legacy, ".rankTestResetBtn");
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_stats_reset_notice_banner_mobile.png", viewport: "mobile", description: "Stats reset notice", requiredSelector: ".resetAlertBanner" });

  await Promise.all([
    current.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }),
    legacy.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }),
  ]);
  await Promise.all([current.settle(350), legacy.settle(350)]);
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_reduced_motion_stats_mobile.png", viewport: "mobile", description: "Stats with reduced motion", requiredSelector: ".statsContainer" });

  await setBothState(current, legacy, { focusQuest: SAMPLE_QUESTS[0] });
  current.clearConsoleErrors();
  legacy.clearConsoleErrors();
  await captureState({ ...context, filename: "baseline_state_reduced_motion_focus_mobile.png", viewport: "mobile", description: "Focus with reduced motion", requiredSelector: ".focusScreen" });

  if (results.length !== 53) throw new Error(`Expected 53 captures, got ${results.length}`);

  return {
    generatedAt: new Date().toISOString(),
    chromeVersion,
    timezone: "America/Los_Angeles",
    fixedClock: new Date(FIXED_CLOCK_MS).toISOString(),
    firebaseMode: "Disabled at build time; no Firebase network reads or writes",
    testIdentity: TEST_USER,
    questDataset: "SAMPLE_QUESTS (6 isolated mock quests)",
    schoolDataset: "SAMPLE_PERIODS (5 isolated mock periods)",
    results,
  };
}

async function main() {
  ensureOutputDirectories();
  if (!fs.existsSync(LEGACY_ROOT)) throw new Error(`Legacy source not found at ${LEGACY_ROOT}`);
  if (!fs.existsSync(BASELINE_DIR)) throw new Error(`Baseline directory not found at ${BASELINE_DIR}`);

  if (process.argv.includes("--build-current-only")) {
    await buildApplication(CURRENT_ROOT, "refactor");
    console.log("Completed the isolated refactor production build.");
    return;
  } else if (process.argv.includes("--reuse-builds")) {
    for (const root of [CURRENT_ROOT, LEGACY_ROOT]) {
      if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
        throw new Error(`Cannot reuse missing production build at ${root}`);
      }
    }
    console.log("Reusing the completed isolated production builds.");
  } else {
    await buildApplication(CURRENT_ROOT, "refactor");
    await buildApplication(LEGACY_ROOT, "legacy HEAD");
  }

  const currentServer = startApplication(CURRENT_ROOT, CURRENT_PORT);
  const legacyServer = startApplication(LEGACY_ROOT, LEGACY_PORT);
  let chromeProcess;
  let currentPage;
  let legacyPage;
  const profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "altiora-refactor-verify-"));

  try {
    await Promise.all([
      waitForUrl(`http://127.0.0.1:${CURRENT_PORT}`),
      waitForUrl(`http://127.0.0.1:${LEGACY_PORT}`),
    ]);

    chromeProcess = spawn(CHROME_PATH, [
      "--headless=new",
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDirectory}`,
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "about:blank",
    ], { stdio: "ignore" });
    await waitForUrl(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const versionResponse = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
    const version = await versionResponse.json();

    [currentPage, legacyPage] = await Promise.all([
      createPage(`http://127.0.0.1:${CURRENT_PORT}`, "refactor"),
      createPage(`http://127.0.0.1:${LEGACY_PORT}`, "legacy"),
    ]);

    const captureResults = await captureAllStates(currentPage, legacyPage, version.Browser);
    fs.writeFileSync(
      path.join(OUTPUT_ROOT, "capture-results.json"),
      JSON.stringify(captureResults, null, 2),
    );
    console.log("Captured and structurally compared all 53 states.");
  } finally {
    currentPage?.close();
    legacyPage?.close();
    chromeProcess?.kill();
    currentServer.kill();
    legacyServer.kill();
    await wait(500);
    const resolvedProfile = path.resolve(profileDirectory);
    const resolvedTemp = path.resolve(os.tmpdir());
    if (resolvedProfile.startsWith(resolvedTemp) && path.basename(resolvedProfile).startsWith("altiora-refactor-verify-")) {
      fs.rmSync(resolvedProfile, { recursive: true, force: true });
    }
  }
}

main().catch((error) => {
  console.error(error.stack || error);
  process.exitCode = 1;
});
