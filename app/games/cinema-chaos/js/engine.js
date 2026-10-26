    /***************************************************************************
     * 5. CENTRAL VALIDATION ENGINE & SCENARIO GENERATOR
     ***************************************************************************/
    const Game = {
      state: {
        campaignId: "the-first-week",
        languageMode: "elementary", // 'elementary' | 'intermediate' | 'advanced'
        selectedLanguageMode: "elementary",
        pendingLanguageMode: null,
        pendingCampaignAction: null,
        customLanguagePack: null,
        day: 1,
        story: {}, bookings: {}, outcomes: [], modalDepth: 0, serialCounter: 400,
        resolvedEncounters: {},
        difficulty: "normal", // 'relaxed' | 'normal' | 'chaos'
        money: 0,
        reputation: 80,
        warnings: 0,
        maxWarnings: 3,
        lastShiftDismissed: false,
        ownedUpgrades: [],
        completedDays: [],
        highScore: 0,
        totalCustomersLost: 0,

        // Game settings
        enableTVContent: true,
        disableQueueWalkouts: false,

        // Live Shift State
        shiftActive: false,
        paused: false,
        clockMins: 17 * 60 + 45, // 17:45
        clockEndMins: 21 * 60 + 15, // 21:15
        clockFormatted: "17:45", // Internal, fixed arrival-time chronology, not the HUD timer
        shiftDurationSeconds: 0,
        shiftRemainingSeconds: 0,
        shiftTargetCustomers: 0,
        shiftPlan: [],
        shiftQueuedCount: 0,
        shiftExpired: false,
        replayNonce: 0,
        recentPortraits: [],
        recentCustomerNames: [],

        schedule: [],
        tvSchedule: [],
        usedSerials: [],
        authorizedVips: [],

        currentCustomer: null,
        queue: [],
        casesGeneratedCount: 0,
        shiftStats: {
          served: 0,
          correct: 0,
          mistakes: 0,
          warnings: 0,
          exceptions: 0,
          customersLost: 0,
          cashEarned: 0,
          dilemmaNotes: []
        },

        // Inspection Tool State
        inspectMode: true,
        inspectFirst: null,
        decisionLocked: false
      },

      timerInterval: null,
      rngSeed: Date.now() % 2147483647,

      // Seeded pseudo-random generator for reproducible & balanced case distribution
      rng() {
        this.rngSeed = (this.rngSeed * 16807) % 2147483647;
        return (this.rngSeed - 1) / 2147483646;
      },

      campaign() {
        const reg = window.CinemaChaos && window.CinemaChaos.CampaignRegistry;
        if (!reg) throw new Error("CampaignRegistry is not loaded.");
        return reg.get(this.state.campaignId) || reg.list()[0];
      },

      dayConfig(day = this.state.day) {
        const camp = this.campaign();
        const playableMax = camp.playableDaysCount || camp.totalDays || 5;
        if (day > playableMax || (camp.days[day] && camp.days[day].playable === false)) {
          return camp.endlessDay || camp.days[day] || camp.days[playableMax];
        }
        return camp.days[day] || camp.endlessDay || camp.days[1];
      },

      policies(day = this.state.day) {
        return this.dayConfig(day).policies || {};
      },

      languagePack() {
        // Legacy imported packs are Elementary-only. They must not silently
        // override a selected Intermediate or Advanced experience.
        if (this.state.customLanguagePack && this.state.languageMode === 'elementary') return this.state.customLanguagePack;
        const camp = this.campaign();
        const mode = this.state.languageMode || "elementary";
        if (camp.languageModes?.[mode]?.available && camp.languagePacks?.[mode]) {
          return camp.languagePacks[mode];
        }
        return camp.languagePack;
      },

      // Activate the selected language without changing the campaign's factual
      // screening data, bookings, serials, age rules or existing customer.
      syncLanguagePresentation() {
        const camp = this.campaign();
        const mode = this.state.languageMode || 'elementary';
        if (typeof camp.applyLanguageMode !== 'function') return;
        if (camp.activeLanguageMode !== mode) {
          camp.applyLanguageMode(mode);
        }
        // Existing schedule objects are detached copies of the language-pack
        // films. Update only linguistic fields; never rebuild a live schedule.
        const byId = new Map((this.languagePack()?.films || []).map(f => [f.id, f]));
        for (const film of this.state.schedule || []) {
          const source = byId.get(film.id);
          if (source) {
            for (const key of ['descriptions', 'purposePhrases', 'adjective', 'genreLabel']) {
              if (source[key] !== undefined) film[key] = source[key];
            }
          }
        }
      },

      // Elementary fallback also preserves compatibility with older custom packs.
      say(key, values = {}) {
        const pack = this.languagePack();
        const template = pack?.procedural?.[key] ?? FIRST_WEEK_ELEMENTARY.procedural[key];
        if (typeof template !== 'string') throw new Error(`Missing dialogue: ${key}`);
        return template.replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) =>
          Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : `{${name}}`);
      },

      upgradesCatalog() {
        return this.campaign()?.upgradesCatalog || [];
      },

      init() {
        this.loadProgress();
        this.syncLanguagePresentation();
        const seed = Number(new URLSearchParams(location.search).get("seed"));
        if(Number.isInteger(seed)&&seed>0) this.rngSeed=seed%2147483647||1;
        this.prepareDaySchedule(this.state.day);
        UI.renderHeader();
        UI.renderScheduleBinder();
        UI.renderRulesBinder();
        UI.renderSerialsBinder();
        UI.renderUpgradesStrip();
        UI.openBriefingModal(this.state.day);
        UI.openCampaignSelectModal({ isInitialLaunch: true });
        document.getElementById('languagePackJsonArea').value = JSON.stringify(this.languagePack(), null, 2);
        document.getElementById('saveNotice').textContent=this.startupMessage||'Progress saves automatically. Continue resumes your saved shift.';
        const day=document.getElementById('scheduleDayTag');day.tabIndex=0;day.setAttribute('role','button');day.classList.add('inspectable');day.onclick=()=>Game.handleInspectClick('today',Game.today(),'Today: '+Game.today(),day);
        document.getElementById('customerStatementBox').tabIndex=0;
        UI.setDecisionButtons(true);
        if(innerWidth<1024)UI.switchMobileTab('window');
      },

      formatMins(totalMins) {
        const h = Math.floor(totalMins / 60);
        const m = totalMins % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      },

      warningThresholds: {
        relaxed: 4,
        normal: 3,
        chaos: 2
      },

      getMaxWarnings(diff = this.state.difficulty) {
        return this.warningThresholds[diff] ?? this.warningThresholds.normal;
      },

      getWarningOrdinal(limit = this.getMaxWarnings()) {
        const map = { 1: 'first', 2: 'second', 3: 'third', 4: 'fourth', 5: 'fifth' };
        return map[limit] || `${limit}th`;
      },

      isShiftDismissed() {
        return this.state.warnings >= this.getMaxWarnings();
      },

      getWarningActionLabel(action, isException = false) {
        if (isException) return 'Discretionary admission';
        if (action === 'ADMIT') return 'Incorrect admission';
        if (action === 'REFUSE') return 'Ticket refused incorrectly';
        if (action === 'CORRECT') return 'Incorrect ticket correction';
        return 'Rule violation';
      },

      issueWarning(reasonLabel = 'Rule violation') {
        const max = this.getMaxWarnings();
        this.state.maxWarnings = max;
        if (this.state.ownedUpgrades.includes('handbook') && !this.state.forgivenWarningUsed) {
          this.state.forgivenWarningUsed = true;
          return {
            issued: false,
            forgiven: true,
            warnings: this.state.warnings,
            maxWarnings: max,
            dismissed: this.state.warnings >= max,
            summaryText: `${reasonLabel} — No management warning issued (forgiven by Manager's Handbook, ${this.state.warnings} / ${max}).`
          };
        }
        this.state.warnings += 1;
        if (this.state.shiftStats) {
          this.state.shiftStats.warnings = this.state.warnings;
        }
        const dismissed = this.state.warnings >= max;
        return {
          issued: true,
          forgiven: false,
          warnings: this.state.warnings,
          maxWarnings: max,
          dismissed,
          summaryText: `${reasonLabel} — Management warning ${this.state.warnings} / ${max}.${dismissed ? ' Shift warning limit reached!' : ''}`
        };
      },

      setDifficulty(diff) {
        if (!["relaxed","normal","chaos"].includes(diff)) return;
        this.state.difficulty = diff;
        this.state.maxWarnings = this.getMaxWarnings(diff);
        if (this.state.shiftActive && this.state.shiftDurationSeconds) {
          const elapsed = this.state.shiftDurationSeconds - this.state.shiftRemainingSeconds;
          const nextDuration = this.getShiftDurationSeconds(diff);
          this.state.shiftDurationSeconds = nextDuration;
          this.state.shiftRemainingSeconds = Math.max(0, nextDuration - elapsed);
          this.state.shiftExpired = this.state.shiftRemainingSeconds === 0;
          UI.updateClockDisplay();
        }
        if(this.state.shiftActive) this.startShiftLoop();
        UI.updateDifficultyButtons();
        UI.renderHeader();
        if (typeof UI.renderBriefingObjective === 'function') UI.renderBriefingObjective();
        this.saveProgress();
      },

      setLanguageMode(mode) {
        if (!["elementary", "intermediate", "advanced"].includes(mode)) return;
        this.state.selectedLanguageMode = mode;
        const inActiveEncounter = Boolean(this.state.shiftActive && this.state.currentCustomer);
        if (inActiveEncounter) {
          this.state.pendingLanguageMode = mode;
        } else {
          this.state.languageMode = mode;
          this.state.pendingLanguageMode = null;
          this.syncLanguagePresentation();
          if (!this.state.shiftActive) {
            UI.renderScheduleBinder();
            UI.renderRulesBinder();
          }
        }
        UI.updateLanguageButtons();
        UI.renderHeader();
        this.saveProgress();
      },

      applyPendingLanguageMode() {
        if (this.state.pendingLanguageMode) {
          this.state.languageMode = this.state.pendingLanguageMode;
          this.state.pendingLanguageMode = null;
          this.syncLanguagePresentation();
          UI.renderRulesBinder();
          UI.updateLanguageButtons();
          UI.renderHeader();
        }
      },

      selectCampaign(campaignId) {
        const reg = window.CinemaChaos && window.CinemaChaos.CampaignRegistry;
        const target = reg && reg.get(campaignId);
        if (!target) throw new Error(`Unknown campaign: "${campaignId}"`);
        if (this.state.campaignId && this.state.campaignId !== campaignId) {
          this.saveProgress();
        }
        this.stopShiftLoop();
        this.state.shiftActive = false;
        this.state.paused = false;
        this.state.warnings = 0;
        this.state.lastShiftDismissed = false;
        this.state.forgivenWarningUsed = false;
        this.state.currentCustomer = null;
        this.state.decisionLocked = false;
        this.state.queue = [];
        this.state.customLanguagePack = null;
        this.state.campaignId = campaignId;
        this.loadProgress(campaignId);
        this.syncLanguagePresentation();
        this.applyPendingLanguageMode();
        this.prepareDaySchedule(this.state.day);
        UI.clearDepartureBanner();
        UI.renderHeader();
        UI.renderScheduleBinder();
        UI.renderRulesBinder();
        UI.renderSerialsBinder();
        UI.renderUpgradesStrip();
        this.saveProgress();
      },

      startOrContinueCampaign(campaignId, options = {}) {
        if (this.state.shiftActive) {
          if (campaignId === this.state.campaignId && !options.forceRestart) {
            this.state.pendingCampaignAction = null;
            UI.resumeActiveShiftFromMenu();
            return { status: "resumed" };
          }
          if (!options.confirmed) {
            this.state.pendingCampaignAction = { type: "switch", campaignId };
            UI.renderCampaignMenuShiftBanner();
            return { status: "warned", pending: this.state.pendingCampaignAction };
          }
        }
        this.state.pendingCampaignAction = null;
        this.selectCampaign(campaignId);
        const playableMax = this.campaign()?.playableDaysCount || 5;
        if (this.state.completedDays.includes(this.state.day) && this.state.day <= playableMax) {
          this.state.day += 1;
          this.prepareDaySchedule(this.state.day);
          UI.renderHeader();
          UI.renderScheduleBinder();
          UI.renderRulesBinder();
          UI.renderSerialsBinder();
          this.saveProgress();
        }
        UI.closeCampaignSelectModal();
        UI.closeShiftReportModal();
        UI.openBriefingModal(this.state.day);
        return { status: "switched" };
      },

      replayCampaign(campaignId, options = {}) {
        if (this.state.shiftActive && !options.confirmed) {
          this.state.pendingCampaignAction = { type: "replay", campaignId };
          UI.renderCampaignMenuShiftBanner();
          return { status: "warned", pending: this.state.pendingCampaignAction };
        }
        this.state.pendingCampaignAction = null;
        this.selectCampaign(campaignId);
        this.pendingShift = null;
        this.dayStartSnapshot = null;
        Object.assign(this.state, {
          day: 1,
          money: 0,
          reputation: 80,
          warnings: 0,
          ownedUpgrades: [],
          completedDays: [],
          totalCustomersLost: 0,
          story: {},
          resolvedEncounters: {},
          outcomes: []
        });
        this.prepareDaySchedule(1);
        this.saveProgress();
        UI.closeCampaignSelectModal();
        UI.closeShiftReportModal();
        UI.renderHeader();
        UI.renderScheduleBinder();
        UI.renderRulesBinder();
        UI.renderSerialsBinder();
        UI.renderUpgradesStrip();
        UI.openBriefingModal(1);
        return { status: "replayed" };
      },

      confirmPendingCampaignAction() {
        const act = this.state.pendingCampaignAction;
        if (!act) return null;
        this.state.pendingCampaignAction = null;
        if (act.type === "replay") {
          return this.replayCampaign(act.campaignId, { confirmed: true });
        }
        return this.startOrContinueCampaign(act.campaignId, { confirmed: true, forceRestart: true });
      },

      cancelPendingCampaignAction() {
        this.state.pendingCampaignAction = null;
        UI.renderCampaignMenuShiftBanner();
      },

      updateGameSettings() {
        this.state.enableTVContent=document.getElementById('settingsToggleTV').checked;
        this.state.disableQueueWalkouts=document.getElementById('settingsToggleTimer').checked;
        this.saveProgress();
      },

      jumpToDay() {
        this.pendingShift = null; this.dayStartSnapshot = null;
        this.stopShiftLoop();this.state.shiftActive=false;this.state.currentCustomer=null;this.state.decisionLocked=false;
        this.state.day=Number(document.getElementById('settingsDaySelect').value)||1;
        this.applyPendingLanguageMode();
        UI.closeSettingsModal();UI.closeShiftReportModal();UI.closeCampaignSelectModal();this.prepareDaySchedule(this.state.day);
        UI.renderHeader();UI.renderScheduleBinder();UI.renderRulesBinder();UI.renderSerialsBinder();UI.openBriefingModal(this.state.day);this.saveProgress();
      },

      exportLanguagePack() {
        const text=JSON.stringify(this.languagePack(),null,2),blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
        a.href=url;a.download='cinema-language-pack.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
        document.getElementById('languagePackJsonArea').value=text;
      },

      applyCustomLanguagePack() {
        const msg=document.getElementById('jsonStatusMsg');
        try {
          const parsed=this.validateLanguagePack(JSON.parse(document.getElementById('languagePackJsonArea').value));
          localStorage.setItem('cinema_chaos_pack_v2',JSON.stringify(parsed));
          this.state.customLanguagePack=parsed;
          this.stopShiftLoop();this.state.shiftActive=false;this.state.currentCustomer=null;
          this.prepareDaySchedule(this.state.day);UI.renderScheduleBinder();UI.renderRulesBinder();UI.openBriefingModal(this.state.day);
          msg.textContent='✓ Pack saved. Close settings and start a new shift.';msg.className='text-xs text-emerald-400';
        } catch(e){msg.textContent='Pack not changed: '+e.message;msg.className='text-xs text-rose-400';}
      },

      shiftSaveKeys: ['clockMins','clockEndMins','clockFormatted','shiftDurationSeconds','shiftRemainingSeconds','shiftTargetCustomers','shiftPlan','shiftQueuedCount','shiftExpired','recentPortraits','recentCustomerNames','warnings','forgivenWarningUsed',
        'schedule','tvSchedule','scheduleSnapshot','bookings','usedSerials','authorizedVips','authorizedStaff',
        'queue','currentCustomer','casesGeneratedCount','serialCounter','scriptedDone','encounterGroupsDone',
        'scriptedEncountersState','encounterArrivalTimes','noticesSeen','decisionLocked','closing','outcomes','shiftStats',
        'languageMode','pendingLanguageMode'],
      dayStartKeys: ['money','reputation','ownedUpgrades','completedDays','totalCustomersLost','story','resolvedEncounters','highScore'],
      captureShift() {
        if (!this.state.shiftActive) return this.pendingShift || null;
        const data = { day: this.state.day, campaignId: this.state.campaignId, rngSeed: this.rngSeed };
        for (const key of this.shiftSaveKeys) if (this.state[key] !== undefined) data[key] = structuredClone(this.state[key]);
        return data;
      },
      restoreShift(saved) {
        for (const key of this.shiftSaveKeys) if (saved[key] !== undefined) this.state[key] = structuredClone(saved[key]);
        this.rngSeed = saved.rngSeed;
        // An interrupted shift can have a pending language change. Restore
        // its actual active language before showing its existing customer.
        this.syncLanguagePresentation();
        Object.assign(this.state, { shiftActive: true, paused: false, modalDepth: 0, inspectFirst: null });
        this.pendingShift = null;
        if (!Number.isInteger(saved.shiftDurationSeconds) || !Array.isArray(saved.shiftPlan)) {
          // Legacy clock-based saves cannot safely resume a different shift model.
          this.state.shiftPlan = this.buildShiftPlan();
          this.state.shiftTargetCustomers = this.state.shiftPlan.length;
          this.state.shiftQueuedCount = Math.min(this.state.shiftPlan.length, this.state.casesGeneratedCount + this.state.queue.length);
          this.state.shiftDurationSeconds = this.getShiftDurationSeconds();
          this.state.shiftRemainingSeconds = this.state.shiftDurationSeconds;
          this.state.shiftExpired = false;
        }
        const c = this.state.currentCustomer;
        if (c) { UI.renderCustomer(c); UI.renderTicketOnDesk(c); }
        UI.renderQueue(); UI.renderHeader(); UI.renderScheduleBinder(); UI.renderRulesBinder(); UI.renderSerialsBinder(); UI.renderUpgradesStrip();
        UI.setDecisionButtons(this.state.decisionLocked);
        document.getElementById('nextCustomerBtn').classList.toggle('hidden', !this.state.decisionLocked);
        document.getElementById('deskFeedbackBanner').classList.add('hidden');
        document.getElementById('stampAnimationOverlay').classList.add('hidden');
        if (!c) this.nextCustomerFromQueue();
        this.startShiftLoop(); UI.renderPause();
      },

      startShift() {
        this.stopShiftLoop();this.state.modalDepth=0;UI.modalStack.clear();UI.closeBriefingModal();UI.closeCampaignSelectModal();UI.clearDepartureBanner();
        UI.closeIdCardModal();
        if (this.pendingShift?.day === this.state.day && this.pendingShift.campaignId === this.state.campaignId) {
          this.restoreShift(this.pendingShift);
          return;
        }
        this.pendingShift = null;
        this.applyPendingLanguageMode();
        if (!this.dayStartSnapshot || this.dayStartSnapshot.day !== this.state.day) {
          this.dayStartSnapshot = { day: this.state.day, rngSeed: this.rngSeed };
          for (const key of this.dayStartKeys) this.dayStartSnapshot[key] = structuredClone(this.state[key]);
        }
        this.prepareDaySchedule(this.state.day);
        Object.assign(this.state,{shiftActive:true,paused:false,clockMins:1065,clockFormatted:'17:45',warnings:0,lastShiftDismissed:false,queue:[],casesGeneratedCount:0,
          shiftExpired:false,shiftQueuedCount:0,shiftRemainingSeconds:0,shiftDurationSeconds:0,shiftTargetCustomers:0,shiftPlan:[],recentCustomerNames:[],
          forgivenWarningUsed:false,currentCustomer:null,decisionLocked:false,closing:false,outcomes:[],
          shiftStats:{served:0,correct:0,mistakes:0,warnings:0,exceptions:0,customersLost:0,cashEarned:0,dilemmaNotes:[]}});
        this.state.shiftPlan = this.buildShiftPlan();
        this.state.shiftTargetCustomers = this.state.shiftPlan.length;
        this.state.shiftDurationSeconds = this.getShiftDurationSeconds();
        this.state.shiftRemainingSeconds = this.state.shiftDurationSeconds;
        const noticeBox=document.getElementById('midShiftNoticeBox');
        noticeBox.classList.add('hidden');
        document.getElementById('rulesAlertDot').classList.add('hidden');
        this.setDifficulty(this.state.difficulty);SoundFX.bell();
        UI.renderHeader();UI.renderScheduleBinder();UI.renderRulesBinder();UI.renderSerialsBinder();UI.renderUpgradesStrip();UI.renderPause();
        this.spawnCustomerToQueue();this.spawnCustomerToQueue();this.nextCustomerFromQueue();this.startShiftLoop();
      },

      startShiftLoop() {
        this.stopShiftLoop();
        this.timerInterval=setInterval(()=>this.tick(),1000);
      },

      stopShiftLoop() {
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      },

      togglePause() { if(this.state.shiftActive&&!this.state.modalDepth){this.state.paused=!this.state.paused;UI.renderPause();} },

      // A short, finite shift. Campaigns may override these defaults per day.
      getShiftTarget() {
        const cfg = this.dayConfig();
        return cfg.shift?.targetCustomers || ([6,8,9,10,10,12,11,12][Math.min(this.state.day, 8) - 1] || 10);
      },
      getShiftDurationSeconds(diff = this.state.difficulty) {
        const base = this.dayConfig().shift?.durationSeconds || ([480,540,540,540,480,480,450,480][Math.min(this.state.day, 8) - 1] || 480);
        return Math.round(base * (diff === 'relaxed' ? 1.5 : diff === 'chaos' ? 0.75 : 1));
      },
      shiftProgress() {
        const s = this.state;
        return { completed: s.shiftStats.served + s.shiftStats.customersLost, target: s.shiftTargetCustomers };
      },
      // Story slots are created by encounter group, not by encounter ID. The
      // correct branch is chosen at the WINDOW, after earlier story choices.
      buildShiftPlan() {
        const cfg = this.dayConfig();
        const groups = new Map();
        for (const enc of cfg.scriptedEncounters || []) {
          if (!enc.guaranteed) continue;
          const key = enc.encounterGroup || enc.id;
          if (this.state.encounterGroupsDone?.[key] || this.state.scriptedDone?.[enc.id]) continue;
          if (groups.has(key)) continue;
          const variants = (cfg.scriptedEncounters || []).filter(e => (e.encounterGroup || e.id) === key);
          groups.set(key, Math.min(...variants.map(e => e.trigger?.minCaseIndex ?? e.trigger?.caseIndex ?? 0)));
        }
        const story = [...groups].map(([key,minIndex]) => ({kind:'story',group:key,minIndex}));
        const total = Math.max(this.getShiftTarget(),story.length);
        const plan = [], pending = [...story];
        const ordinary = this.makeOrdinaryCaseMix(total-story.length);
        const optionalUsed = new Set();
        const optional = (cfg.scriptedEncounters || []).filter(enc => !enc.guaranteed);
        for (let i = 0; i < total; i++) {
          const available = pending.filter(e => e.minIndex <= i);
          const lastOpportunity = pending.length >= total-i;
          if (available.length && (i === 0 || lastOpportunity || this.rng() < (i < total*.7 ? .65 : .85))) {
            // Preserve the story's broad order while varying its exact position.
            const chosen = available[Math.floor(this.rng()*Math.min(available.length,2))];
            pending.splice(pending.indexOf(chosen),1);
            plan.push({kind:'story',group:chosen.group});
          } else {
            const eligible = optional.filter(enc => !optionalUsed.has(enc.id) &&
              i >= (enc.trigger?.minCaseIndex ?? enc.trigger?.caseIndex ?? 0) &&
              (!enc.trigger?.requireStoryValue || this.matchesStoryCondition(enc.trigger.requireStoryValue)));
            const candidate = eligible.length && this.rng() < .15 ? this.pick(eligible) : null;
            if (candidate) optionalUsed.add(candidate.id);
            plan.push({kind:'ordinary',caseType:candidate?.id || ordinary.shift() || 'valid'});
          }
        }
        if (pending.length) throw new Error('Campaign shift is too short for its story encounters.');
        return plan;
      },
      makeOrdinaryCaseMix(count) {
        if (!count) return [];
        const pool = [...new Set(this.dayConfig().casePool || ['valid','screen','wrong_film'])].filter(t =>
          (t !== 'tv' && t !== 'tv_wrong' || this.policies().tvLoungeOpen) &&
          (t !== 'red' && t !== 'no_red' || (this.policies().conditionalScreenRules || []).length > 0));
        const validCount = Math.round(count * .45);
        const mix = [];
        for (let i=0;i<validCount;i++) mix.push(this.policies().checkAgeRestrictions && i%2 ? 'age_valid' : 'valid');
        const challenges = pool.filter(t => !['valid','age_valid','subjective'].includes(t));
        const shuffled = [...challenges];
        for (let i=shuffled.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
        for(let i=validCount;i<count;i++) mix.push(shuffled[(i-validCount)%shuffled.length] || 'screen');
        for(let i=mix.length-1;i>0;i--){const j=Math.floor(this.rng()*(i+1));[mix[i],mix[j]]=[mix[j],mix[i]];}
        return mix;
      },
      resolveStorySlot(group) {
        const options = (this.dayConfig().scriptedEncounters || []).filter(e => e.guaranteed && (e.encounterGroup || e.id) === group);
        return options.find(e => (!e.trigger?.requireStoryValue || this.matchesStoryCondition(e.trigger.requireStoryValue))
          && (!e.trigger?.requireStoryFlag || this.state.story[e.trigger.requireStoryFlag])) || options[options.length-1];
      },

      patienceConfig: {
        impatientThreshold: 40,
        criticalThreshold: 20,
        normalDecay: 0.75,
        chaosDecay: 1.5,
        seatingDivisor: 1.4,
        reputationPenalty: 3
      },

      getPatienceState(patience) {
        if (patience <= this.patienceConfig.criticalThreshold) return 'critical';
        if (patience <= this.patienceConfig.impatientThreshold) return 'impatient';
        return 'normal';
      },

      getPatienceDecayRate() {
        if (this.state.disableQueueWalkouts || this.state.difficulty === 'relaxed' || this.state.day <= 2) return 0;
        const base = this.state.difficulty === 'chaos' ? this.patienceConfig.chaosDecay : this.patienceConfig.normalDecay;
        return this.state.ownedUpgrades.includes('seating') ? base / this.patienceConfig.seatingDivisor : base;
      },

      updateQueuePatience() {
        if (!this.state.shiftActive || this.state.paused || this.state.modalDepth) return [];
        const decay = this.getPatienceDecayRate();
        const departed = [];
        if (decay > 0) {
          this.state.queue = this.state.queue.filter(c => {
            if (c.plan?.kind === 'story' || (c.preventQueueWalkout !== false && (c.scriptedId || c.guaranteedEncounter))) {
              c.patience = Math.max(15, c.patience - decay);
              return true;
            }
            c.patience = Math.max(0, c.patience - decay);
            if (c.patience > 0) return true;
            const encounterId = c.queuedEncounterId || c.scriptedId;
            if (encounterId && this.state.scriptedEncountersState) {
              this.state.scriptedEncountersState[encounterId] = 'scheduled';
            }
            departed.push(c);
            this.state.shiftStats.customersLost = (this.state.shiftStats.customersLost || 0) + 1;
            this.state.totalCustomersLost = (this.state.totalCustomersLost || 0) + 1;
            this.adjustReputation(-this.patienceConfig.reputationPenalty);
            return false;
          });
        }
        if (departed.length > 0) {
          UI.renderHeader();
          UI.notifyCustomerDepartures(departed, departed.length * this.patienceConfig.reputationPenalty);
          this.saveProgress();
        }
        UI.renderQueue(departed);
        return departed;
      },

      /*************************************************************************
       * SCENARIO GENERATOR: Creates and checks cases against live state
       * ~40% valid straightforward cases, ~60% varied inspection challenges
       *************************************************************************/
      // All screenings are fixed for a shift. Only announced setup events change them.
      allScreenings() { return [...this.state.schedule, ...this.state.tvSchedule]; },
      screening(id) { return this.allScreenings().find(f => f.id === id); },
      today() { return this.dayConfig().dayName; },
      currentDateISO(day = this.state.day) { return this.policies(day).currentDate || '2026-05-05'; },
      formatDateDMY(str) {
        if (typeof str !== 'string') return str || '';
        const trimmed = str.trim();
        const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
        if (isoMatch) {
          return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
        }
        return trimmed;
      },
      parseCalendarDate(str) {
        if (typeof str !== 'string') return null;
        let year, month, day;
        const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str.trim());
        const dmyMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str.trim());
        if (isoMatch) {
          [, year, month, day] = isoMatch.map(Number);
        } else if (dmyMatch) {
          [, day, month, year] = dmyMatch.map(Number);
        } else {
          return null;
        }
        if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1) return null;
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInMonths = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (day > daysInMonths[month - 1]) return null;
        const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dmy = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${String(year).padStart(4, '0')}`;
        return { year, month, day, iso, dmy };
      },
      isValidCalendarDate(str) { return Boolean(this.parseCalendarDate(str)); },
      compareDates(dateStrA, dateStrB) {
        const a = this.parseCalendarDate(dateStrA);
        const b = this.parseCalendarDate(dateStrB);
        if (!a || !b) return null;
        if (a.iso < b.iso) return -1;
        if (a.iso > b.iso) return 1;
        return 0;
      },
      calculateAge(dobStr, refDateStr = this.currentDateISO()) {
        const dob = this.parseCalendarDate(dobStr);
        const ref = this.parseCalendarDate(refDateStr);
        if (!dob || !ref) return null;
        let age = ref.year - dob.year;
        if (ref.month < dob.month || (ref.month === dob.month && ref.day < dob.day)) {
          age -= 1;
        }
        return age;
      },
      normalizeIdCard(idCard, personName = 'Visitor', day = this.state.day) {
        if (!idCard) return null;
        const card = { ...idCard };
        // Legacy age annotations are not identity-document fields. Keep age claims in dialogue.
        delete card.statedAge;
        card.presented = Boolean(card.presented);
        if (!card.exists) return card;
        card.holderName = card.holderName || personName || 'Visitor';
        const refDate = this.parseCalendarDate(this.currentDateISO(day)) || { year: 2026, month: 10, day: 12 };
        if (!card.issueDate) {
          const birthYear = this.parseCalendarDate(card.dob)?.year;
          const issYear = Math.max(birthYear || 0, refDate.year - 2);
          card.issueDate = `15/06/${issYear}`;
        }
        if (!card.expiryDate) {
          const expYear = refDate.year + 3;
          card.expiryDate = `15/06/${expYear}`;
        }
        if (!card.docNumber) {
          const seedStr = `${card.holderName}|${card.dob || ''}`;
          let hash = 0;
          for (let i = 0; i < seedStr.length; i++) {
            hash = ((hash << 5) - hash + seedStr.charCodeAt(i)) | 0;
          }
          const num = String(100000 + (Math.abs(hash) % 899999));
          card.docNumber = `CID-${num}`;
        }
        if (!card.issuingAuthority) {
          card.issuingAuthority = this.say('issuingAuthority');
        }
        if (!card.address) {
          // Fictional, stable address for procedural cards; campaigns may supply their own.
          const number = 1 + (Number(card.docNumber.replace(/\D/g, '').slice(-3)) || 0) % 120;
          card.address = this.say('defaultAddress', { number });
        }
        return card;
      },
      getKnownCustomerName(c) {
        if (!c) return null;
        if (c.introducedName) return c.introducedName;
        if (c.identityRevealed && c.person?.name) return c.person.name;
        if (c.revealsNameInOpening && c.person?.name) return c.person.name;
        if (c.idCard?.presented && c.idCard?.exists && c.idCard?.holderName) return c.idCard.holderName;
        if (c.ticket?.exists && c.ticket?.holderName) return c.ticket.holderName;
        const charId = c.person?.characterId || c.characterId;
        if (!c.concealIdentity && charId && this.state.story?.[`known_char_${charId}`] === 'yes' && c.person?.name) {
          return c.person.name;
        }
        return null;
      },
      needsIdFor(c, f = this.screening(c.ticket?.filmId)) {
        return Boolean(c.requiresIdentityCheck); // Only special scripted credentials, never the film rating.
      },
      identityQuestionsRelevant(c) {
        const alternatives = (c.intent?.genres ? this.allScreenings().filter(f => c.intent.genres.includes(f.genre) && f.status !== 'CANCELLED') : []);
        return Boolean(this.policies().checkAgeRestrictions) || this.needsIdFor(c) || Boolean(c.requiresAgeCheck) ||
          alternatives.some(f => this.needsIdFor(c, f)) ||
          (c.intent?.ids || []).some(id => this.needsIdFor(c, this.screening(id)));
      },
      getCustomerQuestions(c) {
        if (!c) return [];
        const pol = this.policies();
        const defaults = Object.entries(this.languagePack()?.procedural?.questionLabels || FIRST_WEEK_ELEMENTARY.procedural.questionLabels).filter(([key]) => key !== 'ask_name');
        const levelQuestions = this.languagePack()?.playerQuestions;
        const base = Array.isArray(levelQuestions)
          ? levelQuestions : (Array.isArray(this.campaign()?.playerQuestions) ? this.campaign().playerQuestions : defaults);
        // Available throughout age-restricted shifts; only the player decides whether to ask.
        const qs = base.filter(([key]) => key === 'ask_age' ? this.identityQuestionsRelevant(c) && (pol.checkAgeRestrictions || c.requiresAgeCheck)
          : key === 'ask_id' ? this.identityQuestionsRelevant(c) : true).map(q => [q[0], q[1]]);
        const addAll = (list) => {
          for (const q of (Array.isArray(list) ? list : [])) {
            if (!Array.isArray(q) && q?.condition && !this.matchesStoryCondition(q.condition)) continue;
            const key = Array.isArray(q) ? q[0] : q?.key;
            const label = Array.isArray(q) ? q[1] : q?.label;
            if (key && label && !qs.some(existing => existing[0] === key)) qs.push([key, label]);
          }
        };
        addAll(c.extraQuestions);
        addAll(c.unlockedQuestions);
        if (this.identityQuestionsRelevant(c)) {
          addAll([['ask_id', (this.languagePack()?.procedural?.questionLabels || FIRST_WEEK_ELEMENTARY.procedural.questionLabels).ask_id]]);
          if (this.policies().checkAgeRestrictions || c.requiresAgeCheck) addAll([['ask_age', (this.languagePack()?.procedural?.questionLabels || FIRST_WEEK_ELEMENTARY.procedural.questionLabels).ask_age]]);
        }
        if (!this.getKnownCustomerName(c)) addAll([['ask_name', (this.languagePack()?.procedural?.questionLabels || FIRST_WEEK_ELEMENTARY.procedural.questionLabels).ask_name]]);
        return qs;
      },
      matchesStoryCondition(cond) {
        if (!cond) return true;
        if (cond.anyOf) return cond.anyOf.some(part => this.matchesStoryCondition(part));
        const reqs = Array.isArray(cond) ? cond : [cond];
        for (const r of reqs) {
          const actual = this.state.story[r.key];
          if (r.value !== undefined && actual !== r.value) return false;
          if (Array.isArray(r.in) && !r.in.includes(actual)) return false;
          if (Array.isArray(r.notIn) && r.notIn.includes(actual)) return false;
          if (r.min !== undefined && (Number(actual) || 0) < r.min) return false;
          if (r.max !== undefined && (Number(actual) || 0) > r.max) return false;
        }
        return true;
      },
      arrival(c) { return c.arrivalTime ?? this.state.clockMins; },
      booking(c) { return this.state.bookings[c.ticket?.serial]; },
      freeSeats(f) {
        return f.capacity - Object.values(this.state.bookings).filter(b => b.screeningId === f.id && b.status !== 'cancelled').reduce((n,b) => n+b.seats,0);
      },
      syncSeats() { this.allScreenings().forEach(f => { f.unallocatedSeats = this.freeSeats(f); }); },
      canEnter(f, c, { ignoreIdentity = false } = {}) {
        if (!f || f.status === 'CANCELLED') return false;
        const pol = this.policies();
        if (pol.lateToleranceMins !== null && pol.lateToleranceMins !== undefined && this.arrival(c) > f.timeMins + pol.lateToleranceMins) {
          return false;
        }
        if (Array.isArray(pol.conditionalScreenRules)) {
          for (const rule of pol.conditionalScreenRules) {
            if (String(f.screen) === String(rule.screen) && this.arrival(c) > rule.afterMins && !c.person?.[rule.requiredPersonProp]) {
              return false;
            }
          }
        }
        if ((f.minAge || 0) > 0 && Number.isFinite(c.trueAge) && c.trueAge < f.minAge) return false;
        if (!ignoreIdentity && (f.minAge || 0) > 0 && c.idCard?.exists && c.idCard.presented) {
          if (c.person?.obviousDisguise) return false;
          if (!this.isValidCalendarDate(c.idCard.dob)) return false;
          if (c.idCard.issueDate && !this.isValidCalendarDate(c.idCard.issueDate)) return false;
          if (c.idCard.expiryDate && !this.isValidCalendarDate(c.idCard.expiryDate)) return false;
          if (c.idCard.issueDate && c.idCard.expiryDate && this.compareDates(c.idCard.issueDate, c.idCard.expiryDate) > 0) return false;
          if (c.idCard.issueDate && this.compareDates(c.idCard.issueDate, this.currentDateISO()) > 0) return false;
          if (c.idCard.issueDate && this.compareDates(c.idCard.dob, c.idCard.issueDate) > 0) return false;
          if (c.idCard.expiryDate && this.compareDates(c.idCard.expiryDate, this.currentDateISO()) < 0) return false;
          if (c.idCard.photoMismatch || c.idCard.photoAltered) return false;
          if (c.ticket?.holderName && c.idCard.holderName && c.ticket.holderName !== c.idCard.holderName) return false;
          if (c.introducedName && c.idCard.holderName && c.idCard.holderName !== c.introducedName && !c.identityTitle) return false;
          const age = this.calculateAge(c.idCard.dob, pol.currentDate);
          if (age === null || age < (f.minAge || 0)) return false;
          // A spoken age can be untruthful; eligibility is based on real age,
          // not whether the customer gave an accurate answer to an optional question.
        }
        return true;
      },
      accepts(c, f, requirements = c.known.preference) {
        if (!requirements) return false;
        return (!requirements.ids || requirements.ids.includes(f.id)) && (!requirements.genres || requirements.genres.includes(f.genre))
          && (!requirements.notGenres || !requirements.notGenres.includes(f.genre)) && (!requirements.latest || f.timeMins <= requirements.latest);
      },
      correctionOptions(c, { ignoreIdentity = false } = {}) {
        const t = c.ticket, b = this.booking(c), pol = this.policies();
        if (!pol.allowCorrections || !t?.exists || t.date !== this.today() || this.state.usedSerials.includes(t.serial)
          || !b || b.status !== 'reserved' || (!pol.allowPromoChanges && t.ticketType.includes('PROMO')) || t.ticketType.includes('VIP') || t.ticketType === 'STAFF PASS' || !c.known.preference) return [];
        return this.allScreenings().filter(f => this.canEnter(f,c,{ ignoreIdentity }) && this.accepts(c,f)
          && this.freeSeats(f)+(b.screeningId===f.id ? b.seats:0) >= c.groupSize);
      },
      evaluateCustomerCase(c) {
        const t = c.ticket, f = this.screening(t?.filmId), b = this.booking(c), pol = this.policies(), issues = [];
        const add=(code,text,hard=false)=>issues.push({code,text,hard});
        if(!t?.exists) add('missing','No ticket.',true);
        else {
          if(t.date!==this.today()) add('date',`Ticket: ${t.date}. Today: ${this.today()}.`,true);
          if(this.state.usedSerials.includes(t.serial)) add('duplicate','This ticket number is already used.',true);
          if(t.ticketType.includes('VIP') && (!pol.allowVipPasses || !this.state.authorizedVips.includes(t.serial))) add('vip','This VIP number is not on the list.',true);
          if(t.ticketType==='STAFF PASS' && (!pol.allowStaffPasses || !(this.state.authorizedStaff || this.state.authorizedVips || []).includes(t.serial))) add('staff','This staff pass number is not on the authorised list.',true);
          if(!['STANDARD','PROMO (NO CHANGE)','MANAGER VIP PASS','TV LOUNGE PASS','REPLACEMENT PRINTED','STAFF PASS'].includes(t.ticketType)) add('authenticity','This ticket type is not valid.',true);
          if(!b || b.status!=='reserved') add('booking','There is no unused booking for this ticket.',true);
          if(!f) add('film','This film is not on the programme.',true);
          if(f) {
            if((f.screen==='TV Lounge'&&!t.ticketType.includes('LOUNGE')&&!t.ticketType.includes('VIP')) || (f.screen!=='TV Lounge'&&t.ticketType.includes('LOUNGE'))) add('pass','The ticket type does not match this room.');
            if(f.status==='CANCELLED') add('cancelled','This film is cancelled.');
            if(t.filmTitle!==f.title) add('title','The film name does not match the booking.');
            if(String(t.screen)!==String(f.screen)) add('screen',`Ticket room: ${t.screen}. Programme room: ${f.screen}.`);
            if(this.parseTime(t.time)!==f.timeMins) add('time',`Ticket time: ${t.time}. Programme time: ${f.time}.`);
            if(pol.lateToleranceMins !== null && pol.lateToleranceMins !== undefined && this.arrival(c) > f.timeMins + pol.lateToleranceMins) {
              add('late',`Arrival ${this.formatMins(this.arrival(c))}: more than ${pol.lateToleranceMins} minutes late.`);
            }
            for (const rule of (pol.conditionalScreenRules || [])) {
              if (String(f.screen) === String(rule.screen) && this.arrival(c) > rule.afterMins && !c.person?.[rule.requiredPersonProp]) {
                add(rule.id || 'conditional', rule.issueText || `Screen ${rule.screen} conditional rule not met.`);
              }
            }
            if (pol.checkAgeRestrictions || c.requiresIdentityCheck) {
              if (c.person?.obviousDisguise) {
                add('disguise', c.person.disguiseIssueText || 'Customer is wearing an obvious disguise.', true);
              }
              // The ID is evidence only after the player requests it.
              if (c.idCard?.exists && c.idCard.presented && ((f.minAge || 0) > 0 || c.requiresIdentityCheck)) {
                if (!this.isValidCalendarDate(c.idCard.dob)) {
                  add('id_forged', `The birth date on the ID card (${this.formatDateDMY(c.idCard.dob)}) is not a real calendar date.`, true);
                } else {
                  const idAge = this.calculateAge(c.idCard.dob, pol.currentDate);
                  if (c.idCard.issueDate && !this.isValidCalendarDate(c.idCard.issueDate)) {
                    add('id_forged', `The ID card issue date (${this.formatDateDMY(c.idCard.issueDate)}) is invalid.`, true);
                  } else if (c.idCard.expiryDate && !this.isValidCalendarDate(c.idCard.expiryDate)) {
                    add('id_forged', `The ID card expiry date (${this.formatDateDMY(c.idCard.expiryDate)}) is invalid.`, true);
                  } else if (c.idCard.issueDate && c.idCard.expiryDate && this.compareDates(c.idCard.issueDate, c.idCard.expiryDate) > 0) {
                    add('id_forged', `The ID card issue date (${this.formatDateDMY(c.idCard.issueDate)}) is after its expiry date (${this.formatDateDMY(c.idCard.expiryDate)}).`, true);
                  } else if (c.idCard.issueDate && this.compareDates(c.idCard.issueDate, this.currentDateISO()) > 0) {
                    add('id_forged', `The ID card issue date (${this.formatDateDMY(c.idCard.issueDate)}) is in the future.`, true);
                  } else if (c.idCard.issueDate && this.compareDates(c.idCard.dob, c.idCard.issueDate) > 0) {
                    add('id_forged', 'The ID was issued before the date of birth.', true);
                  } else if (c.idCard.expiryDate && this.compareDates(c.idCard.expiryDate, this.currentDateISO()) < 0) {
                    add('id_expired', `The ID card expired on ${this.formatDateDMY(c.idCard.expiryDate)}.`, true);
                  }
                  // An incorrect spoken age is a clue for the player, not an
                  // automatic refusal when the actual age meets the rating.
                  if (c.idCard.photoMismatch || c.idCard.photoAltered) {
                    add('id_forged', c.idCard.photoMismatchText || 'The ID card photograph does not match the customer.', true);
                  }
                  if (t.holderName && c.idCard.holderName && t.holderName !== c.idCard.holderName) {
                    add('id_name', `Ticket name (${t.holderName}) does not match ID card (${c.idCard.holderName}).`, true);
                  } else if (c.idCard.holderName && c.introducedName && !c.identityTitle && c.idCard.holderName !== c.introducedName) {
                    add('id_name', `ID card name (${c.idCard.holderName}) does not match the name given (${c.introducedName}).`, true);
                  }
                  if ((f.minAge || 0) > 0 && idAge !== null && idAge < f.minAge) {
                    add('underage', `Customer is ${idAge} years old (DOB ${this.formatDateDMY(c.idCard.dob)}). ${f.title} requires minimum age ${f.minAge} (rated ${f.ageRating || f.minAge}).`, !c.allowAgeCorrection);
                  }
                }
              }
              if ((f.minAge || 0) > 0 && Number.isFinite(c.trueAge) && c.trueAge < f.minAge
                  && !issues.some(i => i.code === 'underage')) {
                // Refusing/missing ID is never itself grounds for refusal.
                // The real age determines eligibility. Keep it hidden until
                // the player finishes this decision.
                add('underage', 'The customer is below the minimum age for this screening.', !c.allowAgeCorrection);
              }
            }
            if(b && (b.screeningId!==f.id || b.seats!==t.seats || t.seats<c.groupSize)) add('seats',`Booking: ${b.seats} seat(s). People: ${c.groupSize}.`);
            if(b && this.freeSeats(f)<0) add('capacity','There are not enough seats.',true);
            if(c.known.preference && !this.accepts(c,f)) add('preference','The ticket does not match the customer’s plan.');
          }
        }
        const hard=issues.some(i=>i.hard);
        const options=hard ? [] : this.correctionOptions(c);
        // Never block a decision merely because the player did not request ID.
        // Rule violations are scored from actual case facts; investigation is a player choice.
        const needsIdentification = false;
        const needsQuestion = !!(c.requiredTicketQuestion && !t?.exists) ||
          (!hard && !!c.requiredQuestion && !c.known.preference);
        let validActions = [];
        if (needsQuestion) validActions = ['QUESTION'];
        else if (!issues.length) validActions = ['ADMIT'];
        else validActions = options.length ? ['CORRECT'] : ['REFUSE'];
        if (c.dilemma && !needsQuestion && issues.length && !hard && !validActions.includes('REFUSE')) validActions.push('REFUSE');
        const discretionary = Boolean(c.dilemma && !hard && issues.length === 1 &&
          (!c.discretionaryIssueCode || issues[0].code === c.discretionaryIssueCode));
        return {validActions,issues,options,needsQuestion,needsIdentification,discretionary,reason:issues.map(i=>i.text).join(' ') || 'The booking and ticket match.'};
      },
      parseTime(t) { if(!/^\d{2}:\d{2}$/.test(t||'')) return NaN; const [h,m]=t.split(':').map(Number); return h<24 && m<60 ? h*60+m:NaN; },
      pick(list) { return list.length ? list[Math.floor(this.rng()*list.length)] : null; },
      makeUniqueSerial() { const prefix = this.campaign()?.serialPrefix || 'GC'; return prefix+'-'+this.state.day+'-'+(++this.state.serialCounter); },
      prepareDaySchedule(day) {
        const camp = this.campaign();
        const dayCfg = this.dayConfig(day);
        const pol = dayCfg.policies || {};
        const pack = this.languagePack();
        this.state.bookings={}; this.state.serialCounter=400;
        this.state.authorizedVips = [...(camp.authorizedVips || [])];
        this.state.authorizedStaff = [...(camp.authorizedStaff || [])];
        this.state.schedule=(pack.films||[]).map(f=>({...f, ...(dayCfg.capacityOverrides?.[f.id] ? { capacity: dayCfg.capacityOverrides[f.id] } : {}), status:'ON TIME',originalScreen:f.screen,unallocatedSeats:dayCfg.capacityOverrides?.[f.id] ?? f.capacity}));
        this.state.tvSchedule=pol.tvLoungeOpen && this.state.enableTVContent ? (pack.tvLoungeSchedule||[]).map(f=>({...f,status:'ON TIME',unallocatedSeats:f.capacity})):[];
        for (const ch of (dayCfg.scheduleChanges || [])) {
          if (ch.type === 'relocate') {
            const moved = this.screening(ch.screeningId);
            if (moved) {
              moved.screen = ch.toScreen;
              moved.status = ch.statusLabel || `MOVED TO SCR ${ch.toScreen}`;
            }
          } else if (ch.type === 'cancel') {
            const cancelled = this.screening(ch.screeningId);
            if (cancelled) {
              cancelled.status = ch.statusLabel || 'CANCELLED';
            }
          } else if (ch.type === 'add_extra') {
            const base = this.screening(ch.sourceScreeningId);
            if (base) {
              this.state.schedule.push({
                ...base,
                id: ch.newId,
                screen: ch.screen,
                time: ch.time,
                timeMins: ch.timeMins ?? this.parseTime(ch.time),
                status: ch.statusLabel || 'EXTRA SHOW'
              });
            }
          }
        }
        for (const boost of (dayCfg.storyScheduleBoosts || [])) {
          const cond = { key: boost.requireStoryKey, value: boost.requireStoryValue, in: boost.requireStoryIn };
          if (this.matchesStoryCondition(cond)) {
            const target = this.screening(boost.screeningId);
            if (target && Number.isInteger(boost.capacityDelta)) {
              target.capacity += boost.capacityDelta;
              target.unallocatedSeats += boost.capacityDelta;
              if (boost.statusLabel) target.status = boost.statusLabel;
            }
          }
        }
        this.state.schedule.sort((a,b)=>a.timeMins-b.timeMins);this.state.tvSchedule.sort((a,b)=>a.timeMins-b.timeMins);
        this.state.usedSerials=[...(pol.initialUsedSerials || [])];
        this.state.scriptedDone={}; this.state.encounterGroupsDone={}; this.state.noticesSeen={};
        this.state.scriptedEncountersState={};
        this.state.encounterArrivalTimes={};
        for (const enc of (dayCfg.scriptedEncounters || [])) {
          // Guaranteed visitors join during the shift, even if a busy clerk serves them later.
          if (enc.guaranteed) this.state.encounterArrivalTimes[enc.id] = Math.max(1065, enc.trigger?.minClockMins || 0, enc.advanceClockToMins || 0);
          if (this.state.resolvedEncounters?.[day]?.[enc.id]) {
            this.state.scriptedEncountersState[enc.id] = 'resolved';
            this.state.scriptedDone[enc.id] = true;
            if (enc.encounterGroup) this.state.encounterGroupsDone[enc.encounterGroup] = true;
          } else {
            this.state.scriptedEncountersState[enc.id] = 'scheduled';
          }
        }
        this.state.clockEndMins=Math.max(...this.allScreenings().map(f=>f.timeMins))+10;
        this.state.scheduleSnapshot=this.allScreenings().map(f=>[f.id,f.time,f.timeMins,f.screen,f.status]);
      },
      // Queue is a preview of the finite shift plan, never an infinite spawner.
      spawnCustomerToQueue() {
        const s = this.state;
        if (s.shiftQueuedCount >= s.shiftPlan.length) return false;
        const slot = s.shiftPlan[s.shiftQueuedCount++];
        let visitor = CHARACTERS.createRandomPerson(() => this.rng());
        if (slot.kind === 'ordinary') {
          const used = new Set(s.recentCustomerNames || []);
          const alternatives = CHARACTERS.firstNames.filter(name => !used.has(name));
          if (alternatives.length) visitor.name = this.pick(alternatives);
          s.recentCustomerNames.push(visitor.name);
        }
        const entry = {
          person: visitor,
          patience: 100,
          plan: {...slot},
          guaranteedEncounter: slot.kind === 'story',
          preventQueueWalkout: slot.kind === 'story'
        };
        if (slot.kind === 'story') {
          const encounter = this.resolveStorySlot(slot.group);
          const named = this.campaign().characters?.[encounter?.characterId];
          if (named) entry.person = {...named, characterId:encounter.characterId};
        }
        s.queue.push(entry);
        UI.renderQueue();
        return true;
      },
      nextGuaranteedEncounter() {
        const next = this.state.queue.find(e => e.plan?.kind === 'story');
        return next ? this.resolveStorySlot(next.plan.group) : null;
      },
      queueNextPlannedVisitors() {
        // Only one waiting visitor early in the week; queue congestion is not
        // a second timer competing with the countdown on the tutorial days.
        const desired = this.state.day <= 2 ? 1 : Math.min(3, this.state.difficulty === 'chaos' ? 3 : 2);
        while (this.state.queue.length < desired) if (!this.spawnCustomerToQueue()) break;
      },
      processNotices() {
        const s = this.state;
        for (const notice of this.dayConfig().midShiftNotices || []) {
          if (s.clockMins >= notice.atMins && !s.noticesSeen[notice.id]) {
            s.noticesSeen[notice.id] = true;
            const noticeBox=document.getElementById('midShiftNoticeBox');
            document.getElementById('midShiftNoticeText').textContent=notice.text;
            noticeBox.classList.remove('hidden');
            document.getElementById('rulesAlertDot').classList.remove('hidden');
            break;
          }
        }
      },
      generateCustomerScenario(forcedType=null, person=null, arrivalTime=null) {
        const s=this.state, camp=this.campaign(), dayCfg=this.dayConfig(), pol=this.policies();
        let now=arrivalTime ?? s.clockMins;
        const adultDobs=['1984-03-15','1991-07-22','1979-11-04','1996-01-29','2001-08-12','1988-05-19','2005-11-06','2007-03-25','2009-07-18','2010-02-10'];
        const shellPerson=person||CHARACTERS.createRandomPerson(()=>this.rng());
        const defaultDob=pol.checkAgeRestrictions ? (this.pick(adultDobs)||'1988-05-19') : '1988-05-19';
        const defaultAge=pol.checkAgeRestrictions ? this.calculateAge(defaultDob,pol.currentDate) : 25;
        const shell={
          person:shellPerson,
          arrivalTime:now,
          ...(pol.checkAgeRestrictions ? {
            claimedAge:defaultAge,
            trueAge:defaultAge,
            idCard:this.normalizeIdCard({exists:true,presented:true,holderName:shellPerson.name,dob:defaultDob}, shellPerson.name, s.day)
          } : {})
        };
        const lateTol = pol.lateToleranceMins ?? 10;
        let open=this.allScreenings().filter(f=>this.canEnter(f,shell) && this.freeSeats(f)>=1);
        let late=this.allScreenings().filter(f=>f.status!=='CANCELLED' && now>f.timeMins+lateTol && this.freeSeats(f)>=1);
        const pickId=(id)=>open.find(f=>f.id===id);

        const findScriptedEncounter = () => {
          for (const enc of (dayCfg.scriptedEncounters || [])) {
            const st = s.scriptedEncountersState?.[enc.id];
            if (enc.guaranteed) continue; // Guaranteed encounters enter through the queue scheduler.
            if (enc.oncePerShift !== false && (s.scriptedDone[enc.id] || st === 'resolved' || st === 'presented')) continue;
            if (enc.encounterGroup) {
              const groupBusy = s.encounterGroupsDone?.[enc.encounterGroup]
                || (dayCfg.scriptedEncounters || []).some(other => other.encounterGroup === enc.encounterGroup && ['presented', 'resolved'].includes(s.scriptedEncountersState?.[other.id]));
              if (groupBusy) continue;
            }
            const tr = enc.trigger || {};
            const effNow = (enc.advanceClockToMins && now < enc.advanceClockToMins) ? enc.advanceClockToMins : now;
            if (tr.minClockMins !== undefined && effNow < tr.minClockMins) continue;
            if (tr.maxClockMins !== undefined && effNow > tr.maxClockMins) continue;
            if (tr.caseIndex !== undefined && s.casesGeneratedCount !== tr.caseIndex) continue;
            if (tr.minCaseIndex !== undefined && s.casesGeneratedCount < tr.minCaseIndex) continue;
            if (tr.requireOpenScreeningId && !this.screening(tr.requireOpenScreeningId)) continue;
            if (tr.requireLateScreeningId && !this.allScreenings().find(f => f.id === tr.requireLateScreeningId && f.status !== 'CANCELLED' && effNow > f.timeMins + lateTol)) continue;
            if (tr.requireOpenRoom && !open.some(f => f.screen === tr.requireOpenRoom)) continue;
            if (tr.requireStoryFlag && !s.story[tr.requireStoryFlag]) continue;
            if (tr.requireStoryValue && !this.matchesStoryCondition(tr.requireStoryValue)) continue;
            if (tr.requireUnusedSerial && s.usedSerials.includes(tr.requireUnusedSerial)) continue;
            return enc;
          }
          return null;
        };

        const proceduralTypes = new Set([
          'valid', 'subjective', 'wrong_film', 'screen', 'time', 'date', 'missing', 'hidden_ticket',
          'incomplete', 'cancelled', 'group', 'duplicate', 'promo', 'late', 'move', 'combined',
          'tv', 'tv_wrong', 'red', 'no_red',
          'age_valid', 'underage', 'missing_id', 'refused_id', 'fake_id', 'false_identity', 'disguise', 'staff_impostor', 'expired_id'
        ]);

        let type = forcedType;
        let scripted = null;
        if (!type) {
          scripted = findScriptedEncounter(); // Optional scripted cases remain supported; guaranteed encounters use shift slots.
          if (scripted) {
            type = scripted.caseType;
          } else if (this.rng() < 0.40) {
            type = this.pick(pol.checkAgeRestrictions ? ['valid', 'age_valid', 'age_valid', 'subjective'] : ['valid', 'valid', 'subjective']);
          } else {
            const basePool = dayCfg.casePool || ['wrong_film', 'screen', 'time', 'date', 'missing'];
            const types = [];
            for (const candidate of basePool) {
              if (candidate === 'late' && (!late.length || pol.lateToleranceMins === null)) continue;
              if (candidate === 'tv_wrong' && !open.some(f => f.screen === 'TV Lounge')) continue;
              if (candidate === 'cancelled' && !this.state.schedule.some(f => f.status === 'CANCELLED')) continue;
              if ((candidate === 'red' || candidate === 'no_red') && !(pol.conditionalScreenRules || []).some(r => now > r.afterMins && now <= r.afterMins + 15)) continue;
              if (['underage', 'missing_id', 'refused_id', 'fake_id', 'expired_id'].includes(candidate) && (!pol.checkAgeRestrictions || !open.some(f => (f.minAge || 0) >= 12))) continue;
              types.push(candidate);
            }
            type = this.pick(types) || 'screen';
          }
        } else {
          const dayById = (dayCfg.scriptedEncounters || []).filter(e => e.id === type);
          if (dayById.length) {
            scripted = dayById.find(e => !e.trigger?.requireStoryValue || this.matchesStoryCondition(e.trigger.requireStoryValue)) || dayById[0];
            type = scripted.caseType;
          } else if (!proceduralTypes.has(type)) {
            const dayMatches = (dayCfg.scriptedEncounters || []).filter(e =>
              e.caseType === type || e.characterId === type || e.characterId === 'mr_' + type || e.id.startsWith(type)
            );
            scripted = dayMatches.find(e => !e.trigger?.requireStoryValue || this.matchesStoryCondition(e.trigger.requireStoryValue))
              || dayMatches[0]
              || Object.values(camp.days || {}).flatMap(d => d.scriptedEncounters || []).find(e => e.id === type || e.caseType === type || e.characterId === type || e.characterId === 'mr_' + type)
              || null;
            if (scripted) type = scripted.caseType;
          }
        }

        if (scripted?.advanceClockToMins && s.clockMins < scripted.advanceClockToMins) {
          s.clockMins = scripted.advanceClockToMins;
          s.clockFormatted = this.formatMins(s.clockMins);
          now = arrivalTime ?? s.clockMins;
          shell.arrivalTime = now;
          UI.updateClockDisplay();
          open = this.allScreenings().filter(f => this.canEnter(f, shell) && this.freeSeats(f) >= 1);
          late = this.allScreenings().filter(f => f.status !== 'CANCELLED' && now > f.timeMins + lateTol && this.freeSeats(f) >= 1);
        }

        if (scripted?.targetScreeningId && type !== 'overbooked_group') {
          const targetScr = this.screening(scripted.targetScreeningId);
          const neededSeats = scripted.ticketSeats ?? scripted.groupSize ?? 1;
          if (targetScr && this.freeSeats(targetScr) < neededSeats) {
            const delta = neededSeats - this.freeSeats(targetScr);
            targetScr.capacity += delta;
            targetScr.unallocatedSeats = this.freeSeats(targetScr);
            open = this.allScreenings().filter(f => this.canEnter(f, shell) && this.freeSeats(f) >= 1);
            late = this.allScreenings().filter(f => f.status !== 'CANCELLED' && now > f.timeMins + lateTol && this.freeSeats(f) >= 1);
          }
        }

        const isLateScripted = Boolean(scripted?.trigger?.requireLateScreeningId || scripted?.dilemma);
        if (!open.length && type !== 'late' && !isLateScripted) {
          type = (late.length && pol.lateToleranceMins !== null) ? 'late' : 'missing';
          scripted = null;
        }

        let f = this.pick(open) || this.allScreenings()[0], desired = f;
        if (scripted && scripted.targetScreeningId && !scripted.wrongFilmTicket && !isLateScripted && type !== 'move' && type !== 'red' && type !== 'no_red') {
          f = desired = pickId(scripted.targetScreeningId) || this.screening(scripted.targetScreeningId) || f;
        }
        if (type === 'move') {
          const relocId = scripted?.targetScreeningId || (dayCfg.scheduleChanges || []).find(ch => ch.type === 'relocate')?.screeningId;
          f = desired = (relocId ? (pickId(relocId) || this.screening(relocId)) : null) || open.find(x => x.originalScreen !== undefined && x.originalScreen !== x.screen);
          if (!f) return this.generateCustomerScenario('screen', person);
        }
        if (type.startsWith('tv')) {
          f = desired = this.pick(open.filter(x => x.screen === 'TV Lounge'));
          if (!f) return this.generateCustomerScenario('valid', person);
        }
        if (type === 'late' || isLateScripted) {
          const targetLateId = scripted?.targetScreeningId || scripted?.trigger?.requireLateScreeningId;
          f = desired = targetLateId ? (late.find(x => x.id === targetLateId) || this.screening(targetLateId)) : this.pick(late);
          if (!f) return this.generateCustomerScenario('screen', person);
        }
        if (type === 'red' || type === 'no_red') {
          const condRule = (pol.conditionalScreenRules || [])[0];
          const extraShow = (dayCfg.scheduleChanges || []).find(ch => ch.type === 'add_extra');
          const redTargetId = scripted?.targetScreeningId || extraShow?.newId;
          f = desired = redTargetId ? this.screening(redTargetId) : this.state.schedule.find(x => String(x.screen) === String(condRule?.screen) && x.timeMins > (condRule?.afterMins ?? 0));
          const afterMins = condRule?.afterMins ?? 1150;
          if (!f || now <= afterMins || now > f.timeMins + lateTol || this.freeSeats(f) < 1) return this.generateCustomerScenario('screen', person);
          shell.person = CHARACTERS.createRandomPerson(() => this.rng(), type === 'red');
        }
        if (type === 'cancelled') {
          f = this.state.schedule.find(x => x.status === 'CANCELLED');
          desired = this.pick(open.filter(x => x.screen !== f?.screen));
          if (!f || f.status !== 'CANCELLED' || !desired || this.freeSeats(f) < 1) return this.generateCustomerScenario('screen', person);
        }
        if (['wrong_film', 'promo', 'incomplete', 'change'].includes(type) || scripted?.wrongFilmTicket) {
          desired = scripted?.targetScreeningId ? (pickId(scripted.targetScreeningId) || this.screening(scripted.targetScreeningId)) : this.pick(open);
          const other = this.pick(open.filter(x => x.genre !== desired?.genre));
          if (!desired || !other) return this.generateCustomerScenario('screen', person);
          f = other;
        }
        if (['age_valid', 'underage', 'missing_id', 'refused_id', 'fake_id', 'false_identity', 'disguise', 'expired_id'].includes(type) && !scripted) {
          const ageRestrictedOpen = open.filter(x => (x.minAge || 0) >= 12);
          if (!ageRestrictedOpen.length) return this.generateCustomerScenario('valid', person);
          f = desired = this.pick(ageRestrictedOpen);
        }
        if (type === 'group' && !scripted && this.freeSeats(f) < 3) return this.generateCustomerScenario('screen', person);

        const group = scripted?.groupSize ?? ((type === 'group' || type === 'overbooked_group') ? 3 : 1);
        const ticketSeats = scripted?.ticketSeats ?? (type === 'group' || type === 'overbooked_group' ? 1 : group);
        const statementChoices = (this.languagePack()?.procedural?.openings || FIRST_WEEK_ELEMENTARY.procedural.openings)
          .map(opening => ({ ...opening, text: opening.text.replace(/\{title\}/g, f.title) }));
        const chosenStatement = this.pick(statementChoices);

        const c = {
          ...shell,
          ...(shell.idCard ? { idCard: { ...shell.idCard, presented: false } } : {}),
          groupSize: group,
          caseType: type,
          patience: 100,
          known: { preference: { ids: [desired.id] }, publicPlan: Boolean(chosenStatement?.namesPlan) },
          intent: { ids: [desired.id] },
          dialogue: [],
          asked: [],
          discoveredEvidence: [],
          unlockedQuestions: [],
          questionedYet: false,
          requiredQuestion: false,
          statement: chosenStatement ? chosenStatement.text : this.say('defaultOpening', { title: f.title }),
          ticket: {
            exists: true,
            serial: this.makeUniqueSerial(),
            filmId: f.id,
            filmTitle: f.title,
            genreLabel: f.genreLabel,
            screen: f.screen,
            time: f.time,
            date: this.today(),
            seats: ticketSeats,
            ticketType: f.screen === 'TV Lounge' ? 'TV LOUNGE PASS' : 'STANDARD'
          }
        };

        if (['wrong_film', 'promo', 'change'].includes(type) || scripted?.wrongFilmTicket) {
          c.intent = c.known.preference = { genres: scripted?.intentGenres ? [...scripted.intentGenres] : [desired.genre] };
          c.statement = this.say('wrongFilm', { request: desired.genre === 'comedy' ? this.say('comedyRequest') : this.say('genreRequest', { genre: desired.genreLabel.toLowerCase() }) });
          c.known.publicPlan = true;
        }
        if (type === 'screen' || type === 'combined' || type === 'tv_wrong') c.ticket.screen = f.screen === 1 ? 2 : 1;
        if (type === 'time' || type === 'combined') c.ticket.time = '17:00';
        if (type === 'move') c.ticket.screen = f.originalScreen;
        if (type === 'date') c.ticket.date = 'LAST SUNDAY';
        if (type === 'missing' || type === 'hidden_ticket') {
          if (type === 'hidden_ticket') {
            c.backupTicket = { ...c.ticket };
            c.requiredTicketQuestion = true;
            c.statement = this.say('hiddenTicket');
          } else {
            c.statement = this.say('noTicket');
          }
          c.ticket = { exists: false, reason: this.say('noTicketOnDesk') };
          c.known.publicPlan = false;
        }
        if (type === 'incomplete') {
          c.known.preference = null;
          c.known.publicPlan = false;
          c.requiredQuestion = true;
          c.statement = this.say('incomplete');
        }
        if (type === 'cancelled') {
          c.intent = { genres: [desired.genre] };
          c.known.preference = null;
          c.known.publicPlan = false;
          c.requiredQuestion = true;
          c.statement = this.say('cancelled', { title: f.title });
        }
        if (type === 'group' || type === 'overbooked_group') { c.statement = this.say('group', { count: group === 3 ? this.say('three') : group, title: f.title }); c.known.publicPlan = true; }
        if (type === 'duplicate') c.ticket.serial = this.pick(s.usedSerials);
        if (type === 'promo') c.ticket.ticketType = 'PROMO (NO CHANGE)';
        if (type === 'late') { c.statement = this.say('late', { title: f.title }); c.known.publicPlan = true; }
        if (type === 'subjective') { c.statement = this.say('defaultOpening', { title: f.title }); c.known.publicPlan = true; }
        if (type === 'red' || type === 'no_red') {
          c.statement = this.say('redRule', { title: f.title, time: f.time });
          c.intent = c.known.preference = { ids: [f.id] };
          c.known.publicPlan = true;
        }

        if (!scripted) {
          if (type === 'age_valid') {
            const validDob = (f.minAge || 0) >= 16 ? '2007-06-15' : '2010-06-15';
            const validAge = this.calculateAge(validDob, pol.currentDate);
            c.claimedAge = validAge;
            c.trueAge = validAge;
            c.idCard = this.normalizeIdCard({ exists: true, presented: false, holderName: c.person.name, dob: validDob }, c.person.name, s.day);
            c.statement = this.say('defaultOpening', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'underage') {
            const underageDob = (f.minAge || 12) >= 16 ? '2012-06-15' : '2016-06-15';
            const uAge = this.calculateAge(underageDob, pol.currentDate);
            c.claimedAge = (f.minAge || 12) + 1;
            c.trueAge = uAge;
            c.allowAgeCorrection = false;
            c.idCard = this.normalizeIdCard({ exists: true, presented: false, holderName: c.person.name, dob: underageDob }, c.person.name, s.day);
            c.statement = this.say('defaultOpening', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'missing_id') {
            c.claimedAge = (f.minAge || 12) + 1;
            c.trueAge = (f.minAge || 12) - 2;
            c.allowAgeCorrection = false;
            c.idCard = { exists: false, presented: false, reason: this.say('missingIdReason') };
            c.statement = this.say('defaultOpening', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'refused_id') {
            // Declining ID should not reveal the answer: some visitors are
            // old enough and simply prefer not to show a document.
            const minimumAge = f.minAge || 16;
            c.trueAge = this.rng() < 0.6 ? Math.max(9, minimumAge - 2) : minimumAge + 2;
            c.claimedAge = minimumAge + 2;
            c.idCard.refusesToShow = true;
            c.idCard.refusalText = this.say('refusal');
            c.allowAgeCorrection = false;
          } else if (type === 'fake_id') {
            const fakeDob = '2012-08-20';
            const realAge = this.calculateAge(fakeDob, pol.currentDate);
            c.claimedAge = (f.minAge || 16) + 1;
            c.trueAge = realAge;
            c.allowAgeCorrection = false;
            c.idCard = this.normalizeIdCard({
              exists: true,
              presented: false,
              holderName: c.person.name,
              dob: fakeDob,
              issueDate: '20/10/2026',
              expiryDate: '10/10/2025'
            }, c.person.name, s.day);
            c.statement = this.say('defaultOpening', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'expired_id') {
            const validDob = '1998-04-12';
            const validAge = this.calculateAge(validDob, pol.currentDate);
            c.claimedAge = validAge;
            c.trueAge = validAge;
            c.allowAgeCorrection = false;
            c.idCard = this.normalizeIdCard({
              exists: true,
              presented: false,
              holderName: c.person.name,
              dob: validDob,
              issueDate: '01/05/2018',
              expiryDate: '01/05/2023'
            }, c.person.name, s.day);
            c.statement = this.say('defaultOpening', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'false_identity') {
            // Young customer borrowing an older person's ID; visible casting invites inspection.
            c.trueAge = Math.max(10, (f.minAge || 16) - 1);
            c.claimedAge = 20;
            c.ticket.holderName = c.person.name;
            c.allowAgeCorrection = false;
            c.idCard = this.normalizeIdCard({
              exists: true,
              presented: false,
              holderName: this.say('fakeAgeAdultName'),
              dob: '1982-11-03',
              photoMismatch: true,
              portraitPerson: { ...c.person, isElderly: true, hairColor: '#cbd5e1', glasses: !c.person.glasses, hat: false },
              photoMismatchText: this.say('photoMismatch')
            }, this.say('fakeAgeAdultName'), s.day);
            c.statement = this.say('defaultOpening', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'disguise') {
            c.person = { ...c.person, fakeBeard: true, obviousDisguise: true, disguiseIssueText: this.say('obviousDisguise') };
            c.claimedAge = 24;
            c.trueAge = 14;
            c.allowAgeCorrection = false;
            c.idCard = this.normalizeIdCard({
              exists: true,
              presented: false,
              holderName: c.person.name,
              dob: '2012-02-30'
            }, c.person.name, s.day);
            c.statement = this.say('adultDisguise', { title: f.title });
            c.known.publicPlan = true;
          } else if (type === 'staff_impostor') {
            c.person = { ...c.person, staffHat: true, staffBadge: true, obviousDisguise: true, disguiseIssueText: this.say('fakeStaffBadge') };
            c.ticket.ticketType = 'STAFF PASS';
            c.ticket.serial = 'STAFF-00-FAKE';
            c.claimedAge = 19;
            c.trueAge = 14;
            c.allowAgeCorrection = false;
            c.idCard = { exists: false, presented: false, reason: this.say('missingIdReason') };
            c.statement = this.say('staffImpostor', { title: f.title });
            c.known.publicPlan = true;
          }
        }

        if (scripted) {
          c.scriptedId = scripted.id;
          c.encounterGroup = scripted.encounterGroup || null;
          c.characterId = scripted.characterId || null;
          if (scripted.characterId && camp.characters?.[scripted.characterId]) {
            c.person = { ...camp.characters[scripted.characterId], characterId: scripted.characterId };
            if (scripted.personTagOverride) c.person.tag = scripted.personTagOverride;
          }
          if (scripted.personOverrides) {
            c.person = { ...c.person, ...scripted.personOverrides };
          }
          if (c.idCard && !scripted.idCard) {
            c.idCard = this.normalizeIdCard({ ...c.idCard, holderName: c.person.name, presented: false }, c.person.name, s.day);
          }
          if (scripted.ticketOverrides) {
            Object.assign(c.ticket, scripted.ticketOverrides);
          }
          if (scripted.idCard) {
            c.idCard = this.normalizeIdCard({ ...structuredClone(scripted.idCard), presented: false }, c.person.name, s.day);
          }
          if (scripted.claimedAge !== undefined) c.claimedAge = scripted.claimedAge;
          if (scripted.trueAge !== undefined) c.trueAge = scripted.trueAge;
          if (scripted.statedAgeInOpening !== undefined) c.statedAgeInOpening = Boolean(scripted.statedAgeInOpening);
          if (scripted.requiresAgeCheck !== undefined) c.requiresAgeCheck = Boolean(scripted.requiresAgeCheck);
          if (scripted.requiresIdentityCheck !== undefined) c.requiresIdentityCheck = Boolean(scripted.requiresIdentityCheck);
          if (scripted.identityTitle) c.identityTitle = true;
          c.preventQueueWalkout = scripted.preventQueueWalkout !== false;
          c.guaranteedEncounter = Boolean(scripted.guaranteed);
          if (scripted.revealsNameInOpening !== undefined) c.revealsNameInOpening = Boolean(scripted.revealsNameInOpening);
          if (scripted.concealIdentity) c.concealIdentity = true;
          if (scripted.introducedName !== undefined) c.introducedName = scripted.introducedName;
          if (scripted.allowAgeCorrection !== undefined) c.allowAgeCorrection = scripted.allowAgeCorrection;
          if (scripted.managerDirective) c.managerDirective = true;
          if (scripted.managerBonusCash !== undefined) c.managerBonusCash = scripted.managerBonusCash;
          if (scripted.managerComplyRepDelta !== undefined) c.managerComplyRepDelta = scripted.managerComplyRepDelta;
          if (scripted.managerRefuseRepDelta !== undefined) c.managerRefuseRepDelta = scripted.managerRefuseRepDelta;
          if (scripted.expectedAction) c.expectedAction = scripted.expectedAction;
          if (scripted.storyEffects) c.storyEffects = structuredClone(scripted.storyEffects);
          if (scripted.questionEffects) c.questionEffects = structuredClone(scripted.questionEffects);
          if (scripted.extraQuestions) c.extraQuestions = structuredClone(scripted.extraQuestions);
          if (scripted.customFeedback) c.customFeedback = structuredClone(scripted.customFeedback);
          if (scripted.storyKey) c.storyKey = scripted.storyKey;
          if (scripted.dilemma) c.dilemma = true;
          if (scripted.discretionaryIssueCode) c.discretionaryIssueCode = scripted.discretionaryIssueCode;
          if (scripted.requiredQuestion) {
            c.known.preference = null;
            c.known.publicPlan = false;
            c.requiredQuestion = true;
          }
          if (scripted.intentGenres) {
            c.intent = { genres: [...scripted.intentGenres] };
            if (!scripted.requiredQuestion) c.known.preference = { genres: [...scripted.intentGenres] };
          }
          if (scripted.vipSerial) {
            c.ticket.serial = scripted.vipSerial;
            c.ticket.ticketType = 'MANAGER VIP PASS';
          }
          const formatTpl = (tpl) => tpl
            .replace(/\{title\}/g, f.title)
            .replace(/\{time\}/g, f.time)
            .replace(/\{lateMins\}/g, String(now - f.timeMins));
          const packOverride = this.languagePack()?.dialogueOverrides?.[scripted.id];
          if (packOverride?.statementTemplate) {
            c.statement = formatTpl(packOverride.statementTemplate);
            if (!scripted.requiredQuestion) c.known.publicPlan = true;
          } else if (Array.isArray(scripted.statementByStory)) {
            const matchedBranch = scripted.statementByStory.find(b => !b.condition || this.matchesStoryCondition(b.condition));
            if (matchedBranch?.text) {
              c.statement = formatTpl(matchedBranch.text);
              if (matchedBranch.revealsName !== undefined) c.revealsNameInOpening = Boolean(matchedBranch.revealsName);
              if (matchedBranch.introducedName !== undefined) c.introducedName = matchedBranch.introducedName;
              if (!scripted.requiredQuestion) c.known.publicPlan = true;
            }
          } else if (scripted.statementByStory && typeof scripted.statementByStory === 'object') {
            const storyState = s.story[scripted.storyKey];
            const tpl = scripted.statementByStory[storyState] || scripted.statementByStory.default || scripted.statementTemplate
              || this.languagePack()?.procedural?.defaultOpening || FIRST_WEEK_ELEMENTARY.procedural.defaultOpening;
            c.statement = formatTpl(tpl);
            if (!scripted.requiredQuestion) c.known.publicPlan = true;
          } else if (scripted.statementTemplate) {
            c.statement = formatTpl(scripted.statementTemplate);
            if (!scripted.requiredQuestion) c.known.publicPlan = true;
          }
          const nonAdmitCases = ['move', 'underage', 'missing_id', 'refused_id', 'fake_id', 'false_identity', 'disguise', 'staff_impostor', 'expired_id', 'manager_pressure', 'overbooked_group', 'screen', 'wrong_film', 'duplicate', 'promo', 'cancelled', 'late', 'dilemma_late'];
          c.isScriptedAdmit = scripted.expectedAction
            ? scripted.expectedAction === 'ADMIT'
            : Boolean(!scripted.dilemma && !scripted.wrongFilmTicket && !nonAdmitCases.includes(type));
        }

        // Stage 2A: cast ordinary visitors only after case/age metadata is known.
        // No RNG is consumed; named campaign characters resolve by their stable IDs.
        CHARACTERS.assignPortrait(c.person, c.trueAge ?? null, s.recentPortraits);
        const portraitId = c.person.portraitId;
        if (portraitId) s.recentPortraits = [...s.recentPortraits.filter(id => id !== portraitId), portraitId].slice(-24);
        c.statementSummary = c.statement;
        const requiresPlanConfirmation = ['incomplete', 'wrong_film', 'promo', 'change'].includes(type) || Boolean(scripted?.wrongFilmTicket);
        const calcIdAge = (c.idCard?.exists && this.isValidCalendarDate(c.idCard.dob))
          ? this.calculateAge(c.idCard.dob, pol.currentDate)
          : null;
        const spokenAge = c.claimedAge ?? calcIdAge ?? 25;
        const formattedDob = c.idCard?.dob ? this.formatDateDMY(c.idCard.dob) : '';
        const qaTemplates = this.languagePack()?.procedural?.answers || FIRST_WEEK_ELEMENTARY.procedural.answers;
        const qa = (key, values = {}) => qaTemplates[key].replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) =>
          Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : `{${name}}`);
        const genreList = c.intent.genres?.join(this.say('joinGenres'));
        c.qaResponses = {
          which_film: c.intent.genres ? qa('whichGenre', { genres: genreList }) : qa('whichFilm', { title: desired.title }),
          why_see: qa('purpose', { purpose: desired.purposePhrases?.[0] || this.say('genericPurpose') }),
          are_you_sure: requiresPlanConfirmation
            ? (c.intent.genres ? qa('wrongFilmGenre', { genre: c.intent.genres[0] }) : qa('wrongFilmTitle', { title: desired.title }))
            : qa('confirmFilm', { title: f.title }),
          how_many: group === 1 ? qa('groupOne') : qa('groupMany', { count: group }),
          friends_coming: qa(group > 1 ? 'friendsYes' : 'friendsNo'),
          other_ticket: qa(type === 'hidden_ticket' ? 'foundTicket' : 'noOtherTicket'),
          alternative: c.intent.genres ? qa('alternativeGenre', { genres: genreList }) : qa('alternativeTitle', { title: desired.title }),
          ask_age: qa('age', { age: spokenAge }),
          ask_name: qa('name', { name: c.introducedName || c.person.name }),
          ask_id: c.idCard?.exists ? qa('idShown', { dob: formattedDob }) : qa('noId')
        };
        if (scripted?.qaOverrides) {
          Object.assign(c.qaResponses, scripted.qaOverrides);
        }
        if (Array.isArray(scripted?.qaByStory)) {
          for (const branch of scripted.qaByStory) {
            if (!branch.condition || this.matchesStoryCondition(branch.condition)) {
              if (branch.responses) Object.assign(c.qaResponses, branch.responses);
              break;
            }
          }
        }
        const packQaOverride = scripted ? this.languagePack()?.dialogueOverrides?.[scripted.id]?.qaOverrides : null;
        if (packQaOverride) {
          Object.assign(c.qaResponses, packQaOverride);
        }
        if (type === 'cancelled') c.qaResponses.are_you_sure = c.qaResponses.alternative;
        if (c.idCard?.refusesToShow) c.qaResponses.ask_id = c.idCard.refusalText || this.say('refusal');

        const ticket = c.backupTicket || c.ticket;
        c.proposedBooking = ticket.exists && !['date', 'duplicate', 'missing'].includes(type)
          ? { serial: ticket.serial, screeningId: f.id, seats: ticket.seats, status: 'reserved' }
          : null;
        if (!this.validateGeneratedCase(c)) {
          if (scripted?.guaranteed) throw new Error(`Invalid guaranteed encounter configuration: ${scripted.id}`);
          return this.generateCustomerScenario('missing', person);
        }
        s.casesGeneratedCount++;
        return c;
      },
      validateGeneratedCase(c) {
        const t=c.backupTicket||c.ticket;
        if(t.exists && (!this.screening(t.filmId) || !Number.isInteger(t.seats) || t.seats<1)) return false;
        if(c.proposedBooking && !this.state.bookings[c.proposedBooking.serial] && this.freeSeats(this.screening(c.proposedBooking.screeningId))<c.proposedBooking.seats) return false;
        if(c.requiredQuestion && !c.qaResponses.which_film) return false;
        if(c.intent.ids && c.intent.ids.some(id=>!this.screening(id))) return false;
        if(!(c.groupSize>0 && c.statement && c.person))return false;
        const draft=Object.create(this);draft.state={...this.state,bookings:{...this.state.bookings}};
        if(c.proposedBooking)draft.state.bookings[c.proposedBooking.serial]={...c.proposedBooking};
        const test=structuredClone(c);
        test.idRequested = true;
        test.idRefused = Boolean(test.idCard?.refusesToShow);
        if (test.idCard?.exists && !test.idCard.refusesToShow) test.idCard.presented = true;
        if(test.backupTicket){test.ticket=test.backupTicket;test.requiredTicketQuestion=false;}
        if(test.requiredQuestion)test.known.preference=structuredClone(test.intent);
        const ev=draft.evaluateCustomerCase(test);
        if(!ev.validActions.length||ev.needsQuestion)return false;
        if (c.expectedAction) {
          if (!ev.validActions.includes(c.expectedAction)) return false;
        } else if ((['valid','age_valid','subjective','red','vip','tv'].includes(c.caseType) || c.isScriptedAdmit) && !ev.validActions.includes('ADMIT')) {
          return false;
        }
        const expected={
          screen:'screen',time:'time',date:'date',duplicate:'duplicate',late:'late',no_red:'red',
          group:'seats',overbooked_group:'seats',promo:'preference',wrong_film:'preference',
          incomplete:'preference',cancelled:'cancelled',combined:'screen',move:'screen',tv_wrong:'screen',
          underage:'underage',missing_id:'underage',refused_id:(Number.isFinite(c.trueAge) && c.trueAge < (this.screening(c.ticket?.filmId)?.minAge || 0) ? 'underage' : null),fake_id:'id_forged',expired_id:'id_expired',false_identity:'id_name',
          disguise:'disguise',staff_impostor:'staff',manager_pressure:'vip'
        }[c.caseType];
        if(expected&&!ev.issues.some(i=>i.code===expected))return false;
        return true;
      },
      finalizeCustomerAtWindow(c) {
        if(c.proposedBooking) {
          if(this.state.bookings[c.proposedBooking.serial]) throw new Error('Booking serial collision');
          this.state.bookings[c.proposedBooking.serial]={...c.proposedBooking};
        }
        if (c.scriptedId) {
          if (!this.state.scriptedEncountersState) this.state.scriptedEncountersState = {};
          this.state.scriptedEncountersState[c.scriptedId] = 'presented';
        }
        this.syncSeats();
      },
      resolveScriptedEncounter(c) {
        if (!c?.scriptedId) return;
        const s = this.state;
        if (!s.scriptedEncountersState) s.scriptedEncountersState = {};
        s.scriptedEncountersState[c.scriptedId] = 'resolved';
        s.scriptedDone[c.scriptedId] = true;
        s.story[`resolved_enc_${c.scriptedId}`] = 'yes';
        if (!s.resolvedEncounters[s.day]) s.resolvedEncounters[s.day] = {};
        s.resolvedEncounters[s.day][c.scriptedId] = true;
        if (c.encounterGroup) {
          if (!s.encounterGroupsDone) s.encounterGroupsDone = {};
          s.encounterGroupsDone[c.encounterGroup] = true;
        }
        const charId = c.person?.characterId || c.characterId;
        if (charId && !c.concealIdentity && (c.revealsNameInOpening || c.identityRevealed)) {
          s.story[`known_char_${charId}`] = 'yes';
        }
        if (charId && !c.concealIdentity && c.idCard?.presented && c.idCard.holderName === c.person.name) {
          s.story[`known_char_${charId}`] = 'yes';
        }
      },
      nextCustomerFromQueue() {
        const s=this.state;
        if (!s.shiftActive || s.paused || s.modalDepth) return;
        if (this.isShiftDismissed()) return this.endShift('SHIFT FAILED — MANAGEMENT DISMISSED YOU');
        if (s.currentCustomer && !s.decisionLocked) return;
        if (s.shiftExpired) {
          // Unserved procedural visitors go home. Story customers still get
          // their scene, but the countdown remains at zero.
          const removed = s.queue.filter(e => e.plan?.kind !== 'story').length;
          s.queue = s.queue.filter(e => e.plan?.kind === 'story');
          const remaining = s.shiftPlan.slice(s.shiftQueuedCount).filter(e => e.kind !== 'story').length;
          s.shiftStats.customersLost += removed + remaining;
          s.totalCustomersLost += removed + remaining;
          s.shiftQueuedCount = s.shiftPlan.length;
          for (const slot of s.shiftPlan) {
            if (slot.kind === 'story' && !s.queue.some(e => e.plan?.group === slot.group) &&
                !s.encounterGroupsDone?.[slot.group] && !s.scriptedDone[this.resolveStorySlot(slot.group)?.id]) {
              s.queue.push({person:{name:'Special visitor'},patience:100,plan:slot,guaranteedEncounter:true,preventQueueWalkout:true});
            }
          }
        }
        if (s.shiftStats.served + s.shiftStats.customersLost >= s.shiftTargetCustomers && !s.queue.length) {
          return this.endShift(s.shiftExpired ? 'TIME UP — CINEMA CLOSED' : 'SHIFT COMPLETE — CINEMA CLOSED');
        }
        this.applyPendingLanguageMode();
        s.decisionLocked=false;this.closeCorrectionDrawer();this.clearInspectSelection();
        if (UI.closeIdCardModal) UI.closeIdCardModal();
        document.getElementById('nextCustomerBtn').classList.add('hidden');
        document.getElementById('deskFeedbackBanner').classList.add('hidden');
        document.getElementById('stampAnimationOverlay').classList.add('hidden');
        this.queueNextPlannedVisitors();
        if (!s.queue.length) return this.endShift('SHIFT COMPLETE — CINEMA CLOSED');
        const visitor=s.queue.shift();
        const enc = visitor.plan?.kind === 'story' ? this.resolveStorySlot(visitor.plan.group) : null;
        // Fictional arrival time advances at customer boundaries, never while
        // reading the ticket. Late cases have their own fixed timestamps.
        const index = s.casesGeneratedCount;
        s.clockMins = Math.min(1270, Math.max(s.clockMins, 1065 + index * (s.shiftTargetCustomers > 9 ? 15 : 19)));
        s.clockFormatted = this.formatMins(s.clockMins);
        const forcedType = enc?.id || visitor.plan?.caseType || 'valid';
        const c = this.generateCustomerScenario(forcedType, visitor.person, enc ? this.state.encounterArrivalTimes?.[enc.id] : null);
        this.finalizeCustomerAtWindow(c);s.currentCustomer=c;
        this.queueNextPlannedVisitors();
        UI.renderQueue();UI.renderCustomer(c);UI.renderTicketOnDesk(c);UI.renderScheduleBinder();UI.renderHeader();UI.setDecisionButtons(false);
        this.processNotices();
        this.saveProgress();
      },

      askCustomerQuestion(key, label) {
        const c=this.state.currentCustomer;
        if(!c || this.state.decisionLocked || this.state.paused || this.state.modalDepth) return;
        const question = this.getCustomerQuestions(c).find(q => q[0] === key);
        if (!question) return;
        label = question[1];
        SoundFX.click();c.questionedYet=true;
        if (!Array.isArray(c.discoveredEvidence)) c.discoveredEvidence = [];
        if(['which_film','are_you_sure','alternative'].includes(key)) {c.known.preference=structuredClone(c.intent);c.known.publicPlan=true;}
        if(key==='other_ticket' && c.backupTicket) {c.ticket=c.backupTicket;delete c.backupTicket;c.requiredTicketQuestion=false;UI.renderTicketOnDesk(c);}
        const effect = c.questionEffects?.[key];
        const qEff = effect && (!effect.condition || this.matchesStoryCondition(effect.condition)) ? effect : null;
        if(key==='ask_id' || qEff?.revealDocument === 'id') {
          c.idRequested=true;
          c.idRefused = Boolean(c.idCard?.refusesToShow);
          if(c.idCard?.exists && !c.idRefused) {
            c.idCard.presented=true;
            if (!c.discoveredEvidence.includes('id_presented')) c.discoveredEvidence.push('id_presented');
          } else {
            const evidence = c.idRefused ? 'id_refused' : 'id_missing';
            if (!c.discoveredEvidence.includes(evidence)) c.discoveredEvidence.push(evidence);
          }
          UI.renderTicketOnDesk(c);
        }
        if (key === 'ask_name') {
          c.introducedName = c.introducedName || c.person.name;
          c.identityRevealed = true;
        }
        if(key==='ask_age') {
          c.ageRequested=true;
          const calcAge = (c.idCard?.exists && this.isValidCalendarDate(c.idCard.dob))
            ? this.calculateAge(c.idCard.dob, this.currentDateISO())
            : null;
          c.revealedClaimedAge = c.claimedAge ?? calcAge ?? 25;
          if (!c.discoveredEvidence.includes('age_claimed')) c.discoveredEvidence.push('age_claimed');
        }
        if ((c.ageRequested || c.statedAgeInOpening) && c.idCard?.presented && c.idCard?.exists) {
          const actualAge = this.isValidCalendarDate(c.idCard.dob) ? this.calculateAge(c.idCard.dob, this.currentDateISO()) : null;
          // An impossible birth date contradicts any stated age.
          if (c.claimedAge !== undefined && c.claimedAge !== null && c.claimedAge !== actualAge) {
            if (!c.discoveredEvidence.includes('age_id_contradiction')) {
              c.discoveredEvidence.push('age_id_contradiction');
            }
          }
        }
        if (qEff && !c.asked.includes(key)) {
          if (qEff.revealPreference) {
            c.known.preference = structuredClone(c.intent);
            c.known.publicPlan = true;
          }
          if (qEff.setStory) {
            for (const [sk, sv] of Object.entries(qEff.setStory)) {
              this.state.story[sk] = sv;
            }
          }
          if (qEff.incrementStory) {
            for (const [sk, delta] of Object.entries(qEff.incrementStory)) {
              this.state.story[sk] = Number(this.state.story[sk] || 0) + Number(delta);
            }
          }
          if (qEff.evidence) {
            const evList = Array.isArray(qEff.evidence) ? qEff.evidence : [qEff.evidence];
            for (const evItem of evList) {
              if (!c.discoveredEvidence.includes(evItem)) c.discoveredEvidence.push(evItem);
            }
          }
          if (qEff.revealIdentity) {
            c.identityRevealed = true;
            if (typeof qEff.revealIdentity === 'string') c.introducedName = qEff.revealIdentity;
          }
          if (Array.isArray(qEff.unlockQuestions)) {
            if (!Array.isArray(c.unlockedQuestions)) c.unlockedQuestions = [];
            for (const uq of qEff.unlockQuestions) {
              const uKey = Array.isArray(uq) ? uq[0] : uq?.key;
              if (uKey && !c.unlockedQuestions.some(existing => (Array.isArray(existing) ? existing[0] : existing?.key) === uKey)) {
                c.unlockedQuestions.push(uq);
              }
            }
          }
        }
        if(!c.asked.includes(key)) c.asked.push(key);
        const reply=qEff?.revealStatement || c.qaResponses[key]||((this.languagePack()?.procedural?.answers || FIRST_WEEK_ELEMENTARY.procedural.answers).fallback);
        c.dialogue.push({question:label,reply});
        this.applyEvidenceEffects(c);
        const box=document.getElementById('customerFollowUpBox');
        box.replaceChildren();
        c.dialogue.slice(-3).forEach(turn=>{const p=document.createElement('p');p.textContent=`${turn.question} — ${turn.reply}`;box.append(p);});
        box.classList.remove('hidden'); UI.renderCustomer(c); UI.updateCustomerSummary();
        const questionButton = [...document.getElementById('questionButtonsGrid').children].find(button => button.getAttribute?.('data-question') === key);
        questionButton?.focus?.();
        this.saveProgress();
      },

      applyEvidenceEffects(c) {
        for (const [evidence, effects] of Object.entries(c.storyEffects?.onEvidence || {})) {
          if (c.discoveredEvidence?.includes(evidence)) Object.assign(this.state.story, effects);
        }
      },

      openCorrectionDrawer() {
        if(!this.state.currentCustomer || this.state.decisionLocked || this.state.paused || this.state.modalDepth) return;
        const c=this.state.currentCustomer, pol=this.policies();
        if(!pol.allowCorrections) return UI.showDeskFeedback('warn', pol.printerClosedMessage || this.campaign()?.printerClosedMessage || 'The ticket printer is closed today.');
        if(!c.ticket.exists) return UI.showDeskFeedback('warn','You need a ticket to use the printer.');
        if((!pol.allowPromoChanges && c.ticket.ticketType.includes('PROMO')) || c.ticket.ticketType.includes('VIP') || c.ticket.ticketType === 'STAFF PASS') return UI.showDeskFeedback('warn','This pass cannot be changed.');
        if(!c.known.preference) return UI.showDeskFeedback('warn','Ask which film the customer wants first.');
        const select=document.getElementById('correctionScreeningSelect');select.replaceChildren();
        const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Choose a screening…';select.append(placeholder);
        this.allScreenings().forEach(f=>{
          const opt=document.createElement('option');opt.value=f.id;
          const b=this.booking(c), available=this.freeSeats(f)+(b?.screeningId===f.id?b.seats:0);
          const ratingTag = f.ageRating ? ` [${f.ageRating}]` : '';
          opt.textContent=`${f.title}${ratingTag} · ${f.genreLabel} · ${f.screen==='TV Lounge'?'TV Lounge':'Screen '+f.screen} · ${f.time} · ${available} seats${f.status==='CANCELLED'?' · CANCELLED':''}`;
          const isLate = pol.lateToleranceMins !== null && pol.lateToleranceMins !== undefined && this.arrival(c) > f.timeMins + pol.lateToleranceMins;
          const canEnterScreening = this.canEnter(f, c);
          opt.disabled=f.status==='CANCELLED'||available<c.groupSize||isLate||!canEnterScreening;
          select.append(opt);
        });
        // Printer only uses information already spoken, never hidden intent.
        if(this.state.ownedUpgrades.includes('printer')) select.value=this.correctionOptions(c)[0]?.id||'';
        document.getElementById('correctionPrinterDrawer').classList.remove('hidden');this.updateCorrectionPreview();
      },

      closeCorrectionDrawer() {
        document.getElementById('correctionPrinterDrawer').classList.add('hidden');
      },

      updateCorrectionPreview() {
        const f=this.screening(document.getElementById('correctionScreeningSelect').value),c=this.state.currentCustomer;
        document.getElementById('printCorrectedTicketBtn').disabled=!f;
        document.getElementById('correctionPreviewScreen').textContent=f?(f.screen==='TV Lounge'?'TV Lounge':'Screen '+f.screen):'—';
        document.getElementById('correctionPreviewTimeSeats').textContent=f?`${f.time} · ${c.groupSize} people`:'—';
        document.getElementById('correctionPolicyNote').textContent='Check the customer’s plan and the rules before printing.';
      },

      confirmPrintAndCorrect() {
        const f=this.screening(document.getElementById('correctionScreeningSelect').value);if(f) this.makeDecision('CORRECT',f);
      },

      makeDecision(action, target=null) {
        const s=this.state,c=s.currentCustomer,camp=this.campaign(),dm=this.languagePack()?.dilemmaMessage||camp.dilemmaMessage||{};
        if(!c || !s.shiftActive || s.paused || s.modalDepth || s.decisionLocked) return;
        const notesStart = s.shiftStats.dilemmaNotes.length;
        const before=structuredClone(c.ticket),result=this.applyDecision(c,action,target?.id),ev=result.evaluation;
        if(result.blocked) {UI.showDeskFeedback('warn',c.requiredTicketQuestion?'Ask if there is another ticket.':ev.needsIdentification?'Request identification before checking this admission.':'Ask the customer about their plan first.');return;}
        s.decisionLocked=true;this.closeCorrectionDrawer();
        if (typeof UI !== 'undefined' && UI.closeIdCardModal) UI.closeIdCardModal();
        s.shiftStats.served++;
        this.resolveScriptedEncounter(c);
        let message;
        if(result.accepted && result.compliant) {
          s.shiftStats.correct++;
          if (result.managerComplied) {
            const earn = 10 + (c.managerBonusCash || 0);
            s.money += earn; s.shiftStats.cashEarned += earn;
            this.adjustReputation(c.managerComplyRepDelta ?? -2);
            s.story.manager_compliance = Number(s.story.manager_compliance || 0) + 1;
            s.story.inspection_violations = Number(s.story.inspection_violations || 0) + 1;
            message = c.customFeedback?.ADMIT || `✓ ADMIT (Manager Directive). +€${earn}. You followed the manager's order despite the official rulebook.`;
            SoundFX.cash();
          } else if (result.managerChallenged) {
            const earn = 8;
            s.money += earn; s.shiftStats.cashEarned += earn;
            this.adjustReputation(c.managerRefuseRepDelta ?? 3);
            s.story.manager_conflict = Number(s.story.manager_conflict || 0) + 1;
            message = c.customFeedback?.REFUSE || `✓ REFUSE. +€${earn}. ${ev.reason}`;
            SoundFX.cash();
          } else {
            const earn=(action==='ADMIT'?10:action==='CORRECT'?12:8)+(action==='CORRECT'&&s.ownedUpgrades.includes('printer')?3:0);
            s.money+=earn;s.shiftStats.cashEarned+=earn;this.adjustReputation(s.ownedUpgrades.includes('handbook')?4:3);
            const customMsg = c.customFeedback?.[action];
            message = customMsg ? `✓ ${action}. +€${earn}. ${customMsg}` : `✓ ${action}. +€${earn}. ${ev.reason}`;
            SoundFX.cash();
          }
        } else if(result.exception) {
          s.shiftStats.exceptions = (s.shiftStats.exceptions || 0) + 1;
          s.story.total_exceptions = Number(s.story.total_exceptions || 0) + 1;
          s.money+=6;s.shiftStats.cashEarned+=6;this.adjustReputation(4);
          const warnRes = this.issueWarning('Discretionary admission');
          const baseExc = c.customFeedback?.ADMIT || dm.exceptionFeedback || `${c.person.name} is admitted as an exception. +€6.`;
          const warnNote = warnRes.issued
            ? `Discretionary admission — Management warning issued (${warnRes.warnings} / ${warnRes.maxWarnings}).`
            : `Discretionary admission — Warning forgiven by Manager's Handbook (${warnRes.warnings} / ${warnRes.maxWarnings}).`;
          message = `⚖️ ${warnNote} ${baseExc} (Cash +€6, Reputation +4)`;
          s.shiftStats.dilemmaNotes.push(c.storyEffects?.dilemmaNoteByAction?.ADMIT || dm.exceptionNote || `${c.person.name} was admitted as a discretionary exception.`);
        } else {
          s.shiftStats.mistakes++;
          s.story.total_mistakes = Number(s.story.total_mistakes || 0) + 1;
          if (action === 'ADMIT' && ev.issues.some(i => ['underage', 'missing_id', 'id_refused', 'id_forged', 'id_expired', 'age_mismatch', 'id_name', 'disguise', 'staff', 'vip', 'duplicate'].includes(i.code))) {
            s.story.inspection_violations = Number(s.story.inspection_violations || 0) + 1;
          }
          const penalty=s.difficulty==='chaos'?8:5;s.money=Math.max(0,s.money-penalty);this.adjustReputation(-7);
          const warnRes = this.issueWarning(this.getWarningActionLabel(action, false));
          const f=this.screening(c.ticket?.filmId);
          const age = Number.isFinite(c.trueAge) ? c.trueAge : null;
          let errDetail = action==='CORRECT'?'That replacement does not meet all the rules or the customer’s plan.':ev.reason;
          if (f && (f.minAge || 0) > 0 && age !== null) {
            const rating = `${f.minAge}+`;
            if (action === 'ADMIT' && age < f.minAge) {
              errDetail = `Underage customer admitted. The customer was actually ${age} years old; ${f.title} is rated ${rating}.`;
            } else if (action === 'REFUSE' && age >= f.minAge && ev.validActions.includes('ADMIT')) {
              errDetail = `Eligible customer refused. The customer was actually ${age} years old, old enough for ${f.title} (${rating}). Refusing or not having ID does not invalidate the ticket.`;
            }
          }
          message=`✕ Inspection mistake: ${errDetail} Use ${ev.validActions.join(' or ')}. ${warnRes.summaryText} (Cash −€${penalty}, Reputation −7)`;
          SoundFX.buzzer();
        }
        const outcome=result.exception?'kind':result.accepted&&action!=='REFUSE'?'helped':result.accepted?'refused':'mistake';
        if(c.storyKey) {
          s.story[c.storyKey]=outcome;
        }
        if (c.storyEffects) {
          const effMap = result.accepted ? (c.storyEffects.onAction?.[action] || {}) : { ...c.storyEffects.onMistake, ...c.storyEffects.onMistakeByAction?.[action] };
          for (const [k, v] of Object.entries(effMap)) {
            s.story[k] = v;
          }
          const incMap = result.accepted ? (c.storyEffects.incrementOnAction?.[action] || {}) : { ...c.storyEffects.incrementOnMistake, ...c.storyEffects.incrementOnMistakeByAction?.[action] };
          for (const [k, delta] of Object.entries(incMap)) {
            s.story[k] = Number(s.story[k] || 0) + Number(delta);
          }
          if (c.storyEffects.onEvidence && Array.isArray(c.discoveredEvidence)) {
            for (const [evKey, map] of Object.entries(c.storyEffects.onEvidence)) {
              if (c.discoveredEvidence.includes(evKey) && map && typeof map === 'object') {
                for (const [sk, sv] of Object.entries(map)) {
                  s.story[sk] = sv;
                }
              }
            }
          }
          if (c.questionedYet && c.storyEffects.onQuestioned && !c.questionEffects) {
            for (const [k, v] of Object.entries(c.storyEffects.onQuestioned)) {
              s.story[k] = v;
            }
          }
          if (result.accepted && c.storyEffects.repDeltaByAction?.[action]) {
            this.adjustReputation(Number(c.storyEffects.repDeltaByAction[action]));
          }
          const note = result.accepted ? c.storyEffects.dilemmaNoteByAction?.[action] : c.storyEffects.dilemmaNoteOnMistake;
          if (note && !result.exception) {
            s.shiftStats.dilemmaNotes.push(note);
          }
          for (const [evidence, note] of Object.entries(c.storyEffects.noteByEvidence || {})) {
            if (c.discoveredEvidence?.includes(evidence)) s.shiftStats.dilemmaNotes.push(note);
          }
        }
        if(c.dilemma && !c.storyEffects?.dilemmaNoteByAction?.[action]) {
          if(action==='REFUSE'&&result.accepted) {this.adjustReputation(-2);s.shiftStats.dilemmaNotes.push(dm.refusedNote||`${c.person.name} could not enter. The manager accepted your decision.`);}
          if(action==='CORRECT'&&result.accepted) s.shiftStats.dilemmaNotes.push(dm.correctedNote||`${c.person.name} accepted another film.`);
        }
        if(camp.inspectorCharacterId && c.person.id===camp.inspectorCharacterId && c.identityTitle) {
          const notes=this.languagePack()?.inspectorNotes||camp.inspectorNotes||{};
          s.shiftStats.dilemmaNotes.push(s.reputation>=80?(notes.highRep||'The inspector liked the service.'):(notes.lowRep||'The inspector asked the manager to improve the service.'));
        }
        const visibleName = this.getKnownCustomerName(c) || 'the customer';
        if (c.person.name && visibleName !== c.person.name) {
          message = message.split(c.person.name).join(visibleName);
          s.shiftStats.dilemmaNotes = s.shiftStats.dilemmaNotes.map((note, index) => index < notesStart ? note : note.split(c.person.name).join(visibleName));
        }
        s.outcomes.push({customer:visibleName,caseType:c.caseType,action,accepted:result.accepted,compliant:!!result.compliant,exception:!!result.exception,evidence:[...(c.discoveredEvidence || [])],asked:[...c.asked],ticketBefore:before,ticketAfter:structuredClone(c.ticket),time:s.clockMins});
        UI.renderTicketOnDesk(c);UI.animateStamp(action,null,c);SoundFX.stamp();
        UI.showDeskFeedback(result.accepted?(result.exception?'warn':'ok'):'err',message);
        UI.renderScheduleBinder();UI.renderSerialsBinder();UI.renderHeader();UI.setDecisionButtons(true);
        if (this.isShiftDismissed()) {
          document.getElementById('nextCustomerBtn').classList.add('hidden');
          this.endShift('SHIFT FAILED — MANAGEMENT DISMISSED YOU');
          return;
        }
        const next=document.getElementById('nextCustomerBtn');next.textContent='Next customer →';next.classList.remove('hidden');
        this.saveProgress();
      },

      applyDecision(c, action, targetId=null) {
        const ev=this.evaluateCustomerCase(c);
        if(ev.needsQuestion || (c.requiredTicketQuestion && !c.ticket.exists)) return {accepted:false,blocked:true,evaluation:ev};
        const exception=action==='ADMIT'&&ev.discretionary;
        const managerComplied=Boolean(c.managerDirective && action==='ADMIT' && !ev.validActions.includes('ADMIT'));
        const managerChallenged=Boolean(c.managerDirective && action==='REFUSE' && ev.validActions.includes('REFUSE'));
        const valid=ev.validActions.includes(action) && (action!=='CORRECT'||ev.options.some(f=>f.id===targetId));
        if(!valid && !exception && !managerComplied) return {accepted:false,evaluation:ev};
        const bookings=structuredClone(this.state.bookings),used=[...this.state.usedSerials];
        const t=c.ticket, b=bookings[t?.serial]; let replacement=null;
        if(action==='ADMIT' || action==='CORRECT') {
          if(!b || b.status!=='reserved') return {accepted:false,evaluation:ev};
          if(action==='CORRECT') {
            const f=this.screening(targetId);
            b.status='cancelled';
            const serial=this.makeUniqueSerial();
            bookings[serial]={serial,screeningId:f.id,seats:c.groupSize,status:'admitted'};
            replacement={exists:true,serial,filmId:f.id,filmTitle:f.title,genreLabel:f.genreLabel,screen:f.screen,time:f.time,date:this.today(),seats:c.groupSize,ticketType:f.screen==='TV Lounge'?'TV LOUNGE PASS':'REPLACEMENT PRINTED'};
            used.push(t.serial,serial);
          } else {b.status='admitted';used.push(t.serial);}
        } else if(action==='REFUSE' && b?.status==='reserved') b.status='cancelled';
        this.state.bookings=bookings;this.state.usedSerials=[...new Set(used)];
        if(replacement) c.ticket=replacement;
        this.resolveScriptedEncounter(c);
        this.syncSeats();
        return {accepted:true,compliant:!exception,exception,managerComplied,managerChallenged,evaluation:ev};
      },

      giveWarning(reasonLabel = 'Rule violation') {
        const res = this.issueWarning(reasonLabel);
        return ' ' + res.summaryText;
      },

      tick() {
        const s=this.state;
        if (!s.shiftActive || s.paused || s.modalDepth || s.decisionLocked || s.shiftExpired) return;
        s.shiftRemainingSeconds = Math.max(0, s.shiftRemainingSeconds - 1);
        UI.updateClockDisplay();
        this.updateQueuePatience();
        if (!s.shiftRemainingSeconds) {
          s.shiftExpired = true;
          this.stopShiftLoop();
          UI.showDeskFeedback('warn', 'Time is up. Finish this customer; remaining story visitors will still be seen.');
        }
        this.saveProgress();
      },

      validateLanguagePack(input) {
        if(!input || typeof input!=='object'||Array.isArray(input))throw new Error('The pack must be a JSON object.');
        const p=structuredClone(input);if(p.version!==undefined && p.version!==2)throw new Error('This pack needs version 2.');p.version=2;
        const str=(x,path)=>{if(typeof x!=='string'||!x.trim()||x.length>300)throw new Error(path+' must be text (1–300 characters).');};
        const list=(x,path)=>{if(!Array.isArray(x)||!x.length||x.length>100)throw new Error(path+' must be a non-empty array (up to 100 items).');x.forEach((v,i)=>str(v,path+'['+i+']'));};
        str(p.unitTitle,'unitTitle');['filmGenres','adjectives'].forEach(k=>list(p[k],k));
        if (Array.isArray(p.tvProgrammes) && p.tvProgrammes.length) list(p.tvProgrammes, 'tvProgrammes');
        else p.tvProgrammes = [];
        const reservedIds = new Set();
        const camp = this.campaign();
        if (camp) {
          [...Object.values(camp.days || {}), camp.endlessDay].filter(Boolean).forEach(d => {
            (d.scheduleChanges || []).forEach(ch => { if (ch.newId) reservedIds.add(ch.newId); });
          });
        }
        const ids=new Set();
        const scheduleKeys = ['films'];
        if (Array.isArray(p.tvLoungeSchedule) && p.tvLoungeSchedule.length) scheduleKeys.push('tvLoungeSchedule');
        else p.tvLoungeSchedule = [];
        scheduleKeys.forEach(key=>{
          if(!Array.isArray(p[key])||!p[key].length||p[key].length>50)throw new Error(key+' needs 1–50 entries.');
          p[key].forEach((f,i)=>{
            const where=key+'['+i+']';if(!f||typeof f!=='object')throw new Error(where+' must be an object.');
            if(!/^[a-z][a-z0-9_]{0,49}$/.test(f.id)||ids.has(f.id)||reservedIds.has(f.id))throw new Error(where+'.id must be unique: lowercase letters, digits and underscores.');ids.add(f.id);
            ['title','genre','genreLabel'].forEach(k=>str(f[k],where+'.'+k));
            if(!(key==='films'?p.filmGenres:p.tvProgrammes).includes(f.genre))throw new Error(where+'.genre is not in the vocabulary list.');
            if(key==='films') {if(![1,2,3].includes(f.screen))throw new Error(where+'.screen must be 1, 2 or 3.');list(f.descriptions,where+'.descriptions');list(f.purposePhrases,where+'.purposePhrases');f.purposePhrases.forEach(v=>{if(!/^to \S/.test(v))throw new Error(where+'.purposePhrases must start with “to ”.');});str(f.adjective,where+'.adjective');}
            else {if(f.screen!=='TV Lounge')throw new Error(where+'.screen must be TV Lounge.');str(f.statement,where+'.statement');}
            const mins=this.parseTime(f.time);
            if(!Number.isFinite(mins)||mins<1065||mins>1335)throw new Error(where+'.time must be HH:MM from 17:45 to 22:15.');
            if(f.timeMins!==undefined&&f.timeMins!==mins)throw new Error(where+'.timeMins does not match time.');f.timeMins=mins;
            if(!Number.isInteger(f.capacity)||f.capacity<1||f.capacity>200)throw new Error(where+'.capacity must be a whole number from 1 to 200.');
          });
        });
        if(p.scenarios!==undefined) throw new Error('Custom scenarios are not supported. Edit films, TV programmes and dialogue instead.');
        return p;
      },

      restoreDefaultPack() {
        this.state.customLanguagePack = null;
        localStorage.removeItem('cinema_chaos_pack_v2');
        document.getElementById('languagePackJsonArea').value=JSON.stringify(this.campaign().languagePack,null,2);
        this.applyCustomLanguagePack();
      },

      adjustReputation(delta) {
        this.state.reputation = Math.max(0, Math.min(100, this.state.reputation + delta));
      },

      /*************************************************************************
       * INTERACTIVE INSPECTION MODE (Compare two items visually)
       *************************************************************************/
      toggleInspectMode() {
        this.state.inspectMode = !this.state.inspectMode;
        const btn = document.getElementById('inspectModeBtn');
        const txt = document.getElementById('inspectModeBtnText');
        if (this.state.inspectMode) {
          btn.className = "bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition";
          txt.textContent = "INSPECT MODE: ON";
        } else {
          btn.className = "bg-slate-700 hover:bg-slate-600 text-amber-200 font-bold text-xs px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 transition";
          txt.textContent = "INSPECT MODE: OFF";
          this.clearInspectSelection();
        }
      },

      clearInspectSelection() {
        this.state.inspectFirst = null;
        document.querySelectorAll('.inspect-selected, .inspect-match, .inspect-mismatch').forEach(el => {
          el.classList.remove('inspect-selected', 'inspect-match', 'inspect-mismatch');
        });
        const status = document.getElementById('inspectStatusText');
        if (status) {
          status.innerHTML = "🔍 Click any two fields (Ticket, ID Card, Statement, Schedule, Arrival Time, Rules) to compare them!";
        }
        const idModalStatus = document.getElementById('idModalInspectStatus');
        if (idModalStatus) {
          idModalStatus.textContent = "Click any field on the ID card and a reference item above to compare them.";
        }
      },

      handleCustomerPortraitInspect(el) {
        if (!this.state.currentCustomer) return;
        const c = this.state.currentCustomer;
        const p = c.person;
        const displayName = this.getKnownCustomerName(c) || 'Customer';
        const condRule = (this.policies().conditionalScreenRules || [])[0];
        if (condRule) {
          const prop = condRule.requiredPersonProp;
          const hasProp = Boolean(p?.[prop]);
          const val = hasProp
            ? (condRule.portraitInspectMatchValue || `HAS_${String(prop).toUpperCase()}`)
            : (condRule.portraitInspectMismatchValue || `NO_${String(prop).toUpperCase()}`);
          const desc = hasProp
            ? (condRule.portraitInspectMatchLabel || `${prop}: yes`)
            : (condRule.portraitInspectMismatchLabel || `${prop}: no`);
          this.handleInspectClick('portrait', val, `${displayName} (${desc})`, el);
        } else {
          this.handleInspectClick('portrait', p.id || p.name, displayName, el);
        }
      },

      handleInspectClick(category,value,label,domEl) {
        if(!this.state.inspectMode || !this.state.currentCustomer)return;
        const first=this.state.inspectFirst,status=document.getElementById('inspectStatusText');
        const idModalStatus = document.getElementById('idModalInspectStatus');
        if(!first) {
          this.clearInspectSelection();
          this.state.inspectFirst={category,value,label,domEl};
          domEl?.classList.add('inspect-selected');
          status.textContent='Selected: '+label+'. Choose a second item.';
          if (idModalStatus) idModalStatus.textContent = status.textContent;
        } else if(first.domEl===domEl) {
          this.clearInspectSelection();
        } else {
          const result=this.compareTwoInspectedItems(first,{category,value,label,domEl});
          [first.domEl,domEl].forEach(el=>{el?.classList.remove('inspect-selected');if(result.isMatch!==null)el?.classList.add(result.isMatch?'inspect-match':'inspect-mismatch');});
          status.textContent=(result.isMatch===null?'ℹ ':result.isMatch?'✓ ':'✕ ')+result.message;
          if (idModalStatus) idModalStatus.textContent = status.textContent;
          this.state.inspectFirst=null;
        }
        document.getElementById('compareStatus').textContent=status.textContent;
      },

      compareTwoInspectedItems(a,b) {
        if ((a.category.startsWith('id_') || b.category.startsWith('id_')) && !this.state.currentCustomer?.idCard?.presented) {
          return { isMatch: null, message: 'Request the document before inspecting it.' };
        }
        const c=this.state.currentCustomer,neutral=message=>({isMatch:null,message}),match=(ok,message)=>({isMatch:ok,message});
        const pair=(x,y)=>a.category===x&&b.category===y||b.category===x&&a.category===y;
        const field=cat=>a.category===cat?a:b;
        const todayDmy = this.formatDateDMY(this.policies().dateDisplay || this.currentDateISO());
        if(pair('serial','serial_log')) {const serial=field('serial').value;return match(!this.state.usedSerials.includes(serial),this.state.usedSerials.includes(serial)?`${serial} is in the used-ticket log.`:`${serial} is not in the used-ticket log.`);}
        if(pair('serial','vip_log')) {
          const serial=field('serial').value;
          const isStaff = c.ticket?.ticketType === 'STAFF PASS' || String(serial).startsWith('STAFF-');
          if (isStaff) {
            const authStaff = this.state.authorizedStaff || [];
            return match(authStaff.includes(serial), authStaff.includes(serial) ? 'This number is on the authorised staff list. Other rules still apply.' : 'This number is not on the authorised staff list.');
          }
          return match(this.state.authorizedVips.includes(serial),this.state.authorizedVips.includes(serial)?'This number is on the VIP list. Other rules still apply.':'This number is not on the VIP list.');
        }
        if(pair('ticket_date','today'))return match(a.value===b.value,`Ticket: ${c.ticket.date}. Today: ${this.today()}.`);
        if(pair('ticket_seats','booking_seats'))return match(Number(a.value)===Number(b.value),`Ticket: ${c.ticket.seats}. Booking record: ${this.booking(c)?.seats??0}.`);
        if(pair('ticket_time','arrival_time')) {
          const time=this.parseTime(field('ticket_time').value),diff=this.arrival(c)-time,tol=this.policies().lateToleranceMins;
          return match(tol===null||tol===undefined||diff<=tol,`Arrival: ${this.formatMins(this.arrival(c))}. Printed start: ${field('ticket_time').value}. ${diff>0?diff+' minutes after start.':'Before the start.'}`);
        }
        if(pair('id_dob','id_issue') || pair('id_issue','id_expiry') || pair('id_issue','today') || pair('id_expiry','today') || pair('id_expiry','rule') || pair('id_issue','rule')) {
          const issueStr = c.idCard?.issueDate || field('id_issue')?.value || '';
          const expStr = c.idCard?.expiryDate || field('id_expiry')?.value || '';
          if (issueStr && !this.isValidCalendarDate(issueStr)) return match(false, `ID issue date (${this.formatDateDMY(issueStr)}) is not a valid calendar date.`);
          if (expStr && !this.isValidCalendarDate(expStr)) return match(false, `ID expiry date (${this.formatDateDMY(expStr)}) is not a valid calendar date.`);
          if (issueStr && expStr && this.compareDates(issueStr, expStr) > 0) {
            return match(false, `ID issue date (${this.formatDateDMY(issueStr)}) is after expiry date (${this.formatDateDMY(expStr)}).`);
          }
          if (issueStr && this.compareDates(issueStr, this.currentDateISO()) > 0) {
            return match(false, `ID issue date (${this.formatDateDMY(issueStr)}) is in the future (today is ${todayDmy}).`);
          }
          if (issueStr && this.compareDates(c.idCard?.dob, issueStr) > 0) return match(false, 'The ID was issued before the date of birth.');
          if (expStr && this.compareDates(expStr, this.currentDateISO()) < 0) {
            return match(false, `ID card expired on ${this.formatDateDMY(expStr)} (today is ${todayDmy}).`);
          }
          return match(true, `ID validity dates (${this.formatDateDMY(issueStr)} to ${this.formatDateDMY(expStr)}) are valid on ${todayDmy}.`);
        }
        if(pair('id_dob','schedule_row') || pair('id_dob','ticket_film') || pair('id_dob','rule') || pair('id_dob','today')) {
          const dob = field('id_dob').value;
          const dobDmy = this.formatDateDMY(dob);
          if (!this.isValidCalendarDate(dob)) return match(false, `ID birth date (${dobDmy}) is not a valid calendar date.`);
          const age = this.calculateAge(dob, this.currentDateISO());
          const f = pair('id_dob','schedule_row') ? this.screening(field('schedule_row').value) : this.screening(c.ticket?.filmId);
          const minAge = f?.minAge || 0;
          const rating = f?.ageRating || 'G';
          return match(age >= minAge, `ID birth date: ${dobDmy} (Age ${age} on ${todayDmy}). ${f ? `${f.title} is rated ${rating} (minimum age ${minAge}).` : ''}`);
        }
        if(pair('id_dob','statement')) {
          const dob = c.idCard?.dob || field('id_dob')?.value;
          const dobDmy = this.formatDateDMY(dob);
          if (!this.isValidCalendarDate(dob)) return match(false, `ID birth date (${dobDmy}) is not a valid calendar date.`);
          const age = this.calculateAge(dob, this.currentDateISO());
          if (!(c.ageRequested || c.statedAgeInOpening)) {
            return neutral(`Birth date ${dobDmy} calculates to age ${age}. The customer has not stated an age yet — ask "How old are you?" to compare.`);
          }
          const claimed = c.claimedAge;
          return match(age === Number(claimed), `Claimed/stated age: ${claimed}. Birth date ${dobDmy} calculates to age ${age}.`);
        }
        if(pair('id_name','ticket_holder')) {
          const idName = field('id_name').value;
          const holder = field('ticket_holder').value;
          return match(idName === holder, `ID Card Name: ${idName}. Ticket Holder: ${holder}.`);
        }
        if(pair('id_name','portrait') || pair('ticket_holder','portrait')) {
          const named = field(pair('id_name','portrait') ? 'id_name' : 'ticket_holder').value;
          const spokenName = c.identityTitle ? null : (c.introducedName || ((c.revealsNameInOpening || c.identityRevealed) ? c.person.name : null));
          if (!spokenName) return neutral(`Name: ${named}. The customer has not told you their name. Compare the ID photograph, ticket holder and ID name instead.`);
          return match(named === spokenName, `Name: ${named}. The customer said their name is ${spokenName}.`);
        }
        if(pair('id_photo','portrait')) {
          const ok = !(c.idCard?.photoMismatch || c.idCard?.photoAltered);
          return match(ok, ok ? 'ID card photograph matches the customer.' : (c.idCard?.photoMismatchText || 'ID card photograph does not match the customer.'));
        }
        if(pair('portrait','rule')) {
          const ruleField = field('rule');
          const condRules = this.policies().conditionalScreenRules || [];
          const condRule = condRules.find(r => r.id === ruleField.value) || condRules[0];
          const custName = this.getKnownCustomerName(c) || 'Customer';
          if (!condRule) {
            if (c.person?.obviousDisguise) {
              return match(false, c.person.disguiseIssueText || `${custName} is wearing an obvious disguise.`);
            }
            return neutral(`Customer: ${custName}. Active rule: ${ruleField.label}. No conditional appearance rule is active for this shift.`);
          }
          const prop = condRule.requiredPersonProp;
          const hasProp = Boolean(c.person?.[prop]);
          const prefix = hasProp
            ? (condRule.portraitInspectMatchLabel ? `${condRule.portraitInspectMatchLabel}.` : (condRule.inspectMatchPrefix || `${prop}.`))
            : (condRule.portraitInspectMismatchLabel ? `${condRule.portraitInspectMismatchLabel}.` : (condRule.inspectMismatchPrefix || `No ${prop}.`));
          if (condRule.inspectMatchPrefix || condRule.inspectMismatchPrefix) {
            const pfx = hasProp ? condRule.inspectMatchPrefix : condRule.inspectMismatchPrefix;
            const summary = condRule.inspectSummary
              || condRule.ruleText
              || condRule.issueText
              || `Screen ${condRule.screen} requires ${prop} after ${this.formatMins(condRule.afterMins)}. All other rules apply.`;
            return neutral(`${pfx} ${summary}`);
          }
          const summary = condRule.inspectSummary
            || condRule.ruleText
            || condRule.issueText
            || `Screen ${condRule.screen} requires ${prop} after ${this.formatMins(condRule.afterMins)}. All other rules apply.`;
          return neutral(`${prefix} ${summary}`);
        }
        if(pair('statement','ticket_film')) {
          if(!c.known.preference || !c.known.publicPlan)return neutral('The customer has not named a specific film or genre.');
          const f=this.screening(field('ticket_film').value);if(!f)return neutral('No programme entry for this film.');
          return match(this.accepts(c,f),`Ticket: ${f.title}. Customer: ${c.dialogue.at(-1)?.reply||c.statement}`);
        }
        if(a.category==='schedule_row'||b.category==='schedule_row') {
          const f=this.screening(field('schedule_row').value),other=a.category==='schedule_row'?b:a;
          if(!f)return neutral('No programme entry.');
          const map={ticket_film:f.id,ticket_screen:f.screen,ticket_time:f.timeMins};
          if(!(other.category in map))return neutral('Compare this row with a ticket film, room or time.');
          if(other.category!=='ticket_film' && c.ticket.filmId!==f.id)return neutral('These are different films. Choose the row for this ticket.');
          const v=other.category==='ticket_time'?this.parseTime(other.value):String(other.value);
          const expected=other.category==='ticket_time'?map[other.category]:String(map[other.category]);
          return match(v===expected,`${other.label}. Programme: ${f.title}, ${f.screen==='TV Lounge'?'TV Lounge':'Screen '+f.screen}, ${f.time}.`);
        }
        return neutral('These fields are not related. Try a ticket field and its programme row.');
      },

      /*************************************************************************
       * CAMPAIGN ENDING EVALUATION, END OF SHIFT, UPGRADES & SAVE SYSTEM
       *************************************************************************/
      matchesEndingConditions(cond, dismissed = false) {
        if (!cond) return true;
        const s = this.state;
        if (cond.requireDismissed === true && !dismissed) return false;
        if (cond.forbidDismissed === true && dismissed) return false;
        if (cond.minReputation !== undefined && s.reputation < cond.minReputation) return false;
        if (cond.maxReputation !== undefined && s.reputation > cond.maxReputation) return false;
        if (cond.minMoney !== undefined && s.money < cond.minMoney) return false;
        if (cond.storyMin) {
          for (const [k, v] of Object.entries(cond.storyMin)) {
            if (Number(s.story[k] || 0) < v) return false;
          }
        }
        if (cond.storyMax) {
          for (const [k, v] of Object.entries(cond.storyMax)) {
            if (Number(s.story[k] || 0) > v) return false;
          }
        }
        if (cond.storyEquals) {
          for (const [k, v] of Object.entries(cond.storyEquals)) {
            const actual = s.story[k];
            if (Array.isArray(v) ? !v.includes(actual) : actual !== v) return false;
          }
        }
        if (Array.isArray(cond.anyOf) && cond.anyOf.length) {
          if (!cond.anyOf.some(sub => this.matchesEndingConditions(sub, dismissed))) return false;
        }
        return true;
      },

      evaluateCampaignEnding(dismissed = this.state.lastShiftDismissed) {
        const camp = this.campaign();
        if (!camp || !Array.isArray(camp.endings) || !camp.endings.length) return null;
        const matched = camp.endings.find(e => this.matchesEndingConditions(e.conditions, dismissed)) || camp.endings[camp.endings.length - 1];
        const callbacks = (camp.endingCallbacks || [])
          .filter(cb => this.matchesEndingConditions(cb.conditions, dismissed))
          .map(cb => ({ characterName: cb.characterName, role: cb.role || '', text: cb.text }));
        return { ...matched, callbacks };
      },

      endShift(customHeadline = null) {
        this.state.shiftActive = false;
        this.pendingShift = null;
        UI.setDecisionButtons(true);
        this.stopShiftLoop();
        UI.clearDepartureBanner();

        const max = this.getMaxWarnings();
        this.state.maxWarnings = max;
        const dismissed = this.isShiftDismissed();
        this.state.lastShiftDismissed = dismissed;
        if (this.state.shiftStats) {
          this.state.shiftStats.warnings = this.state.warnings;
        }
        if (!dismissed && !this.state.completedDays.includes(this.state.day)) {
          this.state.completedDays.push(this.state.day);
        }
        if (this.state.money > this.state.highScore) {
          this.state.highScore = this.state.money;
        }
        const playableMax = this.campaign()?.playableDaysCount || 5;
        if (this.state.day === playableMax) {
          const ending = this.evaluateCampaignEnding(dismissed);
          if (ending) {
            this.state.lastCampaignEnding = ending;
            this.state.story.campaign_ending = ending.id;
          }
        } else {
          this.state.lastCampaignEnding = null;
        }
        if (!dismissed && this.state.shiftRemainingSeconds > 0) {
          this.state.money += 5;
          this.state.shiftStats.cashEarned += 5;
        }
        this.state.highScore = Math.max(this.state.highScore, this.state.money);
        const headline = dismissed
          ? 'SHIFT FAILED — MANAGEMENT DISMISSED YOU'
          : (customHeadline || 'SHIFT COMPLETE — CINEMA CLOSED');
        this.saveProgress();
        UI.renderHeader();
        UI.openShiftReportModal(headline, dismissed);
      },

      buyUpgrade(upgId) {
        const upg = this.upgradesCatalog().find(u => u.id === upgId);
        if (!upg || this.state.ownedUpgrades.includes(upgId)) return;
        if (this.state.money < upg.cost) {
          SoundFX.buzzer();
          return;
        }
        SoundFX.cash();
        this.state.money -= upg.cost;
        this.state.ownedUpgrades.push(upgId);
        this.saveProgress();
        UI.renderHeader();
        UI.renderUpgradesStrip();
        UI.renderUpgradeShop();
      },

      replayCurrentDay() {
        UI.closeShiftReportModal();
        this.applyPendingLanguageMode();
        this.state.warnings = 0;
        this.state.lastShiftDismissed = false;
        this.state.forgivenWarningUsed = false;
        this.state.shiftStats = { served: 0, correct: 0, mistakes: 0, warnings: 0, exceptions: 0, customersLost: 0, cashEarned: 0, dilemmaNotes: [] };
        this.pendingShift = null;
        if (this.dayStartSnapshot?.day === this.state.day) {
          const highScore = this.state.highScore;
          for (const key of this.dayStartKeys) this.state[key] = structuredClone(this.dayStartSnapshot[key]);
          this.state.highScore = Math.max(highScore, this.state.highScore);
          // Preserve rolled-back story and finances, but NEVER replay the RNG.
          this.rngSeed = (this.rngSeed * 16807 + (++this.state.replayNonce) * 9973) % 2147483647 || 1;
        } else {
          // Old saves have no rollback checkpoint; preserve resolved story events.
          this.startupMessage = 'This older save has no day-start checkpoint. Resolved encounters remain completed.';
        }
        this.state.shiftActive = false;
        this.state.currentCustomer = null;
        this.state.lastCampaignEnding = null;
        this.prepareDaySchedule(this.state.day);
        UI.renderHeader();
        UI.renderScheduleBinder();
        UI.renderRulesBinder();
        UI.renderSerialsBinder();
        this.saveProgress();
        UI.openBriefingModal(this.state.day);
      },

      advanceToNextDay() {
        if (this.state.lastShiftDismissed || this.isShiftDismissed() || !this.state.completedDays.includes(this.state.day)) {
          return false;
        }
        UI.closeShiftReportModal();
        this.applyPendingLanguageMode();
        const playableMax = this.campaign().playableDaysCount || 5;
        if (this.state.day <= playableMax) {
          this.state.day += 1;
        }
        this.pendingShift = null;
        this.dayStartSnapshot = null;
        this.state.warnings = 0;
        this.state.lastShiftDismissed = false;
        this.state.forgivenWarningUsed = false;
        this.state.shiftStats = { served: 0, correct: 0, mistakes: 0, warnings: 0, exceptions: 0, customersLost: 0, cashEarned: 0, dilemmaNotes: [] };
        this.prepareDaySchedule(this.state.day);
        UI.renderHeader();
        UI.renderScheduleBinder();
        UI.renderRulesBinder();
        UI.renderSerialsBinder();
        this.saveProgress();
        UI.openBriefingModal(this.state.day);
        return true;
      },

      getCampaignSavedState(campaignId) {
        if (campaignId === this.state.campaignId) {
          return {
            day: this.state.day,
            money: this.state.money,
            reputation: this.state.reputation,
            ownedUpgrades: [...this.state.ownedUpgrades],
            completedDays: [...this.state.completedDays],
            highScore: this.state.highScore,
            totalCustomersLost: this.state.totalCustomersLost || 0,
            story: { ...this.state.story }
          };
        }
        try {
          const v3Raw = localStorage.getItem('cinema_chaos_campaigns_v3');
          if (v3Raw) {
            const v3 = JSON.parse(v3Raw);
            if (v3?.campaigns?.[campaignId]) {
              const saved = v3.campaigns[campaignId];
              return { totalCustomersLost: 0, ...saved };
            }
          }
          if (campaignId === 'the-first-week') {
            const v2Raw = localStorage.getItem('cinema_chaos_save_v2') || localStorage.getItem('cinema_chaos_save_v1');
            if (v2Raw) {
              const saved = JSON.parse(v2Raw);
              return { totalCustomersLost: 0, ...saved };
            }
          }
        } catch (e) {}
        return { day: 1, money: 0, reputation: 80, ownedUpgrades: [], completedDays: [], highScore: 0, totalCustomersLost: 0, story: {} };
      },

      saveProgress() {
        const s = this.state;
        const campId = s.campaignId || 'the-first-week';
        const campData = {
          day: s.day,
          money: s.money,
          reputation: s.reputation,
          ownedUpgrades: [...s.ownedUpgrades],
          completedDays: [...s.completedDays],
          highScore: s.highScore,
          totalCustomersLost: s.totalCustomersLost || 0,
          story: { ...s.story },
          resolvedEncounters: structuredClone(s.resolvedEncounters),
          activeShift: this.captureShift(),
          dayStartSnapshot: this.dayStartSnapshot || null
        };
        try {
          let v3 = { version: 3, campaigns: {} };
          const existingV3 = localStorage.getItem('cinema_chaos_campaigns_v3');
          if (existingV3) {
            try {
              const parsed = JSON.parse(existingV3);
              if (parsed && typeof parsed === 'object' && parsed.campaigns) v3 = parsed;
            } catch (e) {}
          }
          v3.version = 3;
          v3.activeCampaignId = campId;
          v3.difficulty = s.difficulty;
          v3.languageMode = s.selectedLanguageMode || s.languageMode || 'elementary';
          v3.enableTVContent = s.enableTVContent;
          v3.disableQueueWalkouts = s.disableQueueWalkouts;
          v3.muted = SoundFX.muted;
          v3.campaigns[campId] = campData;
          localStorage.setItem('cinema_chaos_campaigns_v3', JSON.stringify(v3));

          if (campId === 'the-first-week') {
            const payload = { version: 2 };
            ['day','difficulty','money','reputation','ownedUpgrades','completedDays','highScore','totalCustomersLost','enableTVContent','disableQueueWalkouts','story'].forEach(k => payload[k] = s[k]);
            payload.languageMode = v3.languageMode;
            payload.muted = SoundFX.muted;
            payload.activeShift = campData.activeShift;
            payload.dayStartSnapshot = campData.dayStartSnapshot;
            payload.resolvedEncounters = campData.resolvedEncounters;
            localStorage.setItem('cinema_chaos_save_v2', JSON.stringify(payload));
          }
        } catch(e) {
          document.getElementById('saveNotice').textContent='Progress cannot be saved in this browser session.';
        }
      },

      loadProgress(requestedCampaignId = null) {
        this.pendingShift = null;
        this.dayStartSnapshot = null;
        try {
          const pack=localStorage.getItem('cinema_chaos_pack_v2');
          if(pack) this.state.customLanguagePack=this.validateLanguagePack(JSON.parse(pack));
        }catch(e){this.startupMessage='The saved language pack could not be loaded. The default pack is ready.';}

        const s = this.state;
        try {
          const v3Raw = localStorage.getItem('cinema_chaos_campaigns_v3');
          const current = localStorage.getItem('cinema_chaos_save_v2');
          const legacy = localStorage.getItem('cinema_chaos_save_v1');

          let v3 = null;
          if (v3Raw) {
            try { v3 = JSON.parse(v3Raw); } catch (e) {}
          }

          const reg = window.CinemaChaos && window.CinemaChaos.CampaignRegistry;
          const targetId = requestedCampaignId
            || (v3?.activeCampaignId && reg?.get(v3.activeCampaignId) ? v3.activeCampaignId : null)
            || s.campaignId
            || 'the-first-week';
          s.campaignId = targetId;

          let d = null;
          if (targetId === 'the-first-week') {
            const raw = current || legacy;
            if (raw) {
              d = JSON.parse(raw);
              if (d.version && d.version !== 2) throw new Error('version');
              if (!current && legacy) {
                this.startupMessage = 'Your campaign has been kept. This shift starts again with the new booking rules.';
              }
            } else if (v3?.campaigns?.['the-first-week']) {
              d = v3.campaigns['the-first-week'];
            }
          } else if (v3?.campaigns?.[targetId]) {
            d = v3.campaigns[targetId];
          }

          // Reset per-campaign fields before applying loaded data
          Object.assign(s, {
            day: 1,
            money: 0,
            reputation: 80,
            ownedUpgrades: [],
            completedDays: [],
            highScore: 0,
            totalCustomersLost: 0,
            story: {},
            resolvedEncounters: {}
          });

          const globalSource = d || v3;
          if (globalSource) {
            if (['relaxed','normal','chaos'].includes(globalSource.difficulty)) s.difficulty = globalSource.difficulty;
            const savedLang = globalSource.languageMode || v3?.languageMode;
            if (['elementary','intermediate','advanced'].includes(savedLang)) {
              s.languageMode = savedLang;
              s.selectedLanguageMode = savedLang;
            }
            for (const k of ['enableTVContent','disableQueueWalkouts']) {
              if (typeof globalSource[k] === 'boolean') s[k] = globalSource[k];
              else if (v3 && typeof v3[k] === 'boolean') s[k] = v3[k];
            }
            const mutedVal = globalSource.muted !== undefined ? globalSource.muted : v3?.muted;
            if (mutedVal !== undefined) {
              SoundFX.muted = !!mutedVal;
              document.getElementById('muteBtnIcon').textContent = SoundFX.muted ? '🔇' : '🔊';
            }
          }

          if (d) {
            const maxDay = (this.campaign()?.totalDays || 7) + 1;
            if (Number.isInteger(d.day) && d.day >= 1 && d.day <= maxDay) s.day = d.day;
            for (const k of ['money','highScore','reputation','totalCustomersLost']) {
              if (Number.isFinite(d[k]) && d[k] >= 0) s[k] = k === 'reputation' ? Math.min(100, d[k]) : Math.floor(d[k]);
            }
            const catalog = this.upgradesCatalog();
            s.ownedUpgrades = Array.isArray(d.ownedUpgrades)
              ? [...new Set(d.ownedUpgrades.filter(id => catalog.some(u => u.id === id)))]
              : [];
            s.completedDays = Array.isArray(d.completedDays)
              ? d.completedDays.filter(n => Number.isInteger(n) && n >= 1 && n <= maxDay)
              : [];
            s.story = {};
            if (d.story && typeof d.story === 'object') {
              for (const [k, v] of Object.entries(d.story)) {
                if (typeof v === 'string' && v.length <= 100) s.story[k] = v;
                else if (typeof v === 'number' && Number.isFinite(v)) s.story[k] = v;
                else if (typeof v === 'boolean') s.story[k] = v;
              }
            }
            if (d.resolvedEncounters && typeof d.resolvedEncounters === 'object' && !Array.isArray(d.resolvedEncounters)) {
              for (const [day, encounters] of Object.entries(d.resolvedEncounters)) {
                if (!Number.isInteger(Number(day)) || !encounters || typeof encounters !== 'object') continue;
                s.resolvedEncounters[day] = {};
                for (const [id, resolved] of Object.entries(encounters)) if (resolved === true) s.resolvedEncounters[day][id] = true;
              }
            } else {
              // Migrate the interrupted implementation's global flags to the saved day.
              s.resolvedEncounters[s.day] = {};
              for (const enc of this.dayConfig(s.day).scriptedEncounters || []) {
                if (s.story[`resolved_enc_${enc.id}`] === 'yes') s.resolvedEncounters[s.day][enc.id] = true;
              }
            }
            const live = d.activeShift;
            if (live && live.campaignId === targetId && live.day === s.day &&
                Number.isFinite(live.clockMins) && Number.isInteger(live.rngSeed) &&
                Array.isArray(live.schedule) && Array.isArray(live.queue) && live.bookings && live.shiftStats) {
              if (Number.isInteger(live.shiftDurationSeconds) && Array.isArray(live.shiftPlan)) {
                this.pendingShift = structuredClone(live);
              } else {
                this.startupMessage = 'The new shift countdown requires restarting the interrupted shift; your campaign progress is preserved.';
              }
            }
            if (d.dayStartSnapshot?.day === s.day && this.dayStartKeys.every(k => d.dayStartSnapshot[k] !== undefined)) {
              this.dayStartSnapshot = structuredClone(d.dayStartSnapshot);
            }
          }
        } catch(e) {
          this.startupMessage = 'Saved progress could not be loaded. A new campaign is ready.';
        }
        this.state.maxWarnings = this.getMaxWarnings(this.state.difficulty);
      },

      resetCampaignConfirm() {
        this.pendingShift = null; this.dayStartSnapshot = null;
        this.state.resolvedEncounters = {};
        this.stopShiftLoop();this.state.shiftActive=false;this.state.currentCustomer=null;UI.clearDepartureBanner();
        Object.assign(this.state,{day:1,money:0,reputation:80,warnings:0,lastShiftDismissed:false,forgivenWarningUsed:false,ownedUpgrades:[],completedDays:[],totalCustomersLost:0,story:{},outcomes:[],lastCampaignEnding:null});
        this.prepareDaySchedule(1);this.saveProgress();UI.renderHeader();UI.renderScheduleBinder();UI.renderRulesBinder();UI.renderSerialsBinder();UI.renderUpgradesStrip();UI.openBriefingModal(1);
      },
    };
