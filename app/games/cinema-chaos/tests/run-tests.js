const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");

function makeEl() {
  return {
    textContent: "",
    innerHTML: "",
    value: "",
    checked: false,
    disabled: false,
    className: "",
    tabIndex: 0,
    style: {},
    children: [],
    classList: {
      _set: new Set(),
      add(...c) { c.forEach(x => this._set.add(x)); },
      remove(...c) { c.forEach(x => this._set.delete(x)); },
      toggle(c, f) {
        if (f === undefined) {
          this._set.has(c) ? this._set.delete(c) : this._set.add(c);
        } else if (f) {
          this._set.add(c);
        } else {
          this._set.delete(c);
        }
      },
      contains(c) { return this._set.has(c); }
    },
    replaceChildren(...n) { this.children = n; },
    append(...n) { this.children.push(...n); },
    before() {},
    replaceWith() {},
    _attrs: {},
    setAttribute(k, v) { this._attrs[k] = String(v); },
    getAttribute(k) { return this._attrs[k] ?? null; },
    querySelector() { return makeEl(); },
    matches() { return false; },
    click() {}
  };
}

function createHarness(seed = 12345, customScripts = null, savedStorage = null) {
  const elements = new Map();
  const sandbox = {
    window: {},
    location: { search: `?seed=${seed}` },
    innerWidth: 1280,
    localStorage: {
      _s: savedStorage ? structuredClone(savedStorage) : {},
      getItem(k) { return this._s[k] ?? null; },
      setItem(k, v) { this._s[k] = String(v); },
      removeItem(k) { delete this._s[k]; },
      clear() { this._s = {}; }
    },
    URLSearchParams,
    structuredClone,
    setInterval: () => 1,
    clearInterval: () => {},
    setTimeout: () => 1,
    clearTimeout: () => {},
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, makeEl());
        return elements.get(id);
      },
      createElement() { return makeEl(); },
      createComment() { return makeEl(); },
      querySelectorAll() { return []; },
      addEventListener() {}
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);

  const scripts = customScripts || [
    "js/campaigns/registry.js",
    "js/language/elementary.js",
    "js/language/intermediate.js",
    "js/language/advanced.js",
    "js/campaigns/the-first-week.js",
    "js/sound.js",
    "js/portrait-registry.js",
    "js/characters.js",
    "js/engine.js",
    "js/ui.js"
  ].map(f => fs.readFileSync(path.join(ROOT, f), "utf8"));

  for (const code of scripts) {
    vm.runInContext(code, sandbox);
  }
  sandbox.window.onload();
  return {
    sandbox,
    elements,
    storage: sandbox.localStorage,
    Game: sandbox.CinemaDebug.game,
    UI: sandbox.CinemaDebug.ui
  };
}

// Player interactions used by the pre-existing rule/scoring tests after IDs became request-only.
function requestId(Game, customer = Game.state.currentCustomer) {
  Game.state.currentCustomer = customer;
  Game.askCustomerQuestion("ask_id", "Can I see your ID?");
}
function answerRequiredQuestions(Game, customer = Game.state.currentCustomer) {
  Game.state.currentCustomer = customer;
  for (let i = 0; i < 4; i++) {
    const ev = Game.evaluateCustomerCase(customer);
    if (!ev.needsQuestion) return ev;
    const key = customer.requiredTicketQuestion && !customer.ticket.exists ? "other_ticket"
      : ev.needsIdentification ? "ask_id" : "which_film";
    Game.askCustomerQuestion(key, key);
  }
  assert.fail("Required information must be obtainable through the question buttons");
}

function reachCustomer(Game, personId, limit = 20) {
  for (let i = 0; Game.state.shiftActive && i < limit; i++) {
    const c = Game.state.currentCustomer;
    if (c.person.id === personId) return c;
    const ev = answerRequiredQuestions(Game, c);
    Game.makeDecision(ev.validActions[0], ev.options[0]);
    Game.nextCustomerFromQueue();
  }
  assert.fail(`Expected recurring character ${personId} before end of shift`);
}

function finishShift(Game) {
  Game.state.shiftRemainingSeconds = 0;
  Game.state.shiftExpired = true;
  for (let step = 0; Game.state.shiftActive && step < 40; step++) {
    if (!Game.state.decisionLocked && Game.state.currentCustomer) {
      const ev = answerRequiredQuestions(Game);
      Game.makeDecision(ev.validActions[0], ev.options[0]);
    }
    Game.nextCustomerFromQueue();
  }
  assert.strictEqual(Game.state.shiftActive, false, "Closing must serve remaining narrative customers and finish");
}

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✕ ${name}`);
    console.error(err);
    process.exit(1);
  }
}

console.log("=== Cinema Chaos Regression Test Suite ===");

test("1. Deterministic simulation trace across Days 1-7 and Endless Mode Day 8 (80 encounters)", () => {
  function captureTrace(h) {
    const { Game, sandbox } = h;
    const trace = [];
    for (let day = 1; day <= 8; day++) {
      sandbox.CinemaDebug.setSeed(12345 + day * 100);
      sandbox.document.getElementById("settingsDaySelect").value = String(day);
      Game.jumpToDay();
      const rules = h.UI.getActiveRules ? h.UI.getActiveRules() : [];
      const briefingHtml = sandbox.document.getElementById("briefingRulesChecklist").innerHTML;
      const memoText = sandbox.document.getElementById("briefingMemoText").textContent;
      Game.startShift();
      for (let step = 0; step < 10; step++) {
        const c = Game.state.currentCustomer;
        const ev = Game.evaluateCustomerCase(c);
        trace.push({
          day,
          step,
          memoText,
          briefingHtml,
          rulesCount: rules.length,
          name: c.person.name,
          caseType: c.caseType,
          statement: c.statement,
          ticket: c.ticket,
          validActions: ev.validActions,
          reason: ev.reason
        });
        if (ev.needsQuestion) {
          if (c.requiredTicketQuestion) Game.askCustomerQuestion("other_ticket", "Do you have another ticket?");
          else Game.askCustomerQuestion("which_film", "Which film are you going to see?");
        }
        const ev2 = answerRequiredQuestions(Game, c);
        const action = ev2.validActions[0];
        const target = action === "CORRECT" ? ev2.options[0] : null;
        Game.makeDecision(action, target);
        Game.nextCustomerFromQueue();
      }
      Game.stopShiftLoop();
    }
    return trace;
  }

  const hA = createHarness(12345);
  const hB = createHarness(12345);
  const tA = captureTrace(hA);
  const tB = captureTrace(hB);
  assert.strictEqual(tA.length, 80);
  for (let i = 0; i < tA.length; i++) {
    assert.strictEqual(JSON.stringify(tA[i]), JSON.stringify(tB[i]), `Mismatch at step ${i}`);
  }
});

test("2. Day 1 rules: valid tickets admitted, errors refused because printer is closed", () => {
  const { Game } = createHarness(101);
  Game.prepareDaySchedule(1);
  Game.startShift();

  const validCust = Game.generateCustomerScenario("valid");
  Game.finalizeCustomerAtWindow(validCust);
  const evValid = Game.evaluateCustomerCase(validCust);
  assert.deepEqual(evValid.validActions, ["ADMIT"]);

  const wrongScreenCust = Game.generateCustomerScenario("screen");
  Game.finalizeCustomerAtWindow(wrongScreenCust);
  const evWrongScreen = Game.evaluateCustomerCase(wrongScreenCust);
  assert.deepEqual(evWrongScreen.validActions, ["REFUSE"], "Day 1 must refuse screen errors because printer is closed");
  assert.ok(evWrongScreen.issues.some(i => i.code === "screen"));
});

test("3. Day 2 rules: film age classifications (G, 12, 16) enforced, Leo underage without ID refused, valid adult horror admitted", () => {
  const { Game } = createHarness(202);
  Game.state.day = 2;
  Game.startShift();

  // First scripted encounter on Day 2 is 14-year-old Leo claiming to be 16 without ID for The Dark House [16]
  const leo = Game.state.currentCustomer;
  assert.strictEqual(leo.person.id, "leo");
  assert.strictEqual(leo.ticket.filmId, "the_dark_house");
  requestId(Game, leo);
  const evLeo = Game.evaluateCustomerCase(leo);
  assert.deepEqual(evLeo.validActions, ["REFUSE"]);
  assert.ok(evLeo.issues.some(i => i.code === "underage"), "Actual age, not missing ID, determines refusal");

  // Ordinary adult horror customer with valid ID card must be admitted
  const adultHorror = Game.generateCustomerScenario("adult_horror_day2");
  Game.finalizeCustomerAtWindow(adultHorror);
  assert.strictEqual(adultHorror.ticket.filmId, "the_dark_house");
  requestId(Game, adultHorror);
  const evAdult = Game.evaluateCustomerCase(adultHorror);
  assert.deepEqual(evAdult.validActions, ["ADMIT"]);

  // Procedural underage customer for a [12] or [16] film must be refused
  const underageCust = Game.generateCustomerScenario("underage");
  Game.finalizeCustomerAtWindow(underageCust);
  requestId(Game, underageCust);
  const evUnderage = Game.evaluateCustomerCase(underageCust);
  assert.deepEqual(evUnderage.validActions, ["REFUSE"]);
  assert.ok(evUnderage.issues.some(i => i.code === "underage"));
});

test("4. Day 3 & Day 4 rules: Day 3 unlocks printer and relocates Planet X to Screen 1; Day 4 enforces duplicates, Promo, and 10-minute late limit", () => {
  const { Game } = createHarness(303);
  Game.state.day = 3;
  Game.startShift();

  const planetX = Game.screening("planet_x");
  assert.strictEqual(planetX.screen, 1);
  assert.strictEqual(planetX.status, "MOVED TO SCR 1");

  // Mr Morris arrives on Day 3 affected by the broken projector -> CORRECT to Screen 1 is compliant service
  const morrisDay3 = Game.state.currentCustomer;
  assert.strictEqual(morrisDay3.person.id, "mr_morris");
  assert.strictEqual(morrisDay3.ticket.filmId, "planet_x");
  requestId(Game, morrisDay3);
  const evMorris3 = Game.evaluateCustomerCase(morrisDay3);
  assert.deepEqual(evMorris3.validActions, ["CORRECT"]);
  assert.ok(evMorris3.issues.some(i => i.code === "screen"));

  // Day 4: Someone Is Cheating (duplicates, promo tickets, 10-minute late limit, and late dilemma)
  Game.state.day = 4;
  Game.startShift();

  const dupCust = Game.generateCustomerScenario("duplicate");
  Game.finalizeCustomerAtWindow(dupCust);
  const evDup = Game.evaluateCustomerCase(dupCust);
  assert.deepEqual(evDup.validActions, ["REFUSE"]);
  assert.ok(evDup.issues.some(i => i.code === "duplicate"));

  const promoCust = Game.generateCustomerScenario("promo");
  Game.finalizeCustomerAtWindow(promoCust);
  requestId(Game, promoCust);
  const evPromo = Game.evaluateCustomerCase(promoCust);
  assert.deepEqual(evPromo.validActions, ["REFUSE"], "Promo tickets with wrong film cannot be corrected");

  const lateDilemma = Game.generateCustomerScenario("dilemma_late_day4");
  Game.finalizeCustomerAtWindow(lateDilemma);
  assert.strictEqual(lateDilemma.person.id, "mr_morris");
  assert.deepEqual(Game.evaluateCustomerCase(lateDilemma).validActions, ["QUESTION"]);
  Game.state.currentCustomer = lateDilemma;
  Game.askCustomerQuestion("which_film", "Which film are you going to see?");
  const evAfterQ = Game.evaluateCustomerCase(lateDilemma);
  assert.deepEqual(evAfterQ.validActions, ["REFUSE"]);
  assert.strictEqual(evAfterQ.discretionary, true);
  const admitRes = Game.applyDecision(lateDilemma, "ADMIT");
  assert.strictEqual(admitRes.accepted, true);
  assert.strictEqual(admitRes.exception, true);
  assert.strictEqual(admitRes.compliant, false);
});

test("5. TV Lounge completely removed from Campaign 1 while generic engine support remains intact for other campaigns", () => {
  const { Game, sandbox } = createHarness(404);
  const firstWeek = sandbox.window.CinemaChaos.CampaignRegistry.get("the-first-week");
  const firstWeekSource = fs.readFileSync(path.join(ROOT, "js/campaigns/the-first-week.js"), "utf8");

  assert.ok(!firstWeekSource.includes("TV Lounge"), "the-first-week.js must contain zero references to TV Lounge");
  assert.strictEqual(firstWeek.languagePack.tvLoungeSchedule.length, 0);

  for (let day = 1; day <= 8; day++) {
    Game.prepareDaySchedule(day);
    assert.strictEqual(Game.state.tvSchedule.length, 0, `Day ${day} of Campaign 1 must have 0 TV Lounge screenings`);
    const dayCfg = Game.dayConfig(day);
    assert.strictEqual(Boolean(dayCfg.policies.tvLoungeOpen), false, `Day ${day} must have tvLoungeOpen: false`);
    assert.ok(!dayCfg.casePool.some(t => t.startsWith("tv")), `Day ${day} casePool must not contain tv cases`);
  }
});

test("6. Day 5 rules: Love in Paris cancelled, Happy Penguins extra show, VIP pass, and Mrs Blackwood's conflicting VIP pressure", () => {
  const { Game } = createHarness(505);
  Game.state.day = 5;
  Game.startShift();

  assert.strictEqual(Game.screening("love_in_paris").status, "CANCELLED");
  assert.ok(Game.screening("happy_penguins_late"), "Extra show happy_penguins_late should exist on Day 5");

  // First scripted encounter on Day 5 is Mrs Blackwood demanding you admit unlisted VIP-000-CASH
  const blackwood = Game.state.currentCustomer;
  assert.strictEqual(blackwood.person.id, "mr_blackwood");
  assert.strictEqual(blackwood.ticket.serial, "VIP-000-CASH");
  assert.strictEqual(blackwood.managerDirective, true);
  const evBlackwood = Game.evaluateCustomerCase(blackwood);
  assert.deepEqual(evBlackwood.validActions, ["REFUSE"]);
  assert.ok(evBlackwood.issues.some(i => i.code === "vip"));

  // Cancelled film requires questioning customer then correcting
  const cancCust = Game.generateCustomerScenario("cancelled");
  Game.finalizeCustomerAtWindow(cancCust);
  assert.deepEqual(Game.evaluateCustomerCase(cancCust).validActions, ["QUESTION"]);
  Game.state.currentCustomer = cancCust;
  Game.askCustomerQuestion("which_film", "Which film are you going to see?");
  answerRequiredQuestions(Game, cancCust);
  assert.deepEqual(Game.evaluateCustomerCase(cancCust).validActions, ["CORRECT"]);

  // Authorized VIP pass (Mystery Customer VIP-900-INSPECTOR) is valid
  const vipCust = Game.generateCustomerScenario("mystery_day5");
  Game.finalizeCustomerAtWindow(vipCust);
  assert.strictEqual(vipCust.ticket.serial, "VIP-900-INSPECTOR");
  requestId(Game, vipCust);
  assert.deepEqual(Game.evaluateCustomerCase(vipCust).validActions, ["ADMIT"]);
});

test("7. CampaignRegistry registers 'the-first-week' with 7-day structure and validates schema", () => {
  const { sandbox } = createHarness(707);
  const reg = sandbox.window.CinemaChaos.CampaignRegistry;
  assert.ok(reg, "CampaignRegistry should be defined on window.CinemaChaos");

  const list = reg.list();
  assert.strictEqual(list.length, 1);
  const firstWeek = reg.get("the-first-week");
  assert.ok(firstWeek);
  assert.strictEqual(firstWeek.title, "The First Week");
  assert.strictEqual(firstWeek.subtitle, "7 Days · Learn the Job");
  assert.strictEqual(firstWeek.totalDays, 7);
  assert.strictEqual(firstWeek.playableDaysCount, 7);
  assert.strictEqual(Object.keys(firstWeek.days).length, 7);
  assert.ok(firstWeek.endlessDay, "Endless mode should be defined separately from the 7 campaign days");
  assert.strictEqual(firstWeek.endlessDay.dayNum, 8);

  // Verify Wednesday relocation, Friday cancellation + extra show, and scripted encounters are represented in data
  assert.strictEqual(firstWeek.days[3].scheduleChanges[0].type, "relocate");
  assert.strictEqual(firstWeek.days[3].scheduleChanges[0].screeningId, "planet_x");
  assert.strictEqual(firstWeek.days[5].scheduleChanges[0].type, "cancel");
  assert.strictEqual(firstWeek.days[5].scheduleChanges[0].screeningId, "love_in_paris");
  assert.strictEqual(firstWeek.days[5].scheduleChanges[1].type, "add_extra");
  assert.strictEqual(firstWeek.days[5].scheduleChanges[1].newId, "happy_penguins_late");
  assert.strictEqual(firstWeek.days[5].policies.allowVipPasses, true);

  // Verify schema validator rejects invalid campaign definitions with descriptive errors
  assert.throws(() => reg.validate(null), /Campaign definition must be an object/);
  assert.throws(() => reg.validate({ id: "INVALID ID" }), /must be lowercase alphanumeric/);
  assert.throws(() => reg.validate({
    id: "bad-campaign",
    title: "Bad",
    subtitle: "Sub",
    description: "Desc",
    languageModes: { elementary: {}, intermediate: {}, advanced: {} },
    languagePack: { films: [] }
  }), /languagePack\.films must be a non-empty array/);

  // Verify validation catches invalid references to screenings, characters, and unsupported rule types
  const makeDraft = () => structuredClone(firstWeek);

  const badScreeningRef = makeDraft();
  badScreeningRef.days[3].scheduleChanges[0].screeningId = "nonexistent_film";
  assert.throws(() => reg.validate(badScreeningRef), /Unknown screeningId 'nonexistent_film'/);

  const badEncounterScreening = makeDraft();
  badEncounterScreening.days[1].scriptedEncounters[0].targetScreeningId = "ghost_film";
  assert.throws(() => reg.validate(badEncounterScreening), /Unknown targetScreeningId 'ghost_film'/);

  const badTriggerScreening = makeDraft();
  badTriggerScreening.days[4].scriptedEncounters[5].trigger.requireLateScreeningId = "unknown_late_film";
  assert.throws(() => reg.validate(badTriggerScreening), /Unknown requireLateScreeningId 'unknown_late_film'/);

  const badCharacterRef = makeDraft();
  badCharacterRef.days[1].scriptedEncounters[0].characterId = "unknown_person";
  assert.throws(() => reg.validate(badCharacterRef), /Unknown characterId 'unknown_person'/);

  const badInspectorRef = makeDraft();
  badInspectorRef.inspectorCharacterId = "not_a_character";
  assert.throws(() => reg.validate(badInspectorRef), /inspectorCharacterId 'not_a_character' does not reference a defined character/);

  const badPolicyType = makeDraft();
  badPolicyType.days[1].policies.unsupportedRule = true;
  assert.throws(() => reg.validate(badPolicyType), /Unsupported policy or rule type 'unsupportedRule'/);

  const badCondRule = makeDraft();
  badCondRule.days[5].policies.conditionalScreenRules = [{ type: "unsupported_cond_type" }];
  assert.throws(() => reg.validate(badCondRule), /Unsupported conditional rule type 'unsupported_cond_type'/);

  const badCasePoolType = makeDraft();
  badCasePoolType.days[1].casePool.push("nonexistent_case_type");
  assert.throws(() => reg.validate(badCasePoolType), /Unsupported caseType 'nonexistent_case_type'/);
});

test("8. Save and Load compatibility preserves V2 and V1 legacy progress", () => {
  const { Game, sandbox } = createHarness(808);
  Game.state.day = 4;
  Game.state.difficulty = "chaos";
  Game.state.money = 125;
  Game.state.reputation = 92;
  Game.state.ownedUpgrades = ["scanner", "printer"];
  Game.state.completedDays = [1, 2, 3];
  Game.state.highScore = 125;
  Game.state.story = { morris: "kind", leo: "helped", sofia: "helped" };
  Game.saveProgress();

  // Reset in-memory state and reload from localStorage
  Game.state.day = 1;
  Game.state.difficulty = "normal";
  Game.state.money = 0;
  Game.state.ownedUpgrades = [];
  Game.loadProgress();

  assert.strictEqual(Game.state.day, 4);
  assert.strictEqual(Game.state.difficulty, "chaos");
  assert.strictEqual(Game.state.money, 125);
  assert.strictEqual(Game.state.reputation, 92);
  assert.deepEqual(Game.state.ownedUpgrades, ["scanner", "printer"]);
  assert.deepEqual(Game.state.completedDays, [1, 2, 3]);
  assert.strictEqual(Game.state.story.morris, "kind");

  // Also test V1 legacy migration when V2 key is absent
  sandbox.localStorage.removeItem("cinema_chaos_save_v2");
  sandbox.localStorage.setItem("cinema_chaos_save_v1", JSON.stringify({
    day: 3,
    difficulty: "relaxed",
    money: 60,
    reputation: 85,
    ownedUpgrades: ["seating"],
    completedDays: [1, 2],
    story: { sofia: "helped" }
  }));
  Game.loadProgress();
  assert.strictEqual(Game.state.day, 3);
  assert.strictEqual(Game.state.difficulty, "relaxed");
  assert.strictEqual(Game.state.money, 60);
  assert.deepEqual(Game.state.ownedUpgrades, ["seating"]);
  assert.strictEqual(Game.state.story.sofia, "helped");
});

test("9. Engine, UI, and Characters contain zero hard-coded First Week film or character identifiers", () => {
  const engineCode = fs.readFileSync(path.join(ROOT, "js/engine.js"), "utf8");
  const uiCode = fs.readFileSync(path.join(ROOT, "js/ui.js"), "utf8");
  const charCode = fs.readFileSync(path.join(ROOT, "js/characters.js"), "utf8");

  const forbiddenTokens = [
    "laughing_bananas",
    "happy_penguins",
    "happy_penguins_late",
    "the_dark_house",
    "planet_x",
    "wild_world",
    "love_in_paris",
    "the_last_train",
    "mr_morris",
    "Mr Morris",
    "VIP-770-MORRIS",
    "VIP-900-INSPECTOR",
    "Screen 2 requires red after 19:10",
    "Wearing RED Jacket",
    "Red clothes.",
    "Relaxed (A1)"
  ];

  for (const token of forbiddenTokens) {
    assert.ok(!engineCode.includes(token), `js/engine.js must not contain hard-coded token "${token}"`);
    assert.ok(!uiCode.includes(token), `js/ui.js must not contain hard-coded token "${token}"`);
    assert.ok(!charCode.includes(token), `js/characters.js must not contain hard-coded token "${token}"`);
  }
});

test("10. Minimal disposable test campaign loads and runs without modifying engine.js or ui.js", () => {
  const { Game, UI, sandbox } = createHarness(909);
  const minimalCampaignCode = fs.readFileSync(path.join(ROOT, "tests/minimal-test-campaign.js"), "utf8");
  vm.runInContext(minimalCampaignCode, sandbox);

  const reg = sandbox.window.CinemaChaos.CampaignRegistry;
  assert.strictEqual(reg.list().length, 2);
  assert.ok(reg.get("festival-showcase"));

  // Switch active campaign to festival-showcase
  Game.selectCampaign("festival-showcase");
  assert.strictEqual(Game.state.campaignId, "festival-showcase");
  assert.strictEqual(Game.today(), "FESTIVAL DAY");
  assert.strictEqual(Game.state.schedule.length, 2);

  // Verify Day 1 relocation of cosmic_voyage from Screen 1 to Screen 2
  const cosmic = Game.screening("cosmic_voyage");
  assert.ok(cosmic);
  assert.strictEqual(cosmic.screen, 2);
  assert.strictEqual(cosmic.originalScreen, 1);
  assert.strictEqual(cosmic.status, "MOVED TO SCR 2");

  // Start shift in minimal campaign
  Game.startShift();
  assert.strictEqual(Game.state.shiftActive, true);
  assert.ok(Game.state.currentCustomer, "First customer should be at the window");

  // Case index 1 should trigger scripted encounter with Dr Vega for ocean_mysteries
  const vegaCust = Game.generateCustomerScenario(null);
  Game.finalizeCustomerAtWindow(vegaCust);
  assert.strictEqual(vegaCust.person.id, "dr_vega");
  assert.strictEqual(vegaCust.person.name, "Dr Vega");
  assert.strictEqual(vegaCust.ticket.filmId, "ocean_mysteries");
  assert.ok(vegaCust.ticket.serial.startsWith("FS-1-"), "Serial prefix should use campaign's FS prefix");
  const evVega = Game.evaluateCustomerCase(vegaCust);
  assert.deepEqual(evVega.validActions, ["ADMIT"]);

  // Verify relocate case ('move') in minimal campaign requires CORRECT to Screen 2
  const moveCust = Game.generateCustomerScenario("move");
  Game.finalizeCustomerAtWindow(moveCust);
  assert.strictEqual(moveCust.ticket.filmId, "cosmic_voyage");
  assert.strictEqual(moveCust.ticket.screen, 1, "Relocated ticket should have old Screen 1 printed");
  const evMove = Game.evaluateCustomerCase(moveCust);
  assert.deepEqual(evMove.validActions, ["CORRECT"]);
  assert.ok(evMove.issues.some(i => i.code === "screen"));
  const correctRes = Game.applyDecision(moveCust, "CORRECT", "cosmic_voyage");
  assert.strictEqual(correctRes.accepted, true);
  assert.strictEqual(moveCust.ticket.screen, 2);

  // Verify 5-minute late tolerance (18:00 cosmic_voyage closes after 18:05 = 1085 mins)
  Game.state.clockMins = 1086; // 6 minutes after 18:00
  const lateCust = Game.generateCustomerScenario("late");
  Game.finalizeCustomerAtWindow(lateCust);
  const evLate = Game.evaluateCustomerCase(lateCust);
  assert.ok(evLate.issues.some(i => i.code === "late" && i.text.includes("5 minutes late")));
  assert.strictEqual(UI.getActiveRules().some(r => r.id === "move" && r.text.includes("Cosmic Voyage")), true);
});

test("11. Per-campaign save isolation and Campaign Selection Screen rendering", () => {
  const { Game, UI, sandbox } = createHarness(1010);
  const minimalCampaignCode = fs.readFileSync(path.join(ROOT, "tests/minimal-test-campaign.js"), "utf8");
  vm.runInContext(minimalCampaignCode, sandbox);

  // Progress in 'the-first-week'
  Game.selectCampaign("the-first-week");
  Game.state.day = 4;
  Game.state.money = 140;
  Game.state.reputation = 95;
  Game.state.ownedUpgrades = ["scanner", "handbook"];
  Game.state.completedDays = [1, 2, 3];
  Game.state.highScore = 140;
  Game.state.story = { morris: "kind" };
  Game.saveProgress();

  // Switch to 'festival-showcase' and verify it starts fresh at Day 1
  Game.selectCampaign("festival-showcase");
  assert.strictEqual(Game.state.day, 1);
  assert.strictEqual(Game.state.money, 0);
  assert.strictEqual(Game.state.reputation, 80);
  assert.deepEqual(Game.state.ownedUpgrades, []);
  assert.deepEqual(Game.state.completedDays, []);

  // Earn progress in 'festival-showcase'
  Game.state.money = 35;
  Game.state.reputation = 88;
  Game.state.ownedUpgrades = ["scanner"];
  Game.state.completedDays = [1];
  Game.state.highScore = 35;
  Game.saveProgress();

  // Render Campaign Selection Screen and verify both campaign cards + Coming Soon card appear
  UI.openCampaignSelectModal();
  const cardsHtml = sandbox.document.getElementById("campaignCardsGrid").innerHTML;
  assert.ok(cardsHtml.includes("The First Week"));
  assert.ok(cardsHtml.includes("7 Days · Learn the Job"));
  assert.ok(cardsHtml.includes("Festival Showcase"));
  assert.ok(cardsHtml.includes("Coming Soon"));

  // Switch back to 'the-first-week' and verify its saved progress is completely intact
  Game.startOrContinueCampaign("the-first-week");
  assert.strictEqual(Game.state.campaignId, "the-first-week");
  assert.strictEqual(Game.state.day, 4);
  assert.strictEqual(Game.state.money, 140);
  assert.strictEqual(Game.state.reputation, 95);
  assert.deepEqual(Game.state.ownedUpgrades, ["scanner", "handbook"]);
  assert.deepEqual(Game.state.completedDays, [1, 2, 3]);
  assert.strictEqual(Game.state.story.morris, "kind");

  // Replay 'festival-showcase' and ensure 'the-first-week' is still untouched
  Game.replayCampaign("festival-showcase");
  assert.strictEqual(Game.state.day, 1);
  assert.strictEqual(Game.state.money, 0);
  const firstWeekSaved = Game.getCampaignSavedState("the-first-week");
  assert.strictEqual(firstWeekSaved.day, 4);
  assert.strictEqual(firstWeekSaved.money, 140);
});

test("12. Independent Language Mode and Gameplay Difficulty + encounter boundary rule", () => {
  const { Game, sandbox } = createHarness(1111);
  const minimalCampaignCode = fs.readFileSync(path.join(ROOT, "tests/minimal-test-campaign.js"), "utf8");
  vm.runInContext(minimalCampaignCode, sandbox);

  Game.selectCampaign("festival-showcase");
  Game.setDifficulty("chaos");
  Game.setLanguageMode("elementary");
  assert.strictEqual(Game.state.difficulty, "chaos");
  assert.strictEqual(Game.state.maxWarnings, 2);
  assert.strictEqual(Game.state.languageMode, "elementary");
  assert.strictEqual(Game.languagePack().unitTitle, "Festival Showcase — Elementary Pack");

  // Start shift in Elementary mode
  Game.startShift();
  const activeCustomer = Game.state.currentCustomer;
  const statementBefore = activeCustomer.statement;
  const evBefore = Game.evaluateCustomerCase(activeCustomer);

  // Change language mode mid-encounter to 'intermediate'
  Game.setLanguageMode("intermediate");
  assert.strictEqual(Game.state.selectedLanguageMode, "intermediate");
  assert.strictEqual(Game.state.languageMode, "elementary", "Active languageMode must not change mid-encounter");
  assert.strictEqual(Game.state.pendingLanguageMode, "intermediate", "Language change must be queued for next encounter/shift boundary");
  assert.strictEqual(activeCustomer.statement, statementBefore, "Active customer's dialogue must not be rewritten mid-encounter");

  const evAfterLangClick = Game.evaluateCustomerCase(activeCustomer);
  assert.deepEqual(evAfterLangClick.validActions, evBefore.validActions, "Language selection must never alter gameplay decisions");

  // Complete current customer and advance to next customer -> boundary applies pendingLanguageMode
  if (evAfterLangClick.needsQuestion) {
    Game.askCustomerQuestion("which_film", "Which film are you going to see?");
  }
  const evReady = Game.evaluateCustomerCase(activeCustomer);
  Game.makeDecision(evReady.validActions[0], evReady.options[0] || null);
  Game.nextCustomerFromQueue();

  assert.strictEqual(Game.state.languageMode, "intermediate", "Next customer boundary must activate pending language mode");
  assert.strictEqual(Game.state.pendingLanguageMode, null);
  assert.strictEqual(Game.languagePack().unitTitle, "Festival Showcase — Intermediate Pack");
});

test("13. Main Menu navigation mid-shift pauses safely and resumes without duplicating state", () => {
  const { Game, UI } = createHarness(1212);
  Game.startShift();

  const custBefore = Game.state.currentCustomer;
  const serialBefore = custBefore.ticket.serial;
  const queueLenBefore = Game.state.queue.length;
  const clockBefore = Game.state.clockMins;
  const casesCountBefore = Game.state.casesGeneratedCount;

  // Open Campaign Selection Screen mid-shift
  UI.openCampaignSelectModal();
  assert.strictEqual(UI.modalStack.has("campaignSelectModal"), true);
  assert.ok(Game.state.modalDepth > 0, "Opening Campaign Menu mid-shift must pause via modalDepth");

  // Tick while menu is open must be a no-op
  Game.tick();
  assert.strictEqual(Game.state.clockMins, clockBefore, "Clock must not advance while Campaign Menu is open");

  // Resume active shift
  UI.resumeActiveShiftFromMenu();
  assert.strictEqual(UI.modalStack.has("campaignSelectModal"), false);
  assert.strictEqual(Game.state.modalDepth, 0);
  assert.strictEqual(Game.state.currentCustomer, custBefore, "Active customer reference must be preserved");
  assert.strictEqual(Game.state.currentCustomer.ticket.serial, serialBefore, "Active ticket must not be regenerated");
  assert.strictEqual(Game.state.queue.length, queueLenBefore, "Queue must not duplicate customers on resume");
  assert.strictEqual(Game.state.casesGeneratedCount, casesCountBefore, "No extra cases should be generated on resume");
});

test("14. Campaign-specific inspection text, active-shift switch protection, and independent Relaxed label", () => {
  const { Game, UI, sandbox } = createHarness(1414);
  const minimalCampaignCode = fs.readFileSync(path.join(ROOT, "tests/minimal-test-campaign.js"), "utf8");
  vm.runInContext(minimalCampaignCode, sandbox);

  // 1. Verify Relaxed difficulty label does not include legacy '(A1)'
  Game.setDifficulty("relaxed");
  const diffBadge = sandbox.document.getElementById("headerDifficultyBadge").textContent;
  assert.strictEqual(diffBadge, "Relaxed Mode");
  assert.ok(!diffBadge.includes("A1"), "Difficulty badge must not conflate difficulty with CEFR A1 label");

  // 2. Verify inspection text on Day 1 (no conditional appearance rule active)
  Game.selectCampaign("the-first-week");
  Game.state.day = 1;
  Game.startShift();
  const day1Compare = Game.compareTwoInspectedItems(
    { category: "portrait", value: "p1", label: "Customer" },
    { category: "rule", value: "ticket", label: "Tickets and bookings" }
  );
  assert.ok(day1Compare.message.includes("No conditional appearance rule is active"), "Day 1 should report no conditional appearance rule active");

  // 3. Verify inspection text on Day 3 of The First Week detects obvious disguises vs normal appearance
  Game.state.day = 3;
  Game.startShift();
  Game.state.currentCustomer.person.obviousDisguise = true;
  Game.state.currentCustomer.person.disguiseIssueText = "Customer is wearing a glued-on fake beard.";
  const day3DisguiseCompare = Game.compareTwoInspectedItems(
    { category: "portrait", value: "p_leo", label: "Customer" },
    { category: "rule", value: "age", label: "Age ratings & ID" }
  );
  assert.strictEqual(day3DisguiseCompare.isMatch, false);
  assert.ok(day3DisguiseCompare.message.includes("glued-on fake beard"));

  Game.state.currentCustomer.person.obviousDisguise = false;
  const day3NormalCompare = Game.compareTwoInspectedItems(
    { category: "portrait", value: "p_normal", label: "Customer" },
    { category: "rule", value: "age", label: "Age ratings & ID" }
  );
  assert.ok(day3NormalCompare.message.includes("No conditional appearance rule is active"));

  // 4. Verify active-shift protection when selecting campaigns from the menu
  const activeCust = Game.state.currentCustomer;
  const activeSerial = activeCust.ticket.serial;
  UI.openCampaignSelectModal();

  // Selecting the currently active campaign from the menu resumes the shift instead of discarding it
  const sameCampRes = Game.startOrContinueCampaign("the-first-week");
  assert.strictEqual(sameCampRes.status, "resumed");
  assert.strictEqual(Game.state.shiftActive, true);
  assert.strictEqual(Game.state.currentCustomer, activeCust);
  assert.strictEqual(Game.state.currentCustomer.ticket.serial, activeSerial);

  // Selecting a DIFFERENT campaign while a shift is active warns first and does NOT discard the shift
  UI.openCampaignSelectModal();
  const switchRes = Game.startOrContinueCampaign("festival-showcase");
  assert.strictEqual(switchRes.status, "warned");
  assert.strictEqual(Game.state.campaignId, "the-first-week", "Campaign must not switch before confirmation");
  assert.strictEqual(Game.state.shiftActive, true, "Shift must remain active until abandonment is confirmed");
  assert.strictEqual(Game.state.currentCustomer, activeCust, "Active customer must not be discarded without confirmation");
  const bannerHtml = sandbox.document.getElementById("campaignMenuActiveShiftBanner").innerHTML;
  assert.ok(bannerHtml.includes("Abandon Active Shift?"), "Warning banner must prompt before abandoning shift");

  // Confirming the pending switch abandons the old shift and loads the new campaign
  const confirmRes = Game.confirmPendingCampaignAction();
  assert.strictEqual(confirmRes.status, "switched");
  assert.strictEqual(Game.state.campaignId, "festival-showcase");
  assert.strictEqual(Game.state.shiftActive, false);

  // 5. Verify inspection text in 'festival-showcase' describes its custom festival glasses rule
  Game.startShift();
  Game.state.currentCustomer.person.glasses = true;
  const festCompare = Game.compareTwoInspectedItems(
    { category: "portrait", value: "WEARING GLASSES", label: "Customer" },
    { category: "rule", value: "gala_glasses", label: "Screen 1: festival glasses" }
  );
  assert.strictEqual(festCompare.message, "Glasses worn. Screen 1 requires festival glasses after 20:00. All other rules apply.");
});

test("15. Customer patience, low-patience visual states, departures, statistics separation, and save compatibility", () => {
  const { Game, UI, sandbox, storage } = createHarness(1515);

  // 1 & 2. Patience remains unchanged before shift start, while paused, or when a modal is open
  Game.setDifficulty("normal");
  Game.state.shiftActive = false;
  Game.state.queue = [{ person: { name: "PreShift Guest", coatColor: "#123456" }, patience: 100 }];
  Game.updateQueuePatience();
  assert.strictEqual(Game.state.queue[0].patience, 100, "Patience must not decrease before shift has started");

  Game.startShift();
  assert.ok(Game.state.queue.length >= 1, "Shift starts with waiting customer(s) in queue");
  const w0 = Game.state.queue[0];
  w0.patience = 100;

  // Pause guard
  Game.state.paused = true;
  Game.updateQueuePatience();
  assert.strictEqual(w0.patience, 100, "Patience must not decrease while game is paused");
  Game.state.paused = false;

  // Modal guard (e.g., Guide modal or Campaign Selection Menu open)
  UI.openGuideModal();
  assert.ok(Game.state.modalDepth > 0);
  Game.updateQueuePatience();
  assert.strictEqual(w0.patience, 100, "Patience must not decrease while a modal is open");
  UI.closeGuideModal();

  UI.openCampaignSelectModal();
  assert.ok(Game.state.modalDepth > 0);
  Game.updateQueuePatience();
  assert.strictEqual(w0.patience, 100, "Patience must not decrease while Campaign Selection Menu is open");
  UI.resumeActiveShiftFromMenu();

  // 3. Relaxed mode prevents patience loss and abandonment
  Game.setDifficulty("relaxed");
  w0.patience = 5;
  Game.updateQueuePatience();
  assert.strictEqual(w0.patience, 5, "Relaxed mode must not reduce customer patience");
  assert.strictEqual(Game.state.queue.includes(w0), true, "Customers must not abandon the queue in Relaxed mode");

  // Countdown is the only pressure on Days 1–2; queue walkouts start on Day 3.
  Game.setDifficulty("normal");
  assert.strictEqual(Game.getPatienceDecayRate(), 0);
  Game.state.day = 4;
  // 4. Normal and Chaos modes apply their intended patience rates
  Game.setDifficulty("normal");
  w0.patience = 100;
  Game.updateQueuePatience();
  assert.strictEqual(w0.patience, 99.25, "Normal mode must decrease patience by 0.75 per tick");

  Game.setDifficulty("chaos");
  w0.patience = 100;
  Game.updateQueuePatience();
  assert.strictEqual(w0.patience, 98.5, "Chaos mode must decrease patience by 1.5 per tick");

  // 5. The seating upgrade reduces patience loss by / 1.4
  Game.state.ownedUpgrades = ["seating"];
  Game.setDifficulty("normal");
  w0.patience = 100;
  Game.updateQueuePatience();
  assert.ok(Math.abs(w0.patience - (100 - 0.75 / 1.4)) < 1e-9, "Seating upgrade must slow Normal patience decay by / 1.4");

  Game.setDifficulty("chaos");
  w0.patience = 100;
  Game.updateQueuePatience();
  assert.ok(Math.abs(w0.patience - (100 - 1.5 / 1.4)) < 1e-9, "Seating upgrade must slow Chaos patience decay by / 1.4");
  Game.state.ownedUpgrades = [];

  // Visual states & accessible cues (Normal > 40, Impatient <= 40, Critical <= 20)
  assert.strictEqual(Game.getPatienceState(75), "normal");
  assert.strictEqual(Game.getPatienceState(40), "impatient");
  assert.strictEqual(Game.getPatienceState(25), "impatient");
  assert.strictEqual(Game.getPatienceState(20), "critical");
  assert.strictEqual(Game.getPatienceState(5), "critical");

  w0.patience = 35;
  UI.renderQueue();
  let queueHtml = sandbox.document.getElementById("queueVisualContainer").innerHTML;
  assert.ok(queueHtml.includes('data-patience-state="impatient"'), "Queue item at 35% must have impatient state attribute");
  assert.ok(queueHtml.includes("Impatient"), "Impatient state must include accessible non-color label");

  w0.patience = 15;
  UI.renderQueue();
  queueHtml = sandbox.document.getElementById("queueVisualContainer").innerHTML;
  assert.ok(queueHtml.includes('data-patience-state="critical"'), "Queue item at 15% must have critical state attribute");
  assert.ok(queueHtml.includes("Critical"), "Critical state must include accessible non-color label");

  // 6, 7 & 8. Customer leaves queue at 0 patience, applies -3 reputation, increments customersLost, and does NOT increment mistakes
  Game.setDifficulty("normal");
  UI.clearDepartureBanner();
  const repBefore = Game.state.reputation;
  const mistakesBefore = Game.state.shiftStats.mistakes;
  const lostBefore = Game.state.shiftStats.customersLost;
  const totalLostBefore = Game.state.totalCustomersLost;

  w0.guaranteedEncounter = false; w0.preventQueueWalkout = false; w0.plan = {kind:'ordinary'}; // Test an ordinary queued visitor
  w0.patience = 0.5; // Will hit 0 on next Normal tick (0.75 decay)
  const departed = Game.updateQueuePatience();
  assert.strictEqual(departed.length, 1, "One customer should depart when patience reaches 0");
  assert.strictEqual(Game.state.queue.includes(w0), false, "Departed customer must be removed from queue");
  assert.strictEqual(Game.state.reputation, repBefore - 3, "Abandonment must apply -3 reputation penalty");
  assert.strictEqual(Game.state.shiftStats.customersLost, lostBefore + 1, "Abandonment must increment shiftStats.customersLost");
  assert.strictEqual(Game.state.totalCustomersLost, totalLostBefore + 1, "Abandonment must increment state.totalCustomersLost");
  assert.strictEqual(Game.state.shiftStats.mistakes, mistakesBefore, "Abandonment must NOT increment shiftStats.mistakes");

  const bannerEl = sandbox.document.getElementById("queueDepartureBanner");
  assert.strictEqual(bannerEl.classList.contains("hidden"), false, "Departure notification banner must be visible");
  assert.ok(bannerEl.innerHTML.includes("CUSTOMER LEFT THE QUEUE"), "Banner must announce customer departure");
  assert.ok(bannerEl.innerHTML.includes("Reputation −3"), "Banner must show Reputation −3 penalty");

  // 9. Multiple departures do not break the queue and group cleanly
  UI.clearDepartureBanner();
  const c1 = { person: { name: "Guest One", coatColor: "#111" }, patience: 0.4 };
  const c2 = { person: { name: "Guest Two", coatColor: "#222" }, patience: 80 };
  const c3 = { person: { name: "Guest Three", coatColor: "#333" }, patience: 0.2 };
  Game.state.queue = [c1, c2, c3];
  const repBeforeMulti = Game.state.reputation;
  const multiDeparted = Game.updateQueuePatience();
  assert.strictEqual(multiDeparted.length, 2, "Both expiring customers must depart on the same tick");
  assert.strictEqual(Game.state.queue.length, 1, "Surviving customer must remain in queue");
  assert.strictEqual(Game.state.queue[0], c2, "First-come, first-served order of remaining queue must be preserved");
  assert.strictEqual(Game.state.reputation, repBeforeMulti - 6, "Two simultaneous departures must apply -6 reputation");
  assert.strictEqual(Game.state.shiftStats.customersLost, 3, "shiftStats.customersLost must reflect all 3 departed customers");
  assert.strictEqual(Game.state.shiftStats.mistakes, mistakesBefore, "shiftStats.mistakes must still remain 0");
  assert.ok(bannerEl.innerHTML.includes("2 CUSTOMERS LEFT THE QUEUE"), "Banner must group multiple departures");
  assert.ok(bannerEl.innerHTML.includes("Reputation −6"), "Banner must show grouped Reputation −6");

  // Verify End-of-Shift report displays Customers Lost separately from Inspection Mistakes
  Game.endShift("SHIFT COMPLETE");
  assert.strictEqual(String(sandbox.document.getElementById("reportCustomersLost").textContent), "3");
  assert.strictEqual(String(sandbox.document.getElementById("reportMistakes").textContent), "0");

  // 10. Older saved games without totalCustomersLost load without errors and default to 0
  storage.clear();
  storage.setItem("cinema_chaos_save_v2", JSON.stringify({
    version: 2,
    day: 3,
    difficulty: "normal",
    money: 95,
    reputation: 82,
    ownedUpgrades: ["seating"],
    completedDays: [1, 2],
    highScore: 95,
    story: {}
  }));
  Game.loadProgress("the-first-week");
  assert.strictEqual(Game.state.day, 3);
  assert.strictEqual(Game.state.money, 95);
  assert.strictEqual(Game.state.totalCustomersLost, 0, "Older V2 save without totalCustomersLost must default to 0");

  // 11. Menu pause/resume and campaign switching preserve patience and per-campaign totalCustomersLost
  const minimalCampaignCode = fs.readFileSync(path.join(ROOT, "tests/minimal-test-campaign.js"), "utf8");
  vm.runInContext(minimalCampaignCode, sandbox);

  Game.state.totalCustomersLost = 4;
  Game.saveProgress();
  Game.selectCampaign("festival-showcase");
  assert.strictEqual(Game.state.totalCustomersLost, 0, "New campaign starts with 0 totalCustomersLost");
  Game.selectCampaign("the-first-week");
  assert.strictEqual(Game.state.totalCustomersLost, 4, "Switching back restores campaign's saved totalCustomersLost");
});

test("16. Shift objectives, authoritative warning thresholds, mistakes vs warnings vs discretionary admissions, and pass/fail progression", () => {
  const { Game, UI, sandbox } = createHarness(1616);
  const doc = sandbox.document;

  // 1 & 4. Authoritative warning thresholds in Relaxed, Normal, and Chaos reflected in Briefing & HUD
  for (const [diff, expectedLimit, expectedOrd] of [
    ["relaxed", Game.getMaxWarnings("relaxed"), Game.getWarningOrdinal(Game.getMaxWarnings("relaxed"))],
    ["normal", Game.getMaxWarnings("normal"), Game.getWarningOrdinal(Game.getWarningThresholds ? Game.getMaxWarnings("normal") : 3)],
    ["chaos", Game.getMaxWarnings("chaos"), Game.getWarningOrdinal(Game.getMaxWarnings("chaos"))]
  ]) {
    Game.setDifficulty(diff);
    assert.strictEqual(Game.state.maxWarnings, expectedLimit, `maxWarnings must match authoritative limit for ${diff}`);
    assert.strictEqual(doc.getElementById("warningsDisplay").textContent, `0 / ${expectedLimit}`);
    assert.strictEqual(doc.getElementById("briefingWarningThresholdBadge").textContent, `Management warnings: 0 / ${expectedLimit}`);
    assert.ok(
      doc.getElementById("briefingObjectiveLead").textContent.includes("countdown ends"),
      "Briefing must display clear shift objective"
    );
    assert.ok(
      doc.getElementById("briefingObjectiveRuleNote").textContent.includes(`Wrong decisions can cause warnings`),
      `Briefing must state the ${expectedOrd} warning dismissal rule for ${diff}`
    );
  }

  // 5. Distinction between inspection mistakes and management warnings (including Handbook forgiveness)
  Game.setDifficulty("normal"); // limit = 3
  Game.state.day = 1;
  Game.state.ownedUpgrades = ["handbook"];
  Game.startShift();

  // Force a valid customer and deliberately REFUSE them (an inspection mistake)
  const validCust = Game.generateCustomerScenario("valid");
  Game.finalizeCustomerAtWindow(validCust);
  Game.state.currentCustomer = validCust;
  Game.makeDecision("REFUSE");

  // Because of the Handbook upgrade, this first mistake is recorded as an inspection mistake (1), but 0 warnings!
  assert.strictEqual(Game.state.shiftStats.mistakes, 1, "Incorrect decision must increment inspection mistakes");
  assert.strictEqual(Game.state.warnings, 0, "Handbook upgrade forgives the first management warning, keeping warnings distinct from mistakes");
  assert.ok(doc.getElementById("deskFeedbackBanner").textContent.includes("Inspection mistake"), "Feedback must identify inspection mistake");
  assert.ok(doc.getElementById("deskFeedbackBanner").textContent.includes("Ticket refused incorrectly"), "Feedback must explain why warning was triggered/forgiven");

  // Remove handbook and make another mistake -> now both mistakes (2) and warnings (1 / 3) increment
  Game.state.ownedUpgrades = [];
  Game.nextCustomerFromQueue();
  const validCust2 = Game.generateCustomerScenario("valid");
  Game.finalizeCustomerAtWindow(validCust2);
  Game.state.currentCustomer = validCust2;
  Game.makeDecision("REFUSE");

  assert.strictEqual(Game.state.shiftStats.mistakes, 2);
  assert.strictEqual(Game.state.warnings, 1);
  assert.strictEqual(doc.getElementById("warningsDisplay").textContent, `1 / ${Game.getMaxWarnings("normal")}`);
  assert.strictEqual(doc.getElementById("warningsBox").getAttribute("data-warning-state"), "caution");
  assert.ok(
    doc.getElementById("deskFeedbackBanner").textContent.includes(`Ticket refused incorrectly — Management warning 1 / ${Game.getMaxWarnings("normal")}`),
    "Feedback must state specific warning reason and count"
  );

  // 6. Deliberate discretionary admission (Day 4 late dilemma) issues a warning WITHOUT counting as an inspection mistake
  Game.state.day = 4;
  Game.startShift();
  Game.state.clockMins = 1108; // Past 18:25 so 18:15 screening is >10 mins late
  const dilemmaCust = Game.generateCustomerScenario("dilemma_late_day4");
  Game.finalizeCustomerAtWindow(dilemmaCust);
  Game.state.currentCustomer = dilemmaCust;
  UI.renderCustomer(dilemmaCust);
  UI.renderTicketOnDesk(dilemmaCust);

  // Verify pre-decision trade-off notice is rendered on the desk
  const deskCard = doc.getElementById("deskDocumentArea").children[0];
  const hasDilemmaWarning = deskCard && deskCard.children.some(ch => String(ch.textContent).includes("Management may issue a warning if you make an exception"));
  assert.ok(hasDilemmaWarning, "Ticket desk must warn player before making a discretionary exception");

  Game.askCustomerQuestion("which_film", "Which film are you going to see?");
  const cashBeforeExc = Game.state.money;
  const repBeforeExc = Game.state.reputation;
  Game.makeDecision("ADMIT"); // Deliberate compassionate exception

  assert.strictEqual(Game.state.shiftStats.mistakes, 0, "Deliberate discretionary admission must NOT count as an inspection mistake");
  assert.strictEqual(Game.state.shiftStats.exceptions, 1, "Discretionary admission must be tracked in shiftStats.exceptions");
  assert.strictEqual(Game.state.warnings, 1, "Discretionary admission must issue 1 management warning");
  assert.strictEqual(Game.state.money, cashBeforeExc + 6, "Discretionary admission awards +€6");
  assert.strictEqual(Game.state.reputation, repBeforeExc + 4, "Discretionary admission awards +4 reputation");
  assert.ok(
    doc.getElementById("deskFeedbackBanner").textContent.includes("Discretionary admission — Management warning issued"),
    "Feedback must clearly label discretionary admission and warning"
  );

  // 7. Customer abandonment does NOT count as an inspection mistake or a management warning
  Game.state.queue = [{ person: { name: "Impatient Guest", coatColor: "#444" }, patience: 0.2 }];
  Game.updateQueuePatience();
  assert.strictEqual(Game.state.shiftStats.customersLost, 1);
  assert.strictEqual(Game.state.shiftStats.mistakes, 0, "Customer abandonment must not increment mistakes");
  assert.strictEqual(Game.state.warnings, 1, "Customer abandonment must not issue a management warning");

  // 2 & 8. Passing a shift below the warning threshold unlocks the next day and updates Staff Report
  Game.state.clockMins = Game.state.clockEndMins;
  finishShift(Game); // Serve the guaranteed visitors before completing the shift.
  assert.strictEqual(Game.state.shiftActive, false);
  assert.strictEqual(Game.state.lastShiftDismissed, false);
  assert.strictEqual(doc.getElementById("reportModalTitle").textContent, "TIME UP — CINEMA CLOSED");
  assert.strictEqual(
    doc.getElementById("reportOutcomeSummary").textContent,
    "You completed your shift without reaching the management warning limit."
  );
  assert.strictEqual(doc.getElementById("reportWarnings").textContent, `1 / ${Game.getMaxWarnings("normal")}`);
  assert.strictEqual(String(doc.getElementById("reportMistakes").textContent), "0");
  assert.ok(Number(doc.getElementById("reportCustomersLost").textContent) >= 1, "Timed out ordinary visitors count as unserved");
  assert.ok(Game.state.completedDays.includes(4), "Passing Day 4 must record Day 4 in completedDays");
  assert.strictEqual(doc.getElementById("nextDayContinueBtn").classList.contains("hidden"), false);

  const advancedOk = Game.advanceToNextDay();
  assert.strictEqual(advancedOk, true);
  assert.strictEqual(Game.state.day, 5, "Advancing after passing Day 4 must unlock Day 5");
  assert.strictEqual(Game.state.warnings, 0, "Advancing to next day must reset warnings to 0");

  // 3, 9 & 10. Failing immediately when warning threshold is reached, blocking progression, and requiring replay
  Game.setDifficulty("normal"); // limit = 3
  Game.startShift();
  const limit = Game.getMaxWarnings("normal");

  for (let i = 1; i <= limit; i++) {
    const cust = Game.generateCustomerScenario("valid");
    Game.finalizeCustomerAtWindow(cust);
    Game.state.currentCustomer = cust;
    Game.state.decisionLocked = false;
    answerRequiredQuestions(Game, cust);
    Game.makeDecision("REFUSE"); // Wrong decision -> issues warning i
    if (i < limit) {
      assert.strictEqual(Game.state.shiftActive, true, `Shift should remain active at ${i} / ${limit} warnings`);
      if (i === limit - 1) {
        assert.strictEqual(doc.getElementById("warningsBox").getAttribute("data-warning-state"), "danger", "HUD must show danger state on final warning");
        assert.strictEqual(doc.getElementById("warningsUrgencyBadge").textContent, "Final Warning");
      }
      Game.nextCustomerFromQueue();
    }
  }

  // On the 3rd warning, the shift must fail immediately without waiting for Next Customer
  assert.strictEqual(Game.state.warnings, limit);
  assert.strictEqual(Game.state.shiftActive, false, "Reaching the warning threshold must immediately end the shift");
  assert.strictEqual(Game.state.lastShiftDismissed, true);
  assert.strictEqual(doc.getElementById("warningsBox").getAttribute("data-warning-state"), "dismissed");
  assert.strictEqual(doc.getElementById("reportModalTitle").textContent, "SHIFT FAILED — MANAGEMENT DISMISSED YOU");
  assert.strictEqual(
    doc.getElementById("reportOutcomeSummary").textContent,
    `You received ${limit} management warnings. The limit for this shift was ${limit}.`
  );
  assert.strictEqual(doc.getElementById("reportWarnings").textContent, `${limit} / ${limit}`);
  assert.strictEqual(Game.state.completedDays.includes(5), false, "Failing Day 5 must NOT add Day 5 to completedDays");
  assert.strictEqual(doc.getElementById("nextDayContinueBtn").classList.contains("hidden"), true, "Continue button must be hidden after failure");
  assert.ok(doc.getElementById("replayShiftBtn").textContent.includes("Replay Day 5"), "Replay button must indicate Day 5 must be replayed");

  // Attempting to advance after failure (or bypass via menu) must not unlock Day 6
  assert.strictEqual(Game.advanceToNextDay(), false, "advanceToNextDay() must refuse to advance after a failed shift");
  assert.strictEqual(Game.state.day, 5, "Day must remain 5 after failed shift");

  UI.openCampaignSelectModal();
  Game.startOrContinueCampaign("the-first-week");
  assert.strictEqual(Game.state.day, 5, "Continuing from Campaign Selection Screen must stay on Day 5");

  // Replaying current day resets shift counters and prepares Day 5 briefing cleanly
  Game.replayCurrentDay();
  assert.strictEqual(Game.state.day, 5);
  assert.strictEqual(Game.state.warnings, 0);
  assert.strictEqual(Game.state.lastShiftDismissed, false);
  assert.strictEqual(Game.state.shiftStats.mistakes, 0);
  assert.strictEqual(doc.getElementById("warningsDisplay").textContent, `0 / ${limit}`);

  // 11 & 12. Warning feedback and thresholds remain consistent when switching campaigns
  const minimalCampaignCode = fs.readFileSync(path.join(ROOT, "tests/minimal-test-campaign.js"), "utf8");
  vm.runInContext(minimalCampaignCode, sandbox);

  Game.selectCampaign("festival-showcase");
  Game.setDifficulty("chaos"); // limit = 2
  const chaosLimit = Game.getMaxWarnings("chaos");
  assert.strictEqual(doc.getElementById("briefingWarningThresholdBadge").textContent, `Management warnings: 0 / ${chaosLimit}`);
  Game.startShift();

  const festValid = Game.generateCustomerScenario("valid");
  Game.finalizeCustomerAtWindow(festValid);
  Game.state.currentCustomer = festValid;
  Game.makeDecision("REFUSE");
  assert.strictEqual(Game.state.warnings, 1);
  assert.ok(
    doc.getElementById("deskFeedbackBanner").textContent.includes(`Ticket refused incorrectly — Management warning 1 / ${chaosLimit}`),
    "Warning feedback must be consistent across campaigns"
  );
});

test("17. Seven-day campaign progression (Monday Day 1 through Sunday Day 7) and Endless Mode Day 8", () => {
  const { Game, sandbox } = createHarness(1717);
  const doc = sandbox.document;
  const expectedDays = [
    [1, "MONDAY", "Day 1 — The New Employee"],
    [2, "TUESDAY", "Day 2 — Not Old Enough"],
    [3, "WEDNESDAY", "Day 3 — The Broken Projector"],
    [4, "THURSDAY", "Day 4 — Someone Is Cheating"],
    [5, "FRIDAY", "Day 5 — Special Treatment"],
    [6, "SATURDAY", "Day 6 — The Big Premiere"],
    [7, "SUNDAY", "Day 7 — The Final Inspection"]
  ];

  for (const [dayNum, dayName, title] of expectedDays) {
    assert.strictEqual(Game.state.day, dayNum);
    const cfg = Game.dayConfig(dayNum);
    assert.strictEqual(cfg.dayName, dayName);
    assert.strictEqual(cfg.title, title);

    Game.startShift();
    // Complete the current and guaranteed encounters at closing time.
    finishShift(Game);
    assert.strictEqual(Game.state.shiftActive, false);
    assert.strictEqual(Game.state.lastShiftDismissed, false);
    assert.ok(Game.state.completedDays.includes(dayNum));

    if (dayNum < 7) {
      assert.ok(doc.getElementById("nextDayContinueBtn").textContent.includes(`CONTINUE TO DAY ${dayNum + 1}`));
      assert.strictEqual(Game.advanceToNextDay(), true);
    } else {
      assert.ok(doc.getElementById("nextDayContinueBtn").textContent.includes("ENTER ENDLESS MODE"));
      assert.ok(Game.state.lastCampaignEnding, "Completing Day 7 must evaluate a campaign ending");
      assert.strictEqual(Game.advanceToNextDay(), true);
    }
  }

  // Day 8 is Endless Mode
  assert.strictEqual(Game.state.day, 8);
  assert.strictEqual(Game.dayConfig(8).dayName, "ENDLESS SHIFT");
});

test("18. Age restriction rules, exact date-of-birth calculation (on/before/after birthday, leap years), and ID inspection", () => {
  const { Game } = createHarness(1818);
  Game.state.day = 2; // Tuesday, 2026-10-13
  Game.startShift();

  // Exact birthday boundary tests on 2026-10-13
  assert.strictEqual(Game.calculateAge("2010-10-13", "2026-10-13"), 16, "Birthday today (13 Oct 2010) must be exactly 16");
  assert.strictEqual(Game.calculateAge("2010-10-12", "2026-10-13"), 16, "Birthday yesterday (12 Oct 2010) must be 16");
  assert.strictEqual(Game.calculateAge("2010-10-14", "2026-10-13"), 15, "Birthday tomorrow (14 Oct 2010) must still be 15");

  // Leap year and invalid calendar date validation
  assert.strictEqual(Game.isValidCalendarDate("2008-02-29"), true, "2008 is a leap year");
  assert.strictEqual(Game.isValidCalendarDate("2009-02-29"), false, "2009 is not a leap year");
  assert.strictEqual(Game.isValidCalendarDate("2010-02-30"), false, "Feb 30 is never valid");

  // 15-year-old turning 16 tomorrow must be refused for [16] The Dark House
  const almost16 = Game.generateCustomerScenario("valid");
  Game.finalizeCustomerAtWindow(almost16);
  almost16.ticket.filmId = "the_dark_house";
  almost16.ticket.filmTitle = "The Dark House";
  almost16.ticket.genreLabel = "Horror";
  almost16.ticket.screen = 3;
  almost16.ticket.time = "21:00";
  almost16.known.preference = { ids: ["the_dark_house"] };
  almost16.intent = { ids: ["the_dark_house"] };
  Game.state.bookings[almost16.ticket.serial].screeningId = "the_dark_house";
  almost16.claimedAge = 15;
  almost16.trueAge = 15;
  almost16.idCard = { exists: true, presented: true, holderName: almost16.person.name, dob: "2010-10-14" };
  const evAlmost16 = Game.evaluateCustomerCase(almost16);
  assert.deepEqual(evAlmost16.validActions, ["REFUSE"]);
  assert.ok(evAlmost16.issues.some(i => i.code === "underage"));

  // Turning 16 today (2010-10-13) must be admitted for [16] The Dark House
  almost16.claimedAge = 16;
  almost16.trueAge = 16;
  almost16.idCard.dob = "2010-10-13";
  const evExact16 = Game.evaluateCustomerCase(almost16);
  assert.deepEqual(evExact16.validActions, ["ADMIT"]);

  // Inspect Mode comparisons for ID DOB, age, name, and photo
  Game.state.currentCustomer = almost16;
  const dobScheduleCmp = Game.compareTwoInspectedItems(
    { category: "id_dob", value: "2010-10-13", label: "ID DOB" },
    { category: "schedule_row", value: "the_dark_house", label: "The Dark House" }
  );
  assert.strictEqual(dobScheduleCmp.isMatch, true);
  assert.ok(dobScheduleCmp.message.includes("Age 16"));
});

test("19. Leo's six-day narrative arc (Days 2-6 disguises/forgeries refused, Day 7 honest visit for G comedy admitted)", () => {
  const { Game } = createHarness(1919);

  // Day 2: The Simple Lie (claims 16, no ID, wants The Dark House [16]) -> REFUSE
  Game.state.day = 2;
  Game.startShift();
  const leo2 = Game.state.currentCustomer;
  assert.strictEqual(leo2.person.id, "leo");
  assert.strictEqual(leo2.ticket.filmId, "the_dark_house");
  requestId(Game, leo2);
  assert.deepEqual(Game.evaluateCustomerCase(leo2).validActions, ["REFUSE"]);
  Game.makeDecision("REFUSE");
  assert.strictEqual(Game.state.story.leo_day2_outcome, "refused");
  assert.strictEqual(Game.state.story.leo_caught_count, 1);

  // Day 3: The Fake Beard -> REFUSE
  Game.state.day = 3;
  Game.startShift();
  const leo3 = Game.generateCustomerScenario("leo_day3");
  Game.finalizeCustomerAtWindow(leo3);
  Game.state.currentCustomer = leo3;
  assert.strictEqual(leo3.person.id, "leo");
  assert.strictEqual(leo3.person.fakeBeard, true);
  assert.strictEqual(leo3.person.obviousDisguise, true);
  assert.ok(leo3.statement.includes("Me again?"), "Day 3 dialogue reflects Day 2 refusal");
  assert.deepEqual(Game.evaluateCustomerCase(leo3).validActions, ["REFUSE"]);
  Game.makeDecision("REFUSE");
  assert.strictEqual(Game.state.story.leo_beard_detected, "yes");
  assert.strictEqual(Game.state.story.leo_caught_count, 2);

  // Day 4: The False Identity ("Mr Leonardo Smith" in oversized suit & sunglasses, father's ID) -> REFUSE
  Game.state.day = 4;
  Game.startShift();
  const leo4 = Game.generateCustomerScenario("leo_day4");
  Game.finalizeCustomerAtWindow(leo4);
  Game.state.currentCustomer = leo4;
  assert.strictEqual(leo4.person.oversizedSuit, true);
  assert.strictEqual(leo4.person.sunglasses, true);
  assert.strictEqual(leo4.ticket.holderName, "Leo");
  assert.strictEqual(leo4.idCard.holderName, "Leonardo Senior");
  assert.ok(leo4.statement.includes("Forget that beard"), "Day 4 dialogue references Day 3 beard detection");
  requestId(Game, leo4);
  const evLeo4 = Game.evaluateCustomerCase(leo4);
  assert.deepEqual(evLeo4.validActions, ["REFUSE"]);
  assert.ok(evLeo4.issues.some(i => i.code === "id_name"));
  Game.makeDecision("REFUSE");
  assert.strictEqual(Game.state.story.leo_caught_count, 3);

  // Day 5: The Fake ID (marker moustache, spoken claim of 17 vs DOB 2012-09-10 = age 14) -> REFUSE
  Game.state.day = 5;
  Game.startShift();
  const leo5 = Game.generateCustomerScenario("leo_day5");
  Game.finalizeCustomerAtWindow(leo5);
  Game.state.currentCustomer = leo5;
  assert.strictEqual(leo5.person.editedMoustache, true);
  assert.strictEqual(leo5.claimedAge, 17);
  assert.strictEqual(leo5.idCard.statedAge, undefined, "Age belongs in dialogue, not on the document");
  assert.strictEqual(leo5.idCard.dob, "10/09/2012");
  requestId(Game, leo5);
  const evLeo5 = Game.evaluateCustomerCase(leo5);
  assert.deepEqual(evLeo5.validActions, ["REFUSE"]);
  assert.ok(evLeo5.issues.some(i => i.code === "id_forged"));
  Game.makeDecision("REFUSE");
  assert.strictEqual(Game.state.story.leo_caught_count, 4);

  // Day 6: The Cinema Employee (staff hat, homemade badge, STAFF-99-LEO pass) -> REFUSE
  Game.state.day = 6;
  Game.startShift();
  const leo6 = Game.generateCustomerScenario("leo_day6");
  Game.finalizeCustomerAtWindow(leo6);
  Game.state.currentCustomer = leo6;
  assert.strictEqual(leo6.person.staffHat, true);
  assert.strictEqual(leo6.person.staffBadge, true);
  assert.strictEqual(leo6.ticket.ticketType, "STAFF PASS");
  const evLeo6 = Game.evaluateCustomerCase(leo6);
  assert.deepEqual(evLeo6.validActions, ["REFUSE"]);
  assert.ok(evLeo6.issues.some(i => i.code === "staff"));
  Game.makeDecision("REFUSE");
  assert.strictEqual(Game.state.story.leo_caught_count, 5);

  // Day 7: The Honest Customer (no disguise, valid ticket for G-rated Laughing Bananas, real ID) -> MUST ADMIT
  Game.state.day = 7;
  Game.startShift();
  const leo7 = Game.state.currentCustomer;
  assert.strictEqual(leo7.person.id, "leo");
  assert.strictEqual(leo7.person.obviousDisguise, false);
  assert.strictEqual(leo7.ticket.filmId, "laughing_bananas");
  assert.ok(leo7.statement.includes("No fake beard"), "Day 7 dialogue references his previous disguises");
  const evLeo7 = Game.evaluateCustomerCase(leo7);
  assert.deepEqual(evLeo7.validActions, ["ADMIT"], "Honest Leo on Day 7 with G-rated comedy ticket must be admitted");

  // Verify that refusing Leo on Day 7 is penalized as an inspection mistake
  const draft = Game.applyDecision(structuredClone(leo7), "REFUSE");
  assert.strictEqual(draft.accepted, false, "Refusing honest Leo on Day 7 must be rejected as an inspection mistake");

  // Admitting Leo on Day 7 succeeds compliantly
  Game.makeDecision("ADMIT");
  assert.strictEqual(Game.state.story.leo_day7_outcome, "helped");
});

test("20. Story consequences affecting gameplay: Maya's balcony boost, Mr Morris's family booking, Sofia's clue, and Blackwood's directive", () => {
  // Branch A: Help Mr Morris, Maya, and Sofia on Days 1, 3, 4 -> verify gameplay benefits on Day 6
  const { Game: GameHelped } = createHarness(2020);
  GameHelped.state.day = 3;
  GameHelped.startShift();

  // Help Mr Morris on Day 3 (relocated Planet X -> Screen 1)
  const morris3 = GameHelped.state.currentCustomer;
  assert.strictEqual(morris3.person.id, "mr_morris");
  requestId(GameHelped, morris3);
  GameHelped.makeDecision("CORRECT", GameHelped.screening("planet_x"));
  assert.strictEqual(GameHelped.state.story.morris_relationship, "loyal");

  // Help Maya on Day 3 (misprinted Wild World ticket -> Screen 2)
  GameHelped.nextCustomerFromQueue();
  const maya3 = reachCustomer(GameHelped, 'maya');
  assert.strictEqual(maya3.person.id, "maya");
  GameHelped.makeDecision("CORRECT", GameHelped.screening("wild_world"));
  assert.strictEqual(GameHelped.state.story.maya_relationship, "helped");

  // Help Sofia on Day 4
  GameHelped.state.day = 4;
  GameHelped.startShift();
  const sofia4 = GameHelped.state.currentCustomer;
  assert.strictEqual(sofia4.person.id, "sofia");
  requestId(GameHelped, sofia4);
  GameHelped.makeDecision("CORRECT", GameHelped.screening("love_in_paris"));
  assert.strictEqual(GameHelped.state.story.sofia_trust, "ally");

  // Advance to Day 6 (Premiere Night): Maya's storyScheduleBoost unlocks +4 seats in planet_x (2 -> 6 seats)
  GameHelped.state.day = 6;
  GameHelped.startShift();
  assert.strictEqual(GameHelped.screening("planet_x").capacity, 6, "Helping Maya on Day 3 must boost Planet X capacity from 2 to 6 on Day 6");
  assert.strictEqual(GameHelped.screening("planet_x").status, "EXTRA ROW OPEN");

  // Mr Morris's 3-person family booking on Day 6 is ready to ADMIT immediately when loyal
  const morris6 = GameHelped.state.currentCustomer;
  assert.strictEqual(morris6.person.id, "mr_morris");
  assert.strictEqual(morris6.groupSize, 3);
  assert.deepEqual(GameHelped.evaluateCustomerCase(morris6).validActions, ["ADMIT"]);
  GameHelped.makeDecision("ADMIT");
  assert.strictEqual(GameHelped.state.story.morris_commendation, "yes");

  // Maya's 3-person premiere group for Planet X on Day 6 can be CORRECTed because the extra balcony seats are open
  GameHelped.nextCustomerFromQueue();
  const maya6 = reachCustomer(GameHelped, 'maya');
  assert.strictEqual(maya6.person.id, "maya");
  assert.strictEqual(maya6.groupSize, 3);
  requestId(GameHelped, maya6);
  assert.deepEqual(GameHelped.evaluateCustomerCase(maya6).validActions, ["CORRECT"]);

  // Branch B: Do NOT help Mr Morris or Maya -> on Day 6, Planet X has only 2 seats so the 3-person group must be REFUSEd
  const { Game: GameBlamed } = createHarness(2020);
  GameBlamed.state.story = { morris_relationship: "cold", maya_relationship: "blamed", sofia_trust: "distant" };
  GameBlamed.state.day = 6;
  GameBlamed.startShift();
  assert.strictEqual(GameBlamed.screening("planet_x").capacity, 2, "Without Maya's help, Planet X capacity remains 2 on Day 6");

  // Mr Morris's family booking on Day 6 requires QUESTION + CORRECT when not loyal
  const morris6Cold = GameBlamed.state.currentCustomer;
  assert.strictEqual(morris6Cold.person.id, "mr_morris");
  assert.deepEqual(GameBlamed.evaluateCustomerCase(morris6Cold).validActions, ["QUESTION"]);
  GameBlamed.askCustomerQuestion("which_film", "Which film are you going to see?");
  assert.deepEqual(GameBlamed.evaluateCustomerCase(morris6Cold).validActions, ["CORRECT"]);
  GameBlamed.makeDecision("CORRECT", GameBlamed.screening("wild_world"));

  // Maya's 3-person group for Planet X must be REFUSEd because only 2 seats exist in Screen 1
  GameBlamed.nextCustomerFromQueue();
  const maya6Blamed = reachCustomer(GameBlamed, 'maya');
  assert.strictEqual(maya6Blamed.person.id, "maya");
  requestId(GameBlamed, maya6Blamed);
  assert.deepEqual(GameBlamed.evaluateCustomerCase(maya6Blamed).validActions, ["REFUSE"]);
});

test("21. Guaranteed recurring character encounters appear reliably across multiple random seeds", () => {
  const seeds = [101, 202, 303, 404, 505, 606, 707, 808, 909, 1010];
  const expectedByDay = {
    1: ["mr_morris", "sofia", "mr_blackwood"],
    2: ["leo"],
    3: ["mr_morris", "maya", "leo"],
    4: ["sofia", "leo", "mystery", "maya", "mr_morris"],
    5: ["mr_blackwood", "leo", "mystery"],
    6: ["mr_morris", "maya", "leo", "sofia", "mr_blackwood"],
    7: ["leo", "mr_morris", "mr_blackwood", "mystery"]
  };

  for (const seed of seeds) {
    const { Game } = createHarness(seed);
    for (let day = 1; day <= 7; day++) {
      Game.state.day = day;
      Game.startShift();
      const seenCharacterIds = [];
      for (let step = 0; Game.state.shiftActive && step < Game.state.shiftTargetCustomers; step++) {
        const c = Game.state.currentCustomer;
        if (c.person.id) seenCharacterIds.push(c.person.id);
        const ev = Game.evaluateCustomerCase(c);
        if (ev.needsQuestion) {
          if (c.requiredTicketQuestion) Game.askCustomerQuestion("other_ticket", "Do you have another ticket?");
          else Game.askCustomerQuestion("which_film", "Which film are you going to see?");
        }
        const ev2 = answerRequiredQuestions(Game, c);
        const action = ev2.validActions[0];
        const target = action === "CORRECT" ? ev2.options[0] : null;
        Game.makeDecision(action, target);
        Game.nextCustomerFromQueue();
      }
      for (const reqChar of expectedByDay[day]) {
        assert.ok(
          seenCharacterIds.includes(reqChar),
          `Seed ${seed}, Day ${day}: expected character '${reqChar}' in [${seenCharacterIds.join(", ")}]`
        );
      }
    }
  }
});

test("22. All five campaign endings are deterministically achievable and rendered in Sunday's report with character callbacks", () => {
  const { Game, sandbox } = createHarness(2222);
  const doc = sandbox.document;

  // 1. Employee of the Week (clean compliance, high reputation, zero corrupt passes)
  Game.state.day = 7;
  Game.state.reputation = 92;
  Game.state.story = {
    morris_relationship: "loyal",
    morris_day3_outcome: "helped",
    morris_day6_outcome: "helped",
    leo_day7_outcome: "helped",
    maya_relationship: "helped",
    manager_compliance: 0,
    manager_conflict: 1,
    inspection_violations: 0,
    total_mistakes: 0
  };
  Game.endShift();
  assert.strictEqual(Game.state.lastCampaignEnding.id, "employee_of_the_week");
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("Employee of the Week"));
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("Mr Morris"));

  // 2. The People's Champion (helped Morris, Maya, Leo on Day 7, and made compassionate exception)
  Game.state.reputation = 85;
  Game.state.story = {
    morris_day3_outcome: "helped",
    morris_relationship: "loyal",
    maya_relationship: "helped",
    leo_day7_outcome: "helped",
    maya_day3_outcome: "helped",
    maya_day6_outcome: "helped",
    morris_day6_outcome: "helped",
    total_exceptions: 1,
    people_champion_path: "yes",
    manager_compliance: 0,
    manager_conflict: 1
  };
  Game.endShift();
  assert.strictEqual(Game.state.lastCampaignEnding.id, "peoples_champion");
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("The People&#39;s Champion"));

  // 3. Management Material (obeyed Mrs Blackwood's VIP-000 directives)
  Game.state.reputation = 76;
  Game.state.story = {
    manager_compliance: 2,
    inspection_violations: 2
  };
  Game.endShift();
  assert.strictEqual(Game.state.lastCampaignEnding.id, "management_material");
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("Management Material"));

  // 4. The Whistleblower (refused Mrs Blackwood's unlisted passes and exposed fraud with Sofia's evidence)
  Game.state.reputation = 88;
  Game.state.story = {
    manager_conflict: 2,
    manager_compliance: 0,
    sofia_evidence: "yes",
    whistleblower_identified: "yes",
    inspector_day7_outcome: "helped",
    vip_reported: "yes"
  };
  Game.endShift();
  assert.strictEqual(Game.state.lastCampaignEnding.id, "the_whistleblower");
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("The Whistleblower"));
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("Sofia"));

  // 5. You're Fired! (dismissed or severe compliance failures)
  Game.state.warnings = Game.getMaxWarnings("normal");
  Game.endShift();
  assert.strictEqual(Game.state.lastCampaignEnding.id, "youre_fired");
  assert.ok(doc.getElementById("reportStoryNotes").innerHTML.includes("You&#39;re Fired!"));
});

test("23. Extended multi-day story state and numeric counters persist across saveProgress and loadProgress", () => {
  const { Game } = createHarness(2323);
  Game.state.day = 6;
  Game.state.story = {
    morris_relationship: "loyal",
    morris_day3_outcome: "helped",
    sofia_trust: "ally",
    sofia_evidence: "yes",
    maya_relationship: "helped",
    leo_day2_outcome: "refused",
    leo_beard_detected: "yes",
    leo_caught_count: 4,
    manager_conflict: 2,
    manager_compliance: 0,
    inspection_violations: 0,
    whistleblower_identified: "yes"
  };
  Game.saveProgress();

  Game.state.day = 1;
  Game.state.story = {};
  Game.loadProgress("the-first-week");

  assert.strictEqual(Game.state.day, 6);
  assert.strictEqual(Game.state.story.morris_relationship, "loyal");
  assert.strictEqual(Game.state.story.sofia_trust, "ally");
  assert.strictEqual(Game.state.story.maya_relationship, "helped");
  assert.strictEqual(Game.state.story.leo_beard_detected, "yes");
  assert.strictEqual(Game.state.story.leo_caught_count, 4);
  assert.strictEqual(Game.state.story.manager_conflict, 2);
  assert.strictEqual(Game.state.story.whistleblower_identified, "yes");
});


function elementText(el) {
  return [el?.textContent || '', el?.innerHTML || '', ...(el?.children || []).map(elementText)].join(' ');
}
function findElement(el, predicate) {
  if (predicate(el)) return el;
  for (const child of el?.children || []) { const found = findElement(child, predicate); if (found) return found; }
}
function stageCase(h, type, day = 2, story = {}) {
  const G = h.Game;
  G.state.day = day; G.state.story = structuredClone(story);
  G.startShift();
  const c = G.generateCustomerScenario(type);
  // Standalone fixture: keep one booking for explicitly reused scripted pass numbers.
  delete G.state.bookings[c.proposedBooking?.serial];
  G.finalizeCustomerAtWindow(c); G.state.currentCustomer = c; G.state.decisionLocked = false;
  h.UI.renderCustomer(c); h.UI.renderTicketOnDesk(c);
  return c;
}

function deskId(h) {
  return findElement(h.elements.get('deskDocumentArea'), el => el.id === 'idCardDocument');
}

test("24. Player chooses ID checks; admission never blocked by unrequested ID", () => {
  const h = createHarness(2400), G = h.Game;
  let c = stageCase(h, 'adult_horror_day2');
  assert.strictEqual(c.idCard.presented, false);
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, ['ADMIT']);
  assert.strictEqual(G.evaluateCustomerCase(c).needsIdentification, false);
  assert.ok(G.getCustomerQuestions(c).some(q => q[0] === 'ask_id'));
  assert.strictEqual(deskId(h), undefined);
  requestId(G);
  assert.strictEqual(c.idCard.presented, true);
  assert.ok(deskId(h), 'Asking for ID places it directly over the ticket');
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, ['ADMIT']);
  for (const [type, evidence] of [['missing_id','id_missing'], ['refused_id','id_refused']]) {
    c = stageCase(h,type);
    assert.strictEqual(G.evaluateCustomerCase(c).needsQuestion, false);
    const film=G.screening(c.ticket.filmId);
    const ageAction=c.trueAge < film.minAge ? 'REFUSE' : 'ADMIT';
    assert.deepEqual(G.evaluateCustomerCase(c).validActions,[ageAction]);
    requestId(G);
    assert.ok(c.discoveredEvidence.includes(evidence));
    assert.ok(!c.idCard.presented);
    assert.strictEqual(deskId(h), undefined);
  }
  c = stageCase(h,'hidden_ticket');
  requestId(G);
  assert.strictEqual(c.ticket.exists,false);
  assert.ok(deskId(h),'ID may be displayed even when the ticket is missing');
  c = stageCase(h,'leo_day7',7);
  assert.deepEqual(G.evaluateCustomerCase(c).validActions,['ADMIT']);
});

test("59. Optional ID refusal is not a violation; wrong age decisions reveal actual age only afterward", () => {
  const h=createHarness(5900), G=h.Game;
  let c=stageCase(h,'refused_id',2);
  const f=G.screening(c.ticket.filmId), minimum=f.minAge;
  c.trueAge=minimum-2; // An underage customer declining identification.
  requestId(G);
  assert.strictEqual(c.idRefused,true);
  assert.ok(!G.evaluateCustomerCase(c).reason.includes(String(c.trueAge)), 'Hidden age must not appear in pre-decision evaluation');
  assert.deepEqual(G.evaluateCustomerCase(c).validActions,['REFUSE']);
  G.makeDecision('ADMIT');
  let msg=h.elements.get('deskFeedbackBanner').textContent;
  assert.ok(msg.includes(`actually ${c.trueAge} years old`),msg);
  assert.ok(msg.includes(`rated ${minimum}+`),msg);
  assert.ok(!msg.includes('Use REFUSE. Customer declined'),msg);

  c=stageCase(h,'refused_id',2);
  const eligibleFilm=G.screening(c.ticket.filmId);
  c.trueAge=eligibleFilm.minAge+2;
  requestId(G);
  assert.strictEqual(c.idRefused,true);
  assert.deepEqual(G.evaluateCustomerCase(c).validActions,['ADMIT'], 'Eligible visitor may be admitted despite declining ID');
  G.makeDecision('REFUSE');
  msg=h.elements.get('deskFeedbackBanner').textContent;
  assert.ok(msg.includes(`actually ${c.trueAge} years old`),msg);
  assert.ok(msg.includes('does not invalidate the ticket'),msg);

  c=stageCase(h,'refused_id',2);
  c.trueAge=G.screening(c.ticket.filmId).minAge+2;
  requestId(G);
  const result=G.applyDecision(c,'ADMIT');
  assert.strictEqual(result.accepted,true, 'Choosing to trust an eligible visitor is permitted');
});

test("60. A misleading age claim alone is not a reason to refuse an eligible customer", () => {
  const h=createHarness(6000),G=h.Game;
  const c=stageCase(h,'age_valid',2), actual=c.trueAge;
  c.claimedAge=actual+3;
  G.askCustomerQuestion('ask_age','How old are you?');
  requestId(G);
  const ev=G.evaluateCustomerCase(c);
  assert.deepEqual(ev.validActions,['ADMIT']);
  assert.ok(!ev.issues.some(i=>i.code==='age_mismatch'));
  const f=G.screening(c.ticket.filmId);
  assert.strictEqual(G.canEnter(f,c),true);
});

test("61. Declining ID does not reliably signal underage status", () => {
  const h=createHarness(6100), G=h.Game;
  G.state.day=2; G.startShift();
  const ages = Array.from({length:40},()=>{
    const c=G.generateCustomerScenario('refused_id');
    const f=G.screening(c.ticket.filmId);
    return c.trueAge >= f.minAge;
  });
  assert.ok(ages.includes(true), 'Some ID-refusing visitors should be old enough');
  assert.ok(ages.includes(false), 'Some ID-refusing visitors should be underage');
});

test("25. Horizontal desk ID remains interactive without modal, with faithful photos", () => {
  const h = createHarness(2500),G=h.Game,U=h.UI;
  for (const [type,day] of [['adult_horror_day2',2],['leo_day4',4],['leo_day5',5]]) {
    const c=stageCase(h,type,day);
    assert.strictEqual(deskId(h),undefined);
    requestId(G);
    const doc=deskId(h),text=elementText(doc);
    assert.ok(doc && doc.className.includes('id-landscape-card'));
    for(const label of ['Photograph','Full Name','Date of Birth','Issue Date','Expiry Date','Document Number','Issuing Authority']) assert.ok(text.includes(label),label);
    assert.ok(!/FAKE ID|INVALID|UNDERAGE|Schedule Date/.test(text));
    assert.strictEqual(G.state.modalDepth,0,'ID does not block game actions');
    const photo=findElement(doc,e=>e.id==='idModalPhotoBtn');
    const actual=vm.runInContext("CHARACTERS.renderPortrait(Game.state.currentCustomer.person,'neutral')",h.sandbox);
    if(c.idCard.photoMismatch) assert.ok(!photo.innerHTML.includes(actual));
    else assert.ok(photo.innerHTML.includes(actual));
    const handle=findElement(h.elements.get('deskDocumentArea'),e=>e.className==='id-drag-handle');
    assert.ok(handle && typeof handle.onpointerdown==='function','Move handle supports dragging');
    const close=findElement(h.elements.get('deskDocumentArea'),e=>e.className==='id-card-put-away');
    close.onclick(); assert.strictEqual(deskId(h),undefined);
    assert.ok(elementText(h.elements.get('deskDocumentArea')).includes('Show ID'));
    U.openIdCardModal(); assert.ok(deskId(h));
    U.closeIdCardModal(); assert.strictEqual(G.state.modalDepth,0);
  }
});

test("26. DMY dates, exact birthdays, leap years, document chronology and expired ID inspection", () => {
  const h = createHarness(2600), G = h.Game;
  assert.strictEqual(G.formatDateDMY('2010-10-13'), '13/10/2010');
  assert.strictEqual(G.calculateAge('13/10/2010','13/10/2026'), 16);
  assert.strictEqual(G.calculateAge('14/10/2010','13/10/2026'), 15);
  assert.strictEqual(G.calculateAge('29/02/2008','28/02/2024'), 15);
  assert.strictEqual(G.calculateAge('29/02/2008','29/02/2024'), 16);
  assert.strictEqual(G.calculateAge('29/02/2008','01/03/2023'), 15);
  for (const date of ['29/02/1900','31/04/2026','00/12/2000','not a date']) assert.strictEqual(G.isValidCalendarDate(date), false);
  assert.strictEqual(G.isValidCalendarDate('29/02/2000'), true);
  let c = stageCase(h, 'adult_horror_day2'); requestId(G);
  c.idCard.issueDate = '13/10/2026'; c.idCard.expiryDate = '13/10/2026';
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, ['ADMIT'], 'Expiry includes the printed final day');
  c.idCard.issueDate = '14/10/2026';
  assert.ok(G.evaluateCustomerCase(c).issues.some(i => i.code === 'id_forged'));
  c.idCard.issueDate = '01/01/1990';
  assert.ok(G.evaluateCustomerCase(c).issues.some(i => i.code === 'id_forged'), 'Issue cannot predate birth');
  c = stageCase(h, 'expired_id'); requestId(G); h.UI.openIdCardModal();
  assert.ok(G.evaluateCustomerCase(c).issues.some(i => i.code === 'id_expired'));
  const compare = G.compareTwoInspectedItems({category:'id_expiry',value:c.idCard.expiryDate}, {category:'today',value:G.today()});
  assert.strictEqual(compare.isMatch, false);
  const text = elementText(deskId(h));
  assert.ok(text.includes(G.formatDateDMY(c.idCard.dob)));
  assert.ok(!/\b\d{4}-\d{2}-\d{2}\b/.test(text));
  assert.ok(!text.includes(G.formatDateDMY(G.currentDateISO())), 'Today is an operational reference, not a document field');
  h.UI.closeIdCardModal();
  c.idCard.dob = '30/02/2012';
  assert.doesNotThrow(() => G.evaluateCustomerCase(c));
});

test("27. Specific evidence, contextual follow-ups, declarative effects and truthful story reactions", () => {
  const h = createHarness(2700), G = h.Game;
  let c = stageCase(h, 'leo_day5', 5);
  G.askCustomerQuestion('which_film', 'film');
  assert.ok(!c.discoveredEvidence.includes('age_id_contradiction'));
  G.askCustomerQuestion('ask_age', 'age'); assert.strictEqual(c.revealedClaimedAge, 17);
  assert.strictEqual(c.idCard.presented, false);
  requestId(G); assert.ok(c.discoveredEvidence.includes('age_id_contradiction'));
  assert.strictEqual(G.state.story.leo_contradiction_spotted, 'yes');
  c = stageCase(h, 'sofia_day4', 4);
  G.askCustomerQuestion('which_film', 'film');
  assert.strictEqual(G.state.story.sofia_whistleblower_clue, undefined);
  assert.ok(!G.getCustomerQuestions(c).some(q => q[0] === 'ask_receipts'));
  G.askCustomerQuestion('what_did_you_see', 'what');
  assert.strictEqual(G.state.story.sofia_whistleblower_clue, 'yes');
  assert.ok(G.getCustomerQuestions(c).some(q => q[0] === 'ask_receipts'));
  G.askCustomerQuestion('ask_receipts', 'receipts');
  assert.strictEqual(G.state.story.sofia_receipts_requested, 'yes');
  c = stageCase(h, 'blackwood_day5', 5);
  G.askCustomerQuestion('which_film', 'film'); G.makeDecision('REFUSE');
  assert.strictEqual(G.state.story.blackwood_questioned, undefined);
  assert.strictEqual(G.state.story.whistleblower_identified, undefined);
  c = stageCase(h, 'blackwood_day6', 6);
  G.askCustomerQuestion('challenge_vip', 'pass');
  assert.ok(c.discoveredEvidence.includes('vip_challenged'));
  assert.strictEqual(G.state.story.blackwood_questioned, 'yes');
  c = stageCase(h, 'adult_horror_day2');
  c.extraQuestions = [['show_document','May I check your document?']];
  c.questionEffects = {show_document:{revealDocument:'id', revealStatement:'Here you go.', revealPreference:true, incrementStory:{document_requests:1}, unlockQuestions:[['follow','Anything else?']]}};
  G.askCustomerQuestion('show_document','document'); G.askCustomerQuestion('show_document','document');
  assert.strictEqual(c.idCard.presented, true);
  assert.strictEqual(G.state.story.document_requests, 1, 'Repeated questions must not farm consequences');
  assert.strictEqual(c.dialogue.at(-1).reply, 'Here you go.');
  assert.ok(G.getCustomerQuestions(c).some(q => q[0] === 'follow'));
  c = stageCase(h, 'sofia_day6_ally', 6, {sofia_trust:'ally'});
  answerRequiredQuestions(G); G.makeDecision('ADMIT');
  assert.ok(!G.state.shiftStats.dilemmaNotes.join(' ').includes('shared her receipt evidence'));
  assert.strictEqual(G.state.story.sofia_evidence, undefined);
});

test("28. Every Campaign 1 scripted branch and procedural case has an accessible evidence route", () => {
  const catalog = createHarness(2800).Game.campaign();
  let checked = 0;
  for (const [day, cfg] of Object.entries(catalog.days)) {
    for (const enc of cfg.scriptedEncounters || []) {
      const h = createHarness(2800 + checked), G = h.Game;
      G.state.day = Number(day); G.state.story = {};
      const requirements = enc.trigger?.requireStoryValue;
      for (const r of requirements ? (Array.isArray(requirements) ? requirements : [requirements]) : []) G.state.story[r.key] = r.value ?? r.in?.[0] ?? r.min;
      G.prepareDaySchedule(Number(day)); G.state.shiftActive = true;
      const c = G.generateCustomerScenario(enc.id);
      assert.strictEqual(c.scriptedId, enc.id, 'Never silently replace a scripted encounter');
      G.finalizeCustomerAtWindow(c); G.state.currentCustomer = c;
      assert.ok(!c.idCard?.presented);
      const before = G.evaluateCustomerCase(c);
      assert.ok(!before.issues.some(i => ['id_name','id_forged','id_expired'].includes(i.code)), 'Unpresented document details must not determine scoring');
      const ev = answerRequiredQuestions(G);
      assert.ok(ev.validActions.includes(enc.expectedAction || (enc.dilemma ? 'REFUSE' : ev.validActions[0])), `${enc.id}: ${JSON.stringify(ev)}`);
      assert.ok(c.statement.split(/\s+/).length <= 22, `${enc.id}: opening should be brief`);
      checked++;
    }
    for (const type of cfg.casePool || []) {
      const h = createHarness(2800 + checked), G = h.Game;
      G.state.day = Number(day); G.prepareDaySchedule(Number(day)); G.state.shiftActive = true;
      const c = G.generateCustomerScenario(type);
      G.finalizeCustomerAtWindow(c); G.state.currentCustomer = c;
      const ev = answerRequiredQuestions(G);
      assert.ok(ev.validActions.some(a => ['ADMIT','CORRECT','REFUSE'].includes(a)), type);
      checked++;
    }
  }
  assert.ok(checked > 90);
  const h = createHarness(2899), G = h.Game;
  const c = stageCase(h, 'adult_horror_day2'); requestId(G);
  c.person.name = 'An internal identity never spoken aloud'; c.trueAge = 8;
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, ['REFUSE'], 'True underage visitors must not be admitted even when no ID was needed');
  assert.strictEqual(G.compareTwoInspectedItems({category:'id_name',value:c.idCard.holderName}, {category:'portrait',value:c.person.id}).isMatch, null);
});

test("29. Guaranteed arrivals survive walkouts and closing, respect branches, and never duplicate", () => {
  const h = createHarness(2900), G = h.Game;
  G.state.day = 4; G.startShift();
  const current = G.state.currentCustomer;
  G.nextCustomerFromQueue(); assert.strictEqual(G.state.currentCustomer, current, 'An undecided customer cannot be skipped');
  while (!G.state.queue.some(e => e.plan?.group === 'leo_day4') && G.spawnCustomerToQueue()) {}
  assert.strictEqual(G.state.queue.filter(e => e.plan?.group === 'leo_day4').length, 1);
  const queued = G.state.queue.find(e => e.plan?.group === 'leo_day4'); queued.patience = 0.1;
  G.state.queue.push({person:{name:'Routine visitor'},patience:0.1});
  G.updateQueuePatience();
  assert.ok(G.state.queue.includes(queued));
  assert.ok(!G.state.queue.some(c => c.person.name === 'Routine visitor'));
  queued.preventQueueWalkout = false; queued.patience = 0.1;
  G.updateQueuePatience();
  assert.ok(G.state.queue.includes(queued), 'Guaranteed story encounters cannot walk out');
  const seen = [];
  G.state.shiftRemainingSeconds = 0; G.state.shiftExpired = true;
  while (G.state.shiftActive && seen.length < 20) {
    const c = G.state.currentCustomer; seen.push(c.scriptedId);
    const ev = answerRequiredQuestions(G);
    G.makeDecision(ev.validActions[0], ev.options[0]); G.nextCustomerFromQueue();
  }
  assert.strictEqual(G.state.shiftActive, false);
  assert.strictEqual(new Set(seen).size, seen.length);
  for (const id of ['sofia_day4','leo_day4','mystery_day4','maya_day4_blamed','dilemma_late_day4']) assert.ok(seen.includes(id), id);
  assert.ok(!seen.includes('maya_day4_helped'));
  for (const id of seen) assert.strictEqual(G.state.scriptedEncountersState[id], 'resolved');
});

test("30. Active saves restore evidence, documents, bookings, RNG and encounter state; replay rolls back the day", () => {
  const h = createHarness(3000), G = h.Game;
  G.state.day = 2; G.startShift();
  const initialMoney = G.state.money, initialStory = structuredClone(G.state.story);
  requestId(G); G.makeDecision('REFUSE');
  assert.strictEqual(G.state.story.leo_caught_count, 1);
  let resumed = createHarness(9999, null, h.storage._s);
  resumed.Game.startShift();
  assert.strictEqual(resumed.Game.state.decisionLocked, true);
  assert.strictEqual(resumed.Game.state.scriptedEncountersState.leo_day2, 'resolved');
  assert.strictEqual(resumed.Game.state.story.leo_caught_count, 1);
  G.nextCustomerFromQueue(); resumed.Game.nextCustomerFromQueue();
  assert.strictEqual(JSON.stringify(resumed.Game.state.currentCustomer), JSON.stringify(G.state.currentCustomer));
  G.askCustomerQuestion('ask_age','age'); requestId(G); G.tick();
  h.UI.openIdCardModal(); G.saveProgress();
  resumed = createHarness(123, null, h.storage._s); resumed.Game.startShift();
  assert.strictEqual(resumed.Game.state.modalDepth, 0);
  assert.strictEqual(resumed.Game.state.currentCustomer.idCard?.presented === true,
    G.state.currentCustomer.idCard?.presented === true, 'Restored ID disclosure must match the original customer');
  assert.strictEqual(JSON.stringify(resumed.Game.state.currentCustomer.discoveredEvidence),
    JSON.stringify(G.state.currentCustomer.discoveredEvidence), 'Question evidence survives reload');
  assert.strictEqual(resumed.Game.state.clockMins, G.state.clockMins);
  assert.strictEqual(JSON.stringify(resumed.Game.state.bookings), JSON.stringify(G.state.bookings));
  assert.strictEqual(JSON.stringify(resumed.Game.state.queue), JSON.stringify(G.state.queue));
  assert.strictEqual(resumed.Game.rngSeed, G.rngSeed);
  resumed.Game.replayCurrentDay();
  assert.strictEqual(resumed.Game.state.money, initialMoney);
  assert.strictEqual(JSON.stringify(resumed.Game.state.story), JSON.stringify(initialStory));
  resumed.Game.startShift();
  assert.strictEqual(resumed.Game.state.currentCustomer.scriptedId, 'leo_day2');
  requestId(resumed.Game); resumed.Game.makeDecision('REFUSE');
  assert.strictEqual(resumed.Game.state.story.leo_caught_count, 1, 'Replay does not farm catches');
  // Legacy saves keep resolved events even without a live snapshot.
  const saved = JSON.parse(h.storage._s.cinema_chaos_save_v2); delete saved.activeShift; delete saved.dayStartSnapshot;
  const legacy = createHarness(3001, null, {cinema_chaos_save_v2:JSON.stringify(saved)});
  legacy.Game.startShift();
  assert.notStrictEqual(legacy.Game.state.currentCustomer.scriptedId, 'leo_day2');
});

function playEndingRoute(route) {
  const h = createHarness(3100), G = h.Game;
  for (let day = 1; day <= 7; day++) {
    assert.strictEqual(G.state.day, day); G.startShift();
    let count = 0;
    while (G.state.shiftActive && count < 20) {
      const c = G.state.currentCustomer;
      if (route === 'whistleblower' && c.characterId === 'sofia' && day === 6) G.askCustomerQuestion('what_did_you_see','receipts');
      if (route === 'whistleblower' && c.scriptedId === 'mystery_day7') G.askCustomerQuestion('report_vip','report');
      const ev = answerRequiredQuestions(G);
      let action = ev.validActions[0];
      if (route === 'management' && c.managerDirective) action = 'ADMIT';
      if (route === 'people' && c.dilemma) action = 'ADMIT';
      if (route === 'neutral' && c.scriptedId === 'sofia_day1') action = 'REFUSE';
      if (route === 'fired' && day <= 3 && count < 2) action = action === 'REFUSE' ? 'ADMIT' : 'REFUSE';
      G.makeDecision(action, ev.options[0]); count++;
      G.state.clockMins = G.state.clockEndMins;
      G.nextCustomerFromQueue();
    }
    assert.ok(count < 20);
    if (day < 7) assert.strictEqual(G.advanceToNextDay(), true);
  }
  return h;
}

test("31. All five special endings and neutral completion are reachable through actual seven-day decisions", () => {
  for (const [route, ending] of [['employee','employee_of_the_week'],['people','peoples_champion'],['management','management_material'],['whistleblower','the_whistleblower'],['neutral','probation_passed'],['fired','youre_fired']]) {
    const h = playEndingRoute(route), G = h.Game;
    assert.strictEqual(G.state.lastCampaignEnding.id, ending, route);
    assert.deepEqual(G.state.completedDays, [1,2,3,4,5,6,7]);
    assert.strictEqual(G.state.story.leo_day7_outcome, 'helped');
    if (route === 'whistleblower') {
      assert.strictEqual(G.state.story.vip_reported, 'yes');
      assert.strictEqual(G.state.story.sofia_evidence, 'yes');
    } else assert.ok(!G.state.lastCampaignEnding.callbacks.some(c => c.characterName === 'Sofia'));
  }
});

test("32. Ending precedence, unearned rewards, identity disclosure and legacy pack question compatibility", () => {
  const h = createHarness(3200), G = h.Game;
  G.state.reputation = 90; G.state.story = {manager_conflict:3,manager_compliance:0};
  assert.notStrictEqual(G.evaluateCampaignEnding(false).id, 'the_whistleblower');
  G.state.story = {total_mistakes:1};
  assert.strictEqual(G.evaluateCampaignEnding(false).id, 'probation_passed');
  G.state.story = {sofia_evidence:'yes',vip_reported:'yes',inspector_day7_outcome:'helped',manager_conflict:3};
  assert.strictEqual(G.evaluateCampaignEnding(false).id, 'the_whistleblower');
  assert.strictEqual(G.evaluateCampaignEnding(true).id, 'youre_fired');
  let c = stageCase(h, 'morris_day1', 1);
  h.UI.renderCustomer(c);
  assert.strictEqual(h.elements.get('customerIdentityBar').textContent, '1 person');
  assert.strictEqual(h.elements.get('customerTraitRow').children.length, 0);
  G.askCustomerQuestion('ask_name','name');
  assert.strictEqual(G.getKnownCustomerName(c), 'Mr Morris');
  G.makeDecision('ADMIT');
  assert.strictEqual(G.state.story.known_char_mr_morris, 'yes');
  c = stageCase(h, 'mystery_day7', 7); requestId(G);
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, ['ADMIT']);
  assert.strictEqual(G.compareTwoInspectedItems({category:'id_name',value:c.idCard.holderName}, {category:'portrait',value:c.person.id}).isMatch, null, 'A job title is not a conflicting personal name');
  c = stageCase(h, 'valid', 1);
  c.storyEffects = {onQuestioned:{legacy_question:'yes'}};
  G.askCustomerQuestion('which_film','film'); G.makeDecision('ADMIT');
  assert.strictEqual(G.state.story.legacy_question, 'yes', 'Existing packs without specific effects retain legacy semantics');
});


test("33. Other packs can reuse encounter IDs on different days and opt into identity without an age policy", () => {
  const h = createHarness(3300), G = h.Game;
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'tests/minimal-test-campaign.js'),'utf8'), h.sandbox);
  const reg = h.sandbox.CinemaChaos.CampaignRegistry;
  const pack = structuredClone(reg.get('festival-showcase'));
  pack.id = 'identity-fixture'; pack.playableDaysCount = 2;
  const enc = {id:'shared-id', caseType:'valid', targetScreeningId:'cosmic_voyage', expectedAction:'ADMIT', guaranteed:true, oncePerShift:true, requiresIdentityCheck:true,
    personOverrides:{name:'Private internal name'}, idCard:{exists:true,holderName:'Festival Guest',dob:'01/01/1980',issueDate:'01/01/2020',expiryDate:'01/01/2030'}, statementTemplate:'One ticket, please.'};
  pack.days[1].scriptedEncounters = [enc];
  pack.days[2] = {...structuredClone(pack.days[1]),dayNum:2,dayName:'TUESDAY',playable:true};
  reg.register(pack);
  G.selectCampaign(pack.id); G.startShift();
  assert.strictEqual(G.state.currentCustomer.scriptedId, 'shared-id');
  assert.ok(G.getCustomerQuestions(G.state.currentCustomer).some(q => q[0] === 'ask_id'));
  assert.ok(!G.getCustomerQuestions(G.state.currentCustomer).some(q => q[0] === 'ask_age'));
  requestId(G); G.makeDecision('ADMIT'); finishShift(G);
  assert.strictEqual(G.advanceToNextDay(), true); G.startShift();
  assert.strictEqual(G.state.currentCustomer.scriptedId, 'shared-id', 'A resolved ID from Monday must not suppress Tuesday');
  const current = JSON.stringify(G.state.currentCustomer);
  G.selectCampaign('the-first-week');
  G.startOrContinueCampaign(pack.id); G.startShift();
  assert.strictEqual(JSON.stringify(G.state.currentCustomer), current, 'Switching campaigns preserves the suspended shift');
  assert.strictEqual(G.state.resolvedEncounters[1]['shared-id'], true);
  assert.ok(!G.state.resolvedEncounters[2]?.['shared-id']);
  requestId(G); G.makeDecision('ADMIT');
  assert.strictEqual(G.state.resolvedEncounters[2]['shared-id'], true);
  const forged = structuredClone(pack); forged.days[1].scriptedEncounters[0].idCard.dob = '30/02/2012';
  assert.doesNotThrow(() => reg.validate(forged), 'Impossible printed dates are intentional forgery content');
  forged.days[1].scriptedEncounters[0].idCard.dob = 123;
  assert.throws(() => reg.validate(forged), /printed text/);
  const invalid = structuredClone(pack); invalid.days[1].scriptedEncounters[0].guaranteed = 'yes';
  assert.throws(() => reg.validate(invalid), /must be boolean/);
});

test("34. Contradictions work in either question order, identity stays concealed, and ordinary queues remain active", () => {
  const h = createHarness(3400), G = h.Game;
  const c = stageCase(h, 'leo_day5', 5);
  assert.strictEqual(G.getKnownCustomerName(c), null);
  requestId(G);
  assert.ok(!c.discoveredEvidence.includes('age_id_contradiction'));
  G.askCustomerQuestion('ask_age','age');
  assert.ok(c.discoveredEvidence.includes('age_id_contradiction'));
  G.makeDecision('REFUSE');
  assert.ok(G.state.outcomes.at(-1).evidence.includes('age_id_contradiction'));
  // Serve the remaining script, then ordinary random customers still enter normally.
  G.state.clockMins = 1065; G.state.closing = false;
  for (let n = 0; n < 8; n++) {
    G.nextCustomerFromQueue();
    const ev = answerRequiredQuestions(G);
    G.makeDecision(ev.validActions[0], ev.options[0]);
  }
  assert.strictEqual(G.state.currentCustomer.scriptedId, undefined);
  G.state.decisionLocked = false;
  G.state.queue = [{person:{name:'Waiting visitor'},patience:10}];
  const time = G.state.shiftRemainingSeconds, fictionalTime = G.state.clockMins; G.tick();
  assert.strictEqual(G.state.shiftRemainingSeconds, time - 1, 'Countdown loses one second per active tick');
  assert.strictEqual(G.state.clockMins, fictionalTime, 'Fictional time does not tick while investigating');
  assert.ok(G.state.queue[0].patience < 10);
});


test("35. Sufficient ticket evidence permits refusal or an unrestricted correction without unnecessary ID", () => {
  const h = createHarness(3500), G = h.Game;
  let c = stageCase(h, 'adult_horror_day2');
  c.ticket.screen = 2;
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, ['REFUSE'], 'Closed printer plus wrong screen already justifies refusal');
  assert.strictEqual(c.idCard.presented, false);
  c = stageCase(h, 'age_valid', 3);
  c.intent = c.known.preference = {ids:['laughing_bananas']};
  c.known.publicPlan = true;
  c.statement = 'I wanted Laughing Bananas.';
  const ev = G.evaluateCustomerCase(c);
  assert.deepEqual(ev.validActions, ['CORRECT']);
  assert.ok(ev.options.some(f => f.id === 'laughing_bananas'));
  G.makeDecision('CORRECT', G.screening('laughing_bananas'));
  assert.strictEqual(G.state.shiftStats.correct, 1);
  assert.strictEqual(c.idCard.presented, false, 'An unrestricted replacement does not require identification');
});


test("36. Legacy stated-age metadata never appears on an ID or affects decisions", () => {
  const h = createHarness(3600), G = h.Game;
  let c = stageCase(h, 'adult_horror_day2');
  requestId(G, c);
  const expected = G.evaluateCustomerCase(c).validActions;
  c.idCard.statedAge = 5; // Emulate an older saved/custom campaign document.
  h.UI.openIdCardModal();
  const text = elementText(deskId(h));
  assert.ok(!text.includes('Stated Age'), 'Cards display DOB, not a fabricated age field');
  assert.ok(!text.includes('id_age'), 'Cards cannot expose a stale age inspection target');
  assert.deepEqual(G.evaluateCustomerCase(c).validActions, expected, 'Legacy metadata must not cause a refusal');
  assert.strictEqual(G.normalizeIdCard(c.idCard, c.person.name).statedAge, undefined,
    'Normalising a legacy document discards obsolete metadata');
  h.UI.closeIdCardModal();
});

test("42. Borrowed photo visibly differs, uses the older portrait roster, and remains deterministic", () => {
  const h = createHarness(4200), G = h.Game, U = h.UI;
  const c = stageCase(h, 'leo_day4', 4);
  requestId(G, c);
  const before = JSON.stringify(c), rng = G.state.rngState;
  U.renderTicketOnDesk(c);
  const markup = findElement(deskId(h), e=>e.id==='idModalPhotoBtn').innerHTML;
  const registry = vm.runInContext('PORTRAIT_REGISTRY.visitors', h.sandbox);
  const olderMale = registry.filter(p=>p.ageGroup==='olderAdult' && p.genderPresentation==='male');
  assert.ok(olderMale.some(p=>markup.includes(p.src)), 'Father’s ID photo must be of an older man');
  assert.ok(!markup.includes('leo_neutral.webp'), 'Leo’s own portrait cannot appear on his father’s ID');
  assert.ok(!markup.includes('accessory-oversized-suit'), 'Document photo should not inherit Leo’s disguise');
  assert.ok(!markup.includes('FAKE') && !markup.includes('INVALID'), 'Document should not disclose the verdict');
  U.renderTicketOnDesk(c);
  assert.strictEqual(findElement(deskId(h), e=>e.id==='idModalPhotoBtn').innerHTML,markup);
  assert.strictEqual(JSON.stringify(c),before,'ID rendering cannot mutate the encounter or persisted identity');
  assert.strictEqual(G.state.rngState,rng,'Rendering cannot consume gameplay randomness');
  assert.strictEqual(G.compareTwoInspectedItems({category:'id_photo', value:'ALTERED'}, {category:'portrait',value:c.person.id}).isMatch, false);
});

test("43. Altered photo has physical tampering, but retains the same face", () => {
  const h=createHarness(4300),G=h.Game,U=h.UI;
  const c=stageCase(h,'leo_day5',5);
  requestId(G,c);U.renderTicketOnDesk(c);
  const photo=findElement(deskId(h),e=>e.id==='idModalPhotoBtn');
  const face=vm.runInContext('CHARACTERS.renderPortrait(Game.state.currentCustomer.person)',h.sandbox);
  assert.ok(photo.innerHTML.includes(face),'Tampered ID still depicts the actual customer');
  assert.match(photo.innerHTML,/id-photo-stamp/);
  assert.match(photo.innerHTML,/id-photo-tape/);
  assert.ok(photo.innerHTML.includes('id-photo-tape'),'Visible tampering tape must remain');
  const css=fs.readFileSync(path.join(ROOT,'css/styles.css'),'utf8');
  assert.match(css,/\.id-photo-frame--altered \.id-photo-tape/);
  assert.match(css,/\.id-photo-frame--altered \.id-photo-stamp/);
  assert.strictEqual(G.compareTwoInspectedItems({category:'id_photo', value:'ALTERED'}, {category:'portrait',value:c.person.id}).isMatch,false);
});

test("44. Other invalid IDs do not acquire artificial photo discrepancies", () => {
  const h=createHarness(4400),G=h.Game,U=h.UI;
  for (const [type,day] of [['expired_id',2],['fake_id',2],['underage',2]]) {
    const c=stageCase(h,type,day);
    requestId(G,c);U.renderTicketOnDesk(c);
    const html=findElement(deskId(h),e=>e.id==='idModalPhotoBtn').innerHTML;
    const live=vm.runInContext('CHARACTERS.renderPortrait(Game.state.currentCustomer.person)',h.sandbox);
    assert.ok(html.includes(live),`${type}: non-photo issues must preserve the real face`);
    assert.ok(!html.includes('id-photo-tape'),`${type}: unaltered photo should not have tape`);
  }
});

test("45. Borrowed portraits respect explicit asset mappings and missing-image fallback", () => {
  const h=createHarness(4500);
  const registry=vm.runInContext('PORTRAIT_REGISTRY.visitors',h.sandbox);
  const source=registry[0], other=registry.find(p=>p.id!==source.id && p.ageGroup==='olderAdult');
  const person={id:'visitor-source',name:'Visitor',portraitId:source.id};
  const idCard={photoMismatch:true,photoPortraitId:other.id,holderName:'Other',docNumber:'ID-102'};
  const render=(card)=>vm.runInContext(`CHARACTERS.renderIdentityPhoto(${JSON.stringify(person)}, ${JSON.stringify(card)})`,h.sandbox);
  const html=render(idCard);
  assert.ok(html.includes(other.src));
  assert.ok(!html.includes(source.src));
  assert.ok(html.includes('handlePortraitImageError'));
  // Even an incorrectly authored mapping to the customer must not show the same portrait.
  assert.ok(!render({...idCard,photoPortraitId:source.id}).includes(source.src));
  // A missing image in the ID should fall back to the OTHER person's authored SVG.
  const fallback=vm.runInContext(`CHARACTERS.renderIdentityPhoto(${JSON.stringify(person)}, ${JSON.stringify({photoMismatch:true,portraitPerson:{isElderly:true,glasses:true,coatColor:'#123456'}})})`,h.sandbox);
  assert.ok(fallback.includes('data-fallback-person'));
  assert.ok(decodeURIComponent(fallback).includes('isElderly'));
});





test("37. No modal or comparison toolbar; card has ISO 85.60:53.98 ratio", () => {
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
  const css=fs.readFileSync(path.join(ROOT,'css/styles.css'),'utf8');
  const ui=fs.readFileSync(path.join(ROOT,'js/ui.js'),'utf8');
  assert.ok(!html.includes('id="idCardModal"'));
  assert.ok(!html.includes('id="idCardModalCompareRefs"'));
  assert.match(css,/aspect-ratio:\s*85\.60\s*\/\s*53\.98/);
  assert.ok(ui.includes('renderIdOnDesk(c, area)'));
  assert.ok(ui.includes('area.append(cardLayer)'));
  assert.ok(!ui.includes('Open Pop-up'));
});

test("38. All portrait assets exist; registry is campaign-independent and loaded before characters", () => {
  const h = createHarness(3800);
  const reg = vm.runInContext('PORTRAIT_REGISTRY', h.sandbox);
  assert.strictEqual(reg.visitors.length, 40);
  assert.strictEqual(new Set(reg.visitors.map(p => p.id)).size, 40);
  for (const [id, src] of Object.entries(reg.recurring)) {
    assert.ok(fs.existsSync(path.join(ROOT, src)), `Recurring ${id} missing: ${src}`);
  }
  for (const p of reg.visitors) {
    assert.ok(fs.existsSync(path.join(ROOT, p.src)), `Visitor ${p.id} missing: ${p.src}`);
    assert.ok(['under18','youngAdult','adult','olderAdult'].includes(p.ageGroup));
  }
  assert.ok(reg.recurring.maya.endsWith('/recurring/maya.webp'));
  assert.ok(reg.recurring.mr_blackwood.endsWith('/recurring/manager.webp'));
  assert.strictEqual(Object.keys(reg.costumeProfiles.leo.variants).length, 10);
  for (const src of Object.values(reg.costumeProfiles.leo.variants)) assert.ok(fs.existsSync(path.join(ROOT, src)), `Missing Leo variant: ${src}`);
  assert.deepEqual(reg.reservedVisitorIds, []);
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.indexOf('js/portrait-registry.js') < html.indexOf('js/characters.js'));
});

test("39. Recurring characters use stable artwork and Leo's costume cues are visible", () => {
  const h = createHarness(3900);
  const html = (person) => vm.runInContext('CHARACTERS.renderPortrait('+ JSON.stringify(person) +')', h.sandbox);
  const named = h.Game.campaign().characters;
  for (const [id, basename] of [['mr_morris','mr_morris.webp'],['sofia','sofia.webp'],['leo','leo_neutral.webp'],['mystery','mystery_customer.webp'],['maya','maya.webp'],['mr_blackwood','manager.webp']]) {
    const markup = html({...named[id], characterId:id});
    assert.ok(markup.includes(basename), id);
  }
  const variants = [
    [{fakeBeard:true},'leo_beard.webp',null],
    [{oversizedSuit:true,sunglasses:true},'leo_suit.webp','sunglasses'],
    [{editedMoustache:true},'leo_moustache.webp',null],
    [{staffHat:true,staffBadge:true},'leo_cap.webp','staffUniform']
  ];
  for (const [flags,basename,overlay] of variants) {
    const markup = html({...named.leo, characterId:'leo', ...flags});
    assert.ok(markup.includes(basename), `${basename}: matching image variant`);
    if (overlay) assert.ok(markup.includes(`data-costume="${overlay}"`), `${overlay}: disguise cue present`);
  }
  // Another campaign's characters must not silently lose costume cues.
  assert.match(html({id:'visitor',name:'Visitor',skinColor:'#aaa',hairColor:'#222',coatColor:'#123',shirtColor:'#fff',fakeBeard:true}), /<svg/);
});

test("40. Ordinary portraits are stable and respect red-clothing and broad age casting", () => {
  const h = createHarness(4000);
  const select = (p, age) => vm.runInContext(`CHARACTERS.assignPortrait(${JSON.stringify(p)}, ${age})`, h.sandbox);
  const roster = vm.runInContext('PORTRAIT_REGISTRY.visitors', h.sandbox);
  for (const age of [14, 20, 35, 72]) {
    for (const red of [false, true]) {
      const person = { id: `test-${age}-${red}`, name:'Visitor', wearingRed:red, glasses:false, hat:false };
      const a = select(person, age), b = select(person, age);
      assert.strictEqual(a.portraitId, b.portraitId);
      const meta = roster.find(x => x.id === a.portraitId);
      assert.strictEqual(meta.wearingRed, red);
      assert.strictEqual(meta.ageGroup, age<18?'under18':age<27?'youngAdult':age<60?'adult':'olderAdult');
    }
  }
  const g = h.Game;
  for (const [name, expectedGender] of [['Anna','female'],['David','male'],['Elena','female'],['Marcus','male']]) {
    const p = select({ id:`gender-${name}`, name, wearingRed:false, glasses:false }, 24);
    assert.strictEqual(roster.find(x => x.id === p.portraitId).genderPresentation, expectedGender);
  }
  for (const age of [14, 20, 35, 72]) for (let i=0;i<20;i++) {
    const p=select({id:`extra-${i}-${age}`, name:'Visitor',wearingRed:i%2===0},age);
    assert.ok(!vm.runInContext('PORTRAIT_REGISTRY.reservedVisitorIds',h.sandbox).includes(p.portraitId),'Named cast must not be reused as random customers');
  }
  const person = g.generateCustomerScenario('age_valid').person;
  const markup = vm.runInContext('CHARACTERS.renderPortrait('+JSON.stringify(person)+')',h.sandbox);
  assert.match(markup, /<img/);
  assert.ok(roster.some(p => markup.includes(p.src)));
});

test("41. Genuine IDs reuse the customer's portrait; borrowed IDs use different artwork", () => {
  const h = createHarness(4100), G = h.Game;
  const c = stageCase(h, 'adult_horror_day2', 2);
  const customerMarkup = vm.runInContext('CHARACTERS.renderPortrait(Game.state.currentCustomer.person)', h.sandbox);
  assert.ok(customerMarkup.includes('<img'), 'Ordinary customers should show portraits');
  requestId(G,c);
  h.UI.renderTicketOnDesk(c);
  const root = deskId(h);
  const photo = findElement(root, e => e.id === 'idModalPhotoBtn');
  assert.ok(photo.innerHTML.includes(customerMarkup), 'Genuine photo must be identical to customer portrait');
  const forged = stageCase(h, 'leo_day4', 4);
  requestId(G,forged); h.UI.renderTicketOnDesk(forged);
  const falsePhoto = findElement(deskId(h),e=>e.id==='idModalPhotoBtn');
  assert.ok(falsePhoto.innerHTML.includes('assets/characters/customers/'), 'Borrowed ID must use an actual different portrait');
  const markup=vm.runInContext('CHARACTERS.renderPortrait({id:"ghost",portraitId:"not-on-disk"})', h.sandbox);
  assert.ok(markup.includes('<svg'), 'Unregistered assets fall back');
  assert.ok(customerMarkup.includes('onerror="CHARACTERS.handlePortraitImageError(this)"'));
});

test("46. Every scripted Leo encounter receives its intended illustration", () => {
  const expectations = [
    [2,'leo_day2','leo_neutral.webp',null],
    [3,'leo_day3','leo_beard.webp',null],
    [4,'leo_day4','leo_suit.webp','sunglasses'],
    [5,'leo_day5','leo_moustache.webp',null],
    [6,'leo_day6','leo_cap.webp','staffUniform'],
    [7,'leo_day7','leo_innocent.webp',null]
  ];
  for (const [day,id,image,overlay] of expectations) {
    const h=createHarness(4600+day),c=stageCase(h,id,day);
    const markup=vm.runInContext('CHARACTERS.renderPortrait(Game.state.currentCustomer.person)',h.sandbox);
    assert.ok(markup.includes(image),`${id}: uses ${image}`);
    if (overlay) assert.ok(markup.includes(`data-costume="${overlay}"`),`${id}: shows ${overlay}`);
    else assert.ok(!markup.includes('data-costume='),`${id}: no added costume`);
  }
});

test("47. Dedicated Maya and Mrs Blackwood portraits stay distinct from visitors", () => {
  const h=createHarness(4700),r=vm.runInContext('PORTRAIT_REGISTRY',h.sandbox);
  const named=h.Game.campaign().characters;
  const maya=vm.runInContext('CHARACTERS.renderPortrait('+JSON.stringify({...named.maya,characterId:'maya'})+')',h.sandbox);
  const manager=vm.runInContext('CHARACTERS.renderPortrait('+JSON.stringify({...named.mr_blackwood,characterId:'mr_blackwood'})+')',h.sandbox);
  assert.ok(maya.includes('maya.webp') && !maya.includes('data-costume='));
  assert.ok(manager.includes('manager.webp') && !manager.includes('data-costume='));
  assert.notStrictEqual(r.recurring.maya,r.recurring.sofia);
  assert.notStrictEqual(r.recurring.mr_blackwood,r.recurring.mr_morris);
  for(let i=0;i<100;i++) {
    const p=vm.runInContext(`CHARACTERS.assignPortrait(${JSON.stringify({id:'roster-'+i,name:i%2?'David':'Anna',wearingRed:i%3===0})}, 30)`,h.sandbox);
    assert.ok(!r.reservedVisitorIds.includes(p.portraitId));
  }
});

test("48. Document portraits match Leo's current costume unless photo mismatch is authored", () => {
  for(const [day,id] of [[3,'leo_day3'],[4,'leo_day4'],[5,'leo_day5'],[7,'leo_day7']]) {
    const h=createHarness(4800+day),G=h.Game,c=stageCase(h,id,day);
    if (!c.idCard?.exists) continue;
    requestId(G,c);
    h.UI.renderTicketOnDesk(c);
    const photo=findElement(deskId(h),e=>e.id==='idModalPhotoBtn');
    const face=vm.runInContext('CHARACTERS.renderPortrait(Game.state.currentCustomer.person)',h.sandbox);
    if(c.idCard.photoMismatch) {
      assert.ok(!photo.innerHTML.includes(face),`${id}: borrowed ID must differ from Leo`);
    } else {
      assert.ok(photo.innerHTML.includes(face),`${id}: photo must match Leo's encounter appearance`);
    }
    if(c.idCard.photoAltered) assert.ok(photo.innerHTML.includes('id-photo-tape'));
  }
});

test("49. Costume image fallback preserves SVG disguise details and RNG", () => {
  const h=createHarness(4900),G=h.Game;
  const c=stageCase(h,'leo_day3',3);
  const before=JSON.stringify(c),seed=G.state.rngState;
  const markup=vm.runInContext('CHARACTERS.renderPortrait(Game.state.currentCustomer.person)',h.sandbox);
  assert.ok(markup.includes('portrait-image') && markup.includes('leo_beard.webp'));
  assert.ok(!markup.includes('data-costume="fakeBeard"'), 'Dedicated beard image needs no overlay');
  const encoded=markup.match(/data-fallback-person="([^"]+)"/)?.[1];
  assert.ok(encoded);
  const img={outerHTML:'',getAttribute:(k)=>k==='data-fallback-person'?encoded:k==='data-fallback-mood'?'neutral':null,closest:()=>null};
  h.sandbox.__testBrokenPortrait = img;
  vm.runInContext('CHARACTERS.handlePortraitImageError(__testBrokenPortrait)',h.sandbox);
  assert.match(img.outerHTML,/<svg/);
  assert.match(img.outerHTML,/accessory-fake-beard/);
  assert.ok(!img.outerHTML.includes('portrait-stage'),'Do not leave a separate beard overlay on the SVG fallback');
  assert.strictEqual(JSON.stringify(c),before);
  assert.strictEqual(G.state.rngState,seed);
});

test("50. Variant selection accepts named keys only and preserves non-Leo SVG costumes", () => {
  const h=createHarness(5000),render=p=>vm.runInContext('CHARACTERS.renderPortrait('+JSON.stringify(p)+')',h.sandbox);
  const leo={...h.Game.campaign().characters.leo,characterId:'leo'};
  assert.ok(render({...leo,portraitVariant:'glasses'}).includes('leo_glasses.webp'));
  assert.ok(render({...leo,portraitVariant:'../../untrusted'}).includes('leo_neutral.webp'));
  assert.ok(!render({...leo,portraitVariant:'../../untrusted'}).includes('../../untrusted.webp'));
  const person={id:'extra',portraitId:'woman-10',name:'Extra',skinColor:'#aaa',hairColor:'#222',coatColor:'#555',shirtColor:'#fff',staffBadge:true};
  assert.match(render(person),/<svg/,'Normal-customer costume still renders in SVG');
  assert.match(render({...person,staffBadge:false}),/<img/);
});

test("51. Character renderer remains campaign-independent; profiles are data-driven", () => {
  const src=fs.readFileSync(path.join(ROOT,'js/characters.js'),'utf8');
  assert.ok(!src.includes("knownId === 'leo'") && !src.includes("knownId === 'maya'"));
  const h=createHarness(5100);
  const prof=vm.runInContext('PORTRAIT_REGISTRY.costumeProfiles',h.sandbox);
  assert.ok(prof.leo.rules.some(r=>r.whenAny.includes('fakeBeard') && r.variant==='beard'));
  assert.deepEqual(prof.maya, {});
  const image=vm.runInContext(`CHARACTERS.renderPortrait({id:'leo',characterId:'leo',fakeBeard:true,skinColor:'#a86',hairColor:'#999',coatColor:'#222',shirtColor:'#fff'})`,h.sandbox);
  assert.ok(image.includes('leo_beard.webp') && !image.includes('data-costume="fakeBeard"'));
});

test("52. Both eligible and underage young visitors appear, with no compulsory ID prompt", () => {
  const h=createHarness(5200), G=h.Game;
  G.state.day=2; G.startShift();
  const adult=G.generateCustomerScenario('adult_horror_day2');
  G.finalizeCustomerAtWindow(adult);
  assert.strictEqual(adult.idCard.presented,false);
  assert.deepEqual(G.evaluateCustomerCase(adult).validActions,['ADMIT']);
  const eligible=G.generateCustomerScenario('age_valid');
  G.finalizeCustomerAtWindow(eligible);
  assert.ok(eligible.trueAge>=12 && eligible.trueAge<27);
  assert.strictEqual(eligible.idCard.presented,false);
  assert.deepEqual(G.evaluateCustomerCase(eligible).validActions,['ADMIT']);
  const juvenile=G.generateCustomerScenario('underage');
  G.finalizeCustomerAtWindow(juvenile);
  assert.ok(juvenile.trueAge<G.screening(juvenile.ticket.filmId).minAge);
  assert.strictEqual(juvenile.idCard.presented,false);
  assert.strictEqual(G.evaluateCustomerCase(juvenile).needsIdentification,false);
  assert.deepEqual(G.evaluateCustomerCase(juvenile).validActions,['REFUSE']);
  for(const c of [eligible,juvenile]) {
    const art=vm.runInContext('PORTRAIT_REGISTRY.visitors',h.sandbox).find(v=>v.id===c.person.portraitId);
    assert.ok(art && ['youngAdult','under18'].includes(art.ageGroup),'Young visitors have age-appropriate portraits');
  }
});


test("53. The countdown is an explicit minutes:seconds limit with day-by-day pacing and independent difficulty", () => {
  const h=createHarness(5300),G=h.Game, d=h.sandbox.document;
  const counts=[6,8,9,10,10,12,11];
  const duration=[480,540,540,540,480,480,450];
  for(let day=1;day<=7;day++){
    G.state.day=day;
    assert.strictEqual(G.getShiftTarget(),counts[day-1]);
    assert.strictEqual(G.getShiftDurationSeconds('normal'),duration[day-1]);
    assert.strictEqual(G.getShiftDurationSeconds('relaxed'),Math.round(duration[day-1]*1.5));
    assert.strictEqual(G.getShiftDurationSeconds('chaos'),Math.round(duration[day-1]*.75));
  }
  G.state.day=1;G.setDifficulty('normal');G.startShift();
  assert.strictEqual(G.state.shiftTargetCustomers,6);
  assert.strictEqual(d.getElementById('clockDisplay').textContent,'08:00');
  assert.strictEqual(d.getElementById('shiftProgress').textContent,'0 / 6');
  const before=G.state.clockMins;
  G.tick();
  assert.strictEqual(G.state.shiftRemainingSeconds,479);
  assert.strictEqual(d.getElementById('clockDisplay').textContent,'07:59');
  assert.strictEqual(G.state.clockMins,before,'Scenario arrival time is not a second countdown');
  G.stopShiftLoop();
});

test("54. Pause, help modal and feedback freeze the countdown; changing difficulty changes the available time", () => {
  const h=createHarness(5400),G=h.Game,U=h.UI;
  G.startShift();G.tick();const initial=G.state.shiftRemainingSeconds;
  G.state.paused=true;G.tick();assert.strictEqual(G.state.shiftRemainingSeconds,initial);
  G.state.paused=false;U.openGuideModal();G.tick();assert.strictEqual(G.state.shiftRemainingSeconds,initial);
  U.closeGuideModal();
  G.state.decisionLocked=true;G.tick();assert.strictEqual(G.state.shiftRemainingSeconds,initial);
  G.state.decisionLocked=false;
  G.setDifficulty('relaxed');assert.strictEqual(G.state.shiftDurationSeconds,720);
  assert.strictEqual(G.state.shiftRemainingSeconds,719);
  G.setDifficulty('chaos');assert.strictEqual(G.state.shiftDurationSeconds,360);
  assert.strictEqual(G.state.shiftRemainingSeconds,359);
  G.stopShiftLoop();
});

test("55. Replaying a day changes procedural sequence but preserves every guaranteed story slot", () => {
  const h=createHarness(5500),G=h.Game;
  G.startShift();
  const first=JSON.stringify(G.state.shiftPlan),seed=G.rngSeed;
  const initialStory=JSON.stringify(G.state.story);
  G.endShift();G.replayCurrentDay();G.startShift();
  const replay=JSON.stringify(G.state.shiftPlan);
  assert.notStrictEqual(G.rngSeed,seed);
  assert.notStrictEqual(first,replay,'Replaying must not use the same generated ordinary plan');
  assert.strictEqual(JSON.stringify(G.state.story),initialStory,'Story progress rolls back');
  const mandatory=G.state.shiftPlan.filter(x=>x.kind==='story').map(x=>x.group);
  assert.deepEqual(mandatory.sort(),['blackwood_day1','morris_day1','sofia_day1'].sort());
  assert.strictEqual(G.state.shiftPlan.length,6);
  G.stopShiftLoop();
});

test("56. Countdown expiry removes unserved ordinary customers but plays all mandatory story scenes", () => {
  const h=createHarness(5600),G=h.Game;
  G.state.day=4;G.startShift();
  const groups=G.state.shiftPlan.filter(x=>x.kind==='story').map(x=>x.group);
  const ordinary=G.state.shiftPlan.filter(x=>x.kind==='ordinary').length;
  G.state.shiftRemainingSeconds=1;G.tick();
  assert.strictEqual(G.state.shiftExpired,true);
  let served=[];
  for(let i=0;G.state.shiftActive && i<20;i++){
    const c=G.state.currentCustomer;served.push(c.scriptedId || c.caseType);
    const ev=answerRequiredQuestions(G);
    G.makeDecision(ev.validActions[0],ev.options[0]);
    G.nextCustomerFromQueue();
  }
  assert.strictEqual(G.state.shiftActive,false);
  assert.ok(G.state.shiftStats.customersLost>=ordinary,'Unserved ordinary slots are reported');
  for(const group of groups){
    assert.ok(G.state.encounterGroupsDone[group] || G.state.scriptedDone[group], `Story group ${group} must be resolved`);
  }
  assert.strictEqual(G.state.shiftStats.served+G.state.shiftStats.customersLost,G.state.shiftTargetCustomers);
  assert.ok(h.sandbox.document.getElementById('reportModalTitle').textContent.includes('TIME UP'));
});

test("57. On-time completion awards €5; scenario plans are bounded and contain varied ordinary cases", () => {
  const h=createHarness(5700),G=h.Game;
  G.startShift();
  assert.ok(G.state.shiftPlan.some(e=>e.kind==='ordinary' && ['valid','age_valid'].includes(e.caseType)));
  assert.ok(G.state.shiftPlan.some(e=>e.kind==='ordinary' && !['valid','age_valid'].includes(e.caseType)));
  let count=0;
  while(G.state.shiftActive && count++<20){
    const ev=answerRequiredQuestions(G);
    G.makeDecision(ev.validActions[0],ev.options[0]);
    G.nextCustomerFromQueue();
  }
  assert.ok(count<20,'Day 1 must finish promptly after its finite plan');
  assert.strictEqual(G.state.shiftStats.served,6);
  assert.strictEqual(G.state.shiftStats.customersLost,0);
  assert.strictEqual(G.state.shiftStats.cashEarned,G.state.outcomes.reduce((sum,o)=>sum+({ADMIT:10,CORRECT:12,REFUSE:8}[o.action]||0),0)+5);
  assert.ok(G.state.shiftRemainingSeconds>0,'Finishing all cases does not require clock expiry');
});

test("58. Portrait allocation favours unused compatible faces without changing a customer's saved portrait", () => {
  const h=createHarness(5800),G=h.Game;
  const portraits=vm.runInContext('PORTRAIT_REGISTRY.visitors',h.sandbox);
  const pool=portraits.filter(p=>p.genderPresentation==='female' && p.ageGroup==='youngAdult' && !p.wearingRed);
  assert.ok(pool.length>1);
  const person={name:'Anna',id:'visitor-1',wearingRed:false,glasses:false,hat:false};
  vm.runInContext('CHARACTERS.assignPortrait(__person,22,__recent)',Object.assign(h.sandbox,{__person:person,__recent:[]}));
  const first=person.portraitId;
  const second={name:'Anna',id:'visitor-2',wearingRed:false,glasses:false,hat:false};
  h.sandbox.__person=second;h.sandbox.__recent=[first];
  vm.runInContext('CHARACTERS.assignPortrait(__person,22,__recent)',h.sandbox);
  assert.notStrictEqual(second.portraitId,first,'Another face should be selected when a matching one is available');
  h.sandbox.__recent=[];
  vm.runInContext('CHARACTERS.assignPortrait(__person,22,__recent)',h.sandbox);
  assert.notStrictEqual(second.portraitId,first,'Once assigned, the portrait remains stable');
  assert.strictEqual(G.policies().lateToleranceMins,null);
});

test("62. Game Settings contains no classroom-era hints, textbook labels, or education-only save flags", () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const lang = fs.readFileSync(path.join(ROOT, 'js/language/elementary.js'), 'utf8');
  const { Game, UI, storage } = createHarness(6200);
  for (const legacy of ['teacherModal', 'teacherToggleHints', 'languageHintBar', 'briefingLanguageFocus', 'Unit 9', 'Word help']) {
    assert.ok(!html.includes(legacy), `Legacy UI remains: ${legacy}`);
  }
  assert.ok(!lang.includes('vocabularyHints') && !lang.includes('/languageFocus'));
  assert.ok(!Object.prototype.hasOwnProperty.call(Game.state, 'showLanguageHints'));
  UI.openSettingsModal();
  assert.ok(UI.modalStack.has('settingsModal'));
  UI.closeSettingsModal();
  assert.ok(!UI.modalStack.has('settingsModal'));
  Game.saveProgress();
  const save = JSON.parse(storage.getItem('cinema_chaos_campaigns_v3'));
  assert.ok(!Object.prototype.hasOwnProperty.call(save, 'showLanguageHints'));
  assert.ok(!Object.prototype.hasOwnProperty.call(save.campaigns['the-first-week'], 'showLanguageHints'));
});

test("63. Intermediate pack covers seven days without changing case decisions", () => {
  const primary = createHarness(6300), middle = createHarness(6300);
  middle.Game.setLanguageMode('intermediate');
  assert.strictEqual(middle.Game.campaign().activeLanguageMode, 'intermediate');
  assert.notStrictEqual(primary.Game.campaign().days[1].briefingMemo, middle.Game.campaign().days[1].briefingMemo);
  const trace = h => {
    const out = [];
    for (let day = 1; day <= 7; day++) {
      h.sandbox.CinemaDebug.setSeed(6300 + day * 10);
      h.sandbox.document.getElementById('settingsDaySelect').value = String(day);
      h.Game.jumpToDay();h.Game.startShift();
      for (let n = 0; n < 7 && h.Game.state.shiftActive; n++) {
        const c = h.Game.state.currentCustomer;
        const ev = answerRequiredQuestions(h.Game);
        out.push(JSON.stringify({day,n,scriptedId:c.scriptedId,caseType:c.caseType,
          filmId:c.ticket.filmId,seatCount:c.ticket.seats,group:c.groupSize,
          intent:c.intent,validActions:ev.validActions,
          optionIds:ev.options.map(o => o?.id || o),issues:ev.issues.map(i => i.code)}));
        h.Game.makeDecision(ev.validActions[0],ev.options[0]);h.Game.nextCustomerFromQueue();
      }
      h.Game.stopShiftLoop();
    }
    return out;
  };
  assert.deepStrictEqual(trace(primary),trace(middle),'Level changes cannot alter decisions');
});

test("64. Language changes are deferred until the next encounter", () => {
  const {Game} = createHarness(6400);
  Game.startShift();
  const statement = Game.state.currentCustomer.statement;
  const oldMemo = Game.campaign().days[2].briefingMemo;
  Game.setLanguageMode('intermediate');
  assert.strictEqual(Game.state.languageMode,'elementary');
  assert.strictEqual(Game.state.currentCustomer.statement,statement);
  assert.strictEqual(Game.campaign().days[2].briefingMemo,oldMemo);
  const ev=answerRequiredQuestions(Game);Game.makeDecision(ev.validActions[0],ev.options[0]);
  Game.nextCustomerFromQueue();
  assert.strictEqual(Game.state.languageMode,'intermediate');
  assert.notStrictEqual(Game.campaign().days[2].briefingMemo,oldMemo);
  assert.ok(Game.getCustomerQuestions(Game.state.currentCustomer).some(q=>q[1] === 'Which film did you book?'));
  Game.setLanguageMode('elementary');
  const next=answerRequiredQuestions(Game);Game.makeDecision(next.validActions[0],next.options[0]);
  Game.nextCustomerFromQueue();
  assert.strictEqual(Game.state.languageMode,'elementary');
  assert.strictEqual(Game.campaign().days[2].briefingMemo,oldMemo);
  Game.stopShiftLoop();
});

test("65. Saved encounters retain their language when a change is pending", () => {
  const original = createHarness(6500);
  original.Game.setLanguageMode('intermediate');original.Game.startShift();
  const statement=original.Game.state.currentCustomer.statement;
  original.Game.setLanguageMode('elementary');original.Game.saveProgress();
  const loaded=createHarness(6500,null,structuredClone(original.storage._s));
  loaded.Game.startShift();
  assert.strictEqual(loaded.Game.state.languageMode,'intermediate');
  assert.strictEqual(loaded.Game.state.pendingLanguageMode,'elementary');
  assert.strictEqual(loaded.Game.campaign().activeLanguageMode,'intermediate');
  assert.strictEqual(loaded.Game.state.currentCustomer.statement,statement);
  const ev=answerRequiredQuestions(loaded.Game);loaded.Game.makeDecision(ev.validActions[0],ev.options[0]);
  loaded.Game.nextCustomerFromQueue();
  assert.strictEqual(loaded.Game.state.languageMode,'elementary');
  assert.strictEqual(loaded.Game.campaign().activeLanguageMode,'elementary');
  loaded.Game.stopShiftLoop();original.Game.stopShiftLoop();
});

test("66. Advanced mode presents nuanced dialogue while retaining simple questions", () => {
  const { Game } = createHarness(6600);
  const campaign = Game.campaign();
  assert.strictEqual(campaign.languageModes.advanced.available, true);
  const expectedQuestion = campaign.languagePacks.intermediate.playerQuestions.find(q => q[0] === 'which_film')[1];
  Game.setLanguageMode('advanced');
  assert.strictEqual(Game.state.languageMode, 'advanced');
  assert.strictEqual(Game.languagePack().unitTitle, 'The First Week — Advanced');
  assert.strictEqual(Game.campaign().activeLanguageMode, 'advanced');
  assert.strictEqual(Game.campaign().playerQuestions.find(q => q[0] === 'which_film')[1], expectedQuestion,
    'Routine questions must not be artificially inflated in Advanced');
  assert.ok(Game.campaign().days[5].briefingMemo.includes('personal assurance'));
  assert.ok(Game.campaign().days[7].scriptedEncounters.find(c => c.id === 'blackwood_day7')
    .qaOverrides.challenge_vip.includes('Lower your voice'));
  assert.strictEqual(Game.say('wrongFilm', {request:'a thriller'}),
    "I think something's gone wrong with my booking. I asked for a thriller, not this.");
  assert.notStrictEqual(Game.languagePack().films.find(f => f.id === 'planet_x').descriptions[0],
    Game.campaign().languagePacks.elementary.films.find(f => f.id === 'planet_x').descriptions[0]);
});

test("67. Advanced, Intermediate and Elementary produce identical seven-day decisions", () => {
  const modes = ['elementary', 'intermediate', 'advanced'];
  const traces = modes.map(mode => {
    const h = createHarness(6700);
    h.Game.setLanguageMode(mode);
    const events = [];
    for (let day=1; day<=7; day++) {
      h.sandbox.CinemaDebug.setSeed(6700+day*10);
      h.sandbox.document.getElementById('settingsDaySelect').value=String(day);
      h.Game.jumpToDay();h.Game.startShift();
      for (let i=0;i<7&&h.Game.state.shiftActive;i++) {
        const c=h.Game.state.currentCustomer;
        const ev=answerRequiredQuestions(h.Game);
        events.push(JSON.stringify({day,caseType:c.caseType,scriptedId:c.scriptedId,
          filmId:c.ticket.filmId,seatCount:c.ticket.seats,group:c.groupSize,
          intent:c.intent,validActions:ev.validActions,
          optionIds:ev.options.map(o=>o?.id||o),issues:ev.issues.map(i=>i.code)}));
        h.Game.makeDecision(ev.validActions[0],ev.options[0]);h.Game.nextCustomerFromQueue();
      }
      h.Game.stopShiftLoop();
    }
    return events;
  });
  assert.deepStrictEqual(traces[0],traces[1]);
  assert.deepStrictEqual(traces[1],traces[2]);
});

test("68. Advanced language switching is deferred and survives save/restore", () => {
  const first = createHarness(6800);
  first.Game.setLanguageMode('advanced');first.Game.startShift();
  const original = first.Game.state.currentCustomer.statement;
  first.Game.setLanguageMode('intermediate');first.Game.saveProgress();
  const restored = createHarness(6800,null,structuredClone(first.storage._s));
  restored.Game.startShift();
  assert.strictEqual(restored.Game.state.languageMode,'advanced');
  assert.strictEqual(restored.Game.state.pendingLanguageMode,'intermediate');
  assert.strictEqual(restored.Game.state.currentCustomer.statement,original);
  const ev=answerRequiredQuestions(restored.Game);
  restored.Game.makeDecision(ev.validActions[0],ev.options[0]);
  restored.Game.nextCustomerFromQueue();
  assert.strictEqual(restored.Game.state.languageMode,'intermediate');
  assert.strictEqual(restored.Game.campaign().activeLanguageMode,'intermediate');
  restored.Game.setLanguageMode('advanced');
  const after=answerRequiredQuestions(restored.Game);
  restored.Game.makeDecision(after.validActions[0],after.options[0]);
  restored.Game.nextCustomerFromQueue();
  assert.strictEqual(restored.Game.state.languageMode,'advanced');
  first.Game.stopShiftLoop();restored.Game.stopShiftLoop();
});

console.log(`\nAll ${passed} test suites passed!`);
