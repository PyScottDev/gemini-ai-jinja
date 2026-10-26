    /***************************************************************************
     * CAMPAIGN REGISTRY & SCHEMA VALIDATOR
     * Discovers, validates, and manages campaign definitions without requiring
     * any campaign-specific logic in engine.js or ui.js.
     ***************************************************************************/
    const CampaignRegistry = {
      _campaigns: new Map(),
      _order: [],

      SUPPORTED_POLICY_KEYS: new Set([
        "allowCorrections",
        "lateToleranceMins",
        "lateRuleTitle",
        "lateRuleText",
        "checkDuplicates",
        "allowPromoChanges",
        "tvLoungeOpen",
        "allowVipPasses",
        "allowStaffPasses",
        "checkAgeRestrictions",
        "currentDate",
        "dateDisplay",
        "ageRuleTitle",
        "ageRuleText",
        "initialUsedSerials",
        "conditionalScreenRules",
        "printerClosedMessage"
      ]),

      SUPPORTED_CASE_TYPES: new Set([
        "valid",
        "subjective",
        "wrong_film",
        "screen",
        "time",
        "date",
        "missing",
        "group",
        "incomplete",
        "change",
        "hidden_ticket",
        "late",
        "duplicate",
        "promo",
        "combined",
        "tv",
        "tv_wrong",
        "cancelled",
        "red",
        "no_red",
        "move",
        "vip",
        "age_valid",
        "underage",
        "missing_id",
        "refused_id",
        "fake_id",
        "expired_id",
        "false_identity",
        "disguise",
        "staff_impostor",
        "manager_pressure",
        "overbooked_group"
      ]),

      SUPPORTED_TRIGGER_KEYS: new Set([
        "caseIndex",
        "minCaseIndex",
        "minClockMins",
        "maxClockMins",
        "requireOpenScreeningId",
        "requireLateScreeningId",
        "requireOpenRoom",
        "requireStoryFlag",
        "requireStoryValue",
        "requireUnusedSerial"
      ]),

      VALID_SCREENS: new Set([1, 2, 3, "TV Lounge"]),

      parseTime(t) {
        if (!/^\d{2}:\d{2}$/.test(t || "")) return NaN;
        const [h, m] = t.split(":").map(Number);
        return h < 24 && m < 60 ? h * 60 + m : NaN;
      },

      validate(campaign) {
        if (!campaign || typeof campaign !== "object" || Array.isArray(campaign)) {
          throw new Error("Campaign definition must be an object.");
        }
        const c = structuredClone(campaign);
        const reqStr = (val, path) => {
          if (typeof val !== "string" || !val.trim()) {
            throw new Error(`Invalid or missing string at '${path}'.`);
          }
        };

        reqStr(c.id, "id");
        if (!/^[a-z][a-z0-9_-]{1,60}$/.test(c.id)) {
          throw new Error(`Campaign id '${c.id}' must be lowercase alphanumeric/underscores/hyphens.`);
        }
        reqStr(c.title, "title");
        reqStr(c.subtitle, "subtitle");
        reqStr(c.description, "description");

        if (!c.languageModes || typeof c.languageModes !== "object") {
          throw new Error(`Campaign '${c.id}' must define 'languageModes'.`);
        }
        for (const mode of ["elementary", "intermediate", "advanced"]) {
          if (!c.languageModes[mode] || typeof c.languageModes[mode] !== "object") {
            throw new Error(`Campaign '${c.id}' languageModes must include '${mode}'.`);
          }
        }

        // Validate characters and collect valid character IDs
        const characterIds = new Set();
        if (c.characters !== undefined) {
          if (!c.characters || typeof c.characters !== "object" || Array.isArray(c.characters)) {
            throw new Error(`Campaign '${c.id}' characters must be an object map.`);
          }
          for (const [charKey, charDef] of Object.entries(c.characters)) {
            if (!charDef || typeof charDef !== "object") {
              throw new Error(`Invalid character definition at 'characters.${charKey}'.`);
            }
            reqStr(charDef.id, `characters.${charKey}.id`);
            reqStr(charDef.name, `characters.${charKey}.name`);
            characterIds.add(charKey);
            characterIds.add(charDef.id);
          }
        }
        if (c.inspectorCharacterId !== undefined && c.inspectorCharacterId !== null) {
          reqStr(c.inspectorCharacterId, "inspectorCharacterId");
          if (!characterIds.has(c.inspectorCharacterId)) {
            throw new Error(`Campaign '${c.id}' inspectorCharacterId '${c.inspectorCharacterId}' does not reference a defined character.`);
          }
        }

        if (!c.languagePack || typeof c.languagePack !== "object") {
          throw new Error(`Campaign '${c.id}' must define 'languagePack'.`);
        }
        if (!Array.isArray(c.languagePack.films) || c.languagePack.films.length === 0) {
          throw new Error(`Campaign '${c.id}' languagePack.films must be a non-empty array.`);
        }

        const baseScreeningIds = new Set();
        for (const [idx, f] of c.languagePack.films.entries()) {
          reqStr(f.id, `languagePack.films[${idx}].id`);
          if (baseScreeningIds.has(f.id)) {
            throw new Error(`Duplicate screening id '${f.id}' at languagePack.films[${idx}].id.`);
          }
          reqStr(f.title, `languagePack.films[${idx}].title`);
          reqStr(f.genre, `languagePack.films[${idx}].genre`);
          reqStr(f.genreLabel, `languagePack.films[${idx}].genreLabel`);
          if (!this.VALID_SCREENS.has(f.screen)) {
            throw new Error(`Invalid screen '${f.screen}' at languagePack.films[${idx}].screen.`);
          }
          const mins = this.parseTime(f.time);
          if (!Number.isFinite(mins)) {
            throw new Error(`Invalid time '${f.time}' at languagePack.films[${idx}].time.`);
          }
          f.timeMins = mins;
          if (!Number.isInteger(f.capacity) || f.capacity < 1) {
            throw new Error(`Invalid capacity at languagePack.films[${idx}].capacity.`);
          }
          if (f.ageRating !== undefined) {
            reqStr(f.ageRating, `languagePack.films[${idx}].ageRating`);
          }
          if (f.minAge !== undefined && (!Number.isInteger(f.minAge) || f.minAge < 0)) {
            throw new Error(`Invalid minAge at languagePack.films[${idx}].minAge.`);
          }
          baseScreeningIds.add(f.id);
        }

        if (c.languagePack.tvLoungeSchedule !== undefined) {
          if (!Array.isArray(c.languagePack.tvLoungeSchedule)) {
            throw new Error(`Campaign '${c.id}' languagePack.tvLoungeSchedule must be an array.`);
          }
          for (const [idx, tv] of c.languagePack.tvLoungeSchedule.entries()) {
            reqStr(tv.id, `languagePack.tvLoungeSchedule[${idx}].id`);
            if (baseScreeningIds.has(tv.id)) {
              throw new Error(`Duplicate screening id '${tv.id}' at languagePack.tvLoungeSchedule[${idx}].id.`);
            }
            reqStr(tv.title, `languagePack.tvLoungeSchedule[${idx}].title`);
            reqStr(tv.genre, `languagePack.tvLoungeSchedule[${idx}].genre`);
            const mins = this.parseTime(tv.time);
            if (!Number.isFinite(mins)) {
              throw new Error(`Invalid time '${tv.time}' at languagePack.tvLoungeSchedule[${idx}].time.`);
            }
            tv.timeMins = mins;
            baseScreeningIds.add(tv.id);
          }
        }

        if (!c.days || typeof c.days !== "object" || Array.isArray(c.days)) {
          throw new Error(`Campaign '${c.id}' must define a 'days' object.`);
        }
        const dayKeys = Object.keys(c.days).map(Number).filter(n => Number.isInteger(n) && n >= 1);
        if (dayKeys.length === 0) {
          throw new Error(`Campaign '${c.id}' must define at least Day 1 in 'days'.`);
        }

        const checkDay = (dayCfg, label) => {
          if (!dayCfg || typeof dayCfg !== "object") {
            throw new Error(`Invalid day configuration at '${label}'.`);
          }
          reqStr(dayCfg.dayName, `${label}.dayName`);
          reqStr(dayCfg.title, `${label}.title`);
          if (dayCfg.shift !== undefined) {
            const sh = dayCfg.shift;
            if (!sh || !Number.isInteger(sh.targetCustomers) || sh.targetCustomers < 1 || sh.targetCustomers > 100 ||
                !Number.isInteger(sh.durationSeconds) || sh.durationSeconds < 30 || sh.durationSeconds > 7200) {
              throw new Error(`Invalid shift target or countdown duration at ${label}.shift.`);
            }
          }
          if (!dayCfg.policies || typeof dayCfg.policies !== "object" || Array.isArray(dayCfg.policies)) {
            throw new Error(`Missing 'policies' object at '${label}'.`);
          }

          // Validate policy keys and conditionalScreenRules
          for (const polKey of Object.keys(dayCfg.policies)) {
            if (!this.SUPPORTED_POLICY_KEYS.has(polKey)) {
              throw new Error(`Unsupported policy or rule type '${polKey}' at ${label}.policies.`);
            }
          }
          if (dayCfg.policies.conditionalScreenRules !== undefined) {
            if (!Array.isArray(dayCfg.policies.conditionalScreenRules)) {
              throw new Error(`'conditionalScreenRules' must be an array at ${label}.policies.`);
            }
            for (const [rIdx, rule] of dayCfg.policies.conditionalScreenRules.entries()) {
              const rPath = `${label}.policies.conditionalScreenRules[${rIdx}]`;
              if (!rule || typeof rule !== "object" || Array.isArray(rule)) {
                throw new Error(`Invalid conditional rule object at ${rPath}.`);
              }
              if (rule.type !== undefined && rule.type !== "screen_after_time_person_prop") {
                throw new Error(`Unsupported conditional rule type '${rule.type}' at ${rPath}.`);
              }
              reqStr(rule.id, `${rPath}.id`);
              if (!this.VALID_SCREENS.has(rule.screen)) {
                throw new Error(`Invalid screen '${rule.screen}' at ${rPath}.screen.`);
              }
              if (!Number.isFinite(rule.afterMins)) {
                throw new Error(`Invalid afterMins at ${rPath}.afterMins.`);
              }
              reqStr(rule.requiredPersonProp, `${rPath}.requiredPersonProp`);
              reqStr(rule.issueText, `${rPath}.issueText`);
            }
          }

          const dayScreeningIds = new Set(baseScreeningIds);
          if (Array.isArray(dayCfg.scheduleChanges)) {
            for (const [i, sc] of dayCfg.scheduleChanges.entries()) {
              const scPath = `${label}.scheduleChanges[${i}]`;
              if (!["relocate", "cancel", "add_extra"].includes(sc.type)) {
                throw new Error(`Unknown scheduleChange type '${sc.type}' at ${scPath}.`);
              }
              if (sc.type === "add_extra") {
                reqStr(sc.sourceScreeningId, `${scPath}.sourceScreeningId`);
                if (!dayScreeningIds.has(sc.sourceScreeningId)) {
                  throw new Error(`Unknown sourceScreeningId '${sc.sourceScreeningId}' at ${scPath}.`);
                }
                reqStr(sc.newId, `${scPath}.newId`);
                if (dayScreeningIds.has(sc.newId)) {
                  throw new Error(`Duplicate extra screening newId '${sc.newId}' at ${scPath}.`);
                }
                if (!this.VALID_SCREENS.has(sc.screen)) {
                  throw new Error(`Invalid screen '${sc.screen}' at ${scPath}.screen.`);
                }
                const extraMins = this.parseTime(sc.time);
                if (!Number.isFinite(extraMins)) {
                  throw new Error(`Invalid time in ${scPath}.`);
                }
                sc.timeMins = extraMins;
                dayScreeningIds.add(sc.newId);
              } else {
                reqStr(sc.screeningId, `${scPath}.screeningId`);
                if (!dayScreeningIds.has(sc.screeningId)) {
                  throw new Error(`Unknown screeningId '${sc.screeningId}' at ${scPath}.`);
                }
                if (sc.type === "relocate" && !this.VALID_SCREENS.has(sc.toScreen)) {
                  throw new Error(`Invalid target screen '${sc.toScreen}' at ${scPath}.toScreen.`);
                }
              }
            }
          }

          if (Array.isArray(dayCfg.storyScheduleBoosts)) {
            for (const [bIdx, boost] of dayCfg.storyScheduleBoosts.entries()) {
              const bPath = `${label}.storyScheduleBoosts[${bIdx}]`;
              reqStr(boost.requireStoryKey, `${bPath}.requireStoryKey`);
              reqStr(boost.screeningId, `${bPath}.screeningId`);
              if (!dayScreeningIds.has(boost.screeningId)) {
                throw new Error(`Unknown screeningId '${boost.screeningId}' at ${bPath}.`);
              }
              if (!Number.isInteger(boost.capacityDelta)) {
                throw new Error(`Invalid capacityDelta at ${bPath}.`);
              }
            }
          }

          const dayScriptedCaseTypes = new Set();
          if (dayCfg.scriptedEncounters !== undefined) {
            if (!Array.isArray(dayCfg.scriptedEncounters)) {
              throw new Error(`'scriptedEncounters' must be an array at ${label}.`);
            }
            for (const [eIdx, enc] of dayCfg.scriptedEncounters.entries()) {
              const ePath = `${label}.scriptedEncounters[${eIdx}]`;
              if (!enc || typeof enc !== "object") {
                throw new Error(`Invalid scriptedEncounter at ${ePath}.`);
              }
              reqStr(enc.id, `${ePath}.id`);
              reqStr(enc.caseType, `${ePath}.caseType`);
              for (const key of ['guaranteed', 'preventQueueWalkout', 'requiresIdentityCheck']) {
                if (enc[key] !== undefined && typeof enc[key] !== 'boolean') throw new Error(`${ePath}.${key} must be boolean.`);
              }
              if (enc.idCard !== undefined) {
                if (!enc.idCard || typeof enc.idCard !== 'object' || Array.isArray(enc.idCard)) throw new Error(`${ePath}.idCard must be a document object.`);
                // Impossible printed dates are valid scenario content (forgeries), not schema errors.
                for (const key of ['dob', 'issueDate', 'expiryDate']) {
                  if (enc.idCard[key] !== undefined && typeof enc.idCard[key] !== 'string') throw new Error(`${ePath}.idCard.${key} must be printed text.`);
                }
              }
              dayScriptedCaseTypes.add(enc.caseType);

              if (enc.characterId !== undefined && enc.characterId !== null) {
                reqStr(enc.characterId, `${ePath}.characterId`);
                if (!characterIds.has(enc.characterId)) {
                  throw new Error(`Unknown characterId '${enc.characterId}' at ${ePath}.characterId.`);
                }
              }
              if (enc.targetScreeningId !== undefined && enc.targetScreeningId !== null) {
                reqStr(enc.targetScreeningId, `${ePath}.targetScreeningId`);
                if (!dayScreeningIds.has(enc.targetScreeningId)) {
                  throw new Error(`Unknown targetScreeningId '${enc.targetScreeningId}' at ${ePath}.targetScreeningId.`);
                }
              }
              if (enc.trigger !== undefined) {
                if (!enc.trigger || typeof enc.trigger !== "object" || Array.isArray(enc.trigger)) {
                  throw new Error(`Invalid trigger object at ${ePath}.trigger.`);
                }
                for (const tKey of Object.keys(enc.trigger)) {
                  if (!this.SUPPORTED_TRIGGER_KEYS.has(tKey)) {
                    throw new Error(`Unsupported trigger key '${tKey}' at ${ePath}.trigger.`);
                  }
                }
                if (enc.trigger.requireOpenScreeningId && !dayScreeningIds.has(enc.trigger.requireOpenScreeningId)) {
                  throw new Error(`Unknown requireOpenScreeningId '${enc.trigger.requireOpenScreeningId}' at ${ePath}.trigger.`);
                }
                if (enc.trigger.requireLateScreeningId && !dayScreeningIds.has(enc.trigger.requireLateScreeningId)) {
                  throw new Error(`Unknown requireLateScreeningId '${enc.trigger.requireLateScreeningId}' at ${ePath}.trigger.`);
                }
              }
            }
          }

          if (dayCfg.casePool !== undefined) {
            if (!Array.isArray(dayCfg.casePool) || dayCfg.casePool.length === 0) {
              throw new Error(`'casePool' must be a non-empty array at ${label}.casePool.`);
            }
            for (const [cIdx, ct] of dayCfg.casePool.entries()) {
              if (typeof ct !== "string" || (!this.SUPPORTED_CASE_TYPES.has(ct) && !dayScriptedCaseTypes.has(ct))) {
                throw new Error(`Unsupported caseType '${ct}' at ${label}.casePool[${cIdx}].`);
              }
            }
          }
        };

        for (const k of dayKeys) {
          checkDay(c.days[k], `days[${k}]`);
        }
        if (c.endlessDay) {
          checkDay(c.endlessDay, "endlessDay");
        }
        if (c.endings !== undefined) {
          if (!Array.isArray(c.endings) || c.endings.length === 0) {
            throw new Error(`Campaign '${c.id}' endings must be a non-empty array.`);
          }
          for (const [eIdx, endDef] of c.endings.entries()) {
            const ePath = `endings[${eIdx}]`;
            if (!endDef || typeof endDef !== "object") {
              throw new Error(`Invalid ending definition at ${ePath}.`);
            }
            reqStr(endDef.id, `${ePath}.id`);
            reqStr(endDef.title, `${ePath}.title`);
            reqStr(endDef.summary, `${ePath}.summary`);
          }
        }

        return c;
      },

      register(campaign) {
        const validated = this.validate(campaign);
        if (!this._campaigns.has(validated.id)) {
          this._order.push(validated.id);
        }
        this._campaigns.set(validated.id, validated);
        return validated;
      },

      get(id) {
        return this._campaigns.get(id) || null;
      },

      list() {
        return this._order.map(id => this._campaigns.get(id));
      },

      unregister(id) {
        this._campaigns.delete(id);
        this._order = this._order.filter(item => item !== id);
      }
    };

    window.CinemaChaos = window.CinemaChaos || {};
    window.CinemaChaos.CampaignRegistry = CampaignRegistry;
