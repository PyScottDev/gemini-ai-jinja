/***************************************************************************
 * MINIMAL DISPOSABLE TEST CAMPAIGN ("Festival Showcase")
 * Used by automated tests to prove that js/engine.js and js/ui.js can load
 * and run a completely different campaign without any engine modifications.
 ***************************************************************************/
const MINIMAL_TEST_CAMPAIGN = {
  schemaVersion: 1,
  id: "festival-showcase",
  title: "Festival Showcase",
  subtitle: "7 Days · Special Screening Event",
  description: "A minimal test campaign with two fictional festival films, a 5-minute late policy, and a Day 1 screen relocation.",
  totalDays: 7,
  playableDaysCount: 1,
  unlockRequirements: { type: "always" },
  serialPrefix: "FS",
  authorizedVips: ["VIP-100-DIRECTOR"],
  inspectorCharacterId: "dr_vega",
  inspectorNotes: {
    highRep: "Dr Vega praised the festival box office.",
    lowRep: "Dr Vega noted confusion at the festival desk."
  },
  lateRuleText: "No entry more than 5 minutes after start time during the festival.",
  vipRuleText: "Festival VIP passes must match the authorized director list.",

  languageModes: {
    elementary: { label: "Elementary", available: true },
    intermediate: { label: "Intermediate", available: true },
    advanced: { label: "Advanced", available: false, notice: "Coming Soon" }
  },

  characters: {
    dr_vega: {
      id: "dr_vega",
      name: "Dr Vega",
      tag: "Festival Guest",
      isElderly: false,
      coatColor: "#1e3a8a",
      shirtColor: "#e0f2fe",
      hairColor: "#0f172a",
      skinColor: "#f1c27d",
      glasses: true,
      hat: false,
      wearingRed: false
    }
  },

  upgradesCatalog: [
    {
      id: "scanner",
      name: "Festival Barcode Reader",
      cost: 20,
      icon: "🔍",
      desc: "Scans festival ticket fields against the programme."
    }
  ],

  languagePack: {
    version: 2,
    unitTitle: "Festival Showcase — Elementary Pack",
    filmGenres: ["science fiction", "documentary"],
    tvProgrammes: ["wildlife documentary"],
    adjectives: ["exciting", "interesting"],
    films: [
      {
        id: "cosmic_voyage",
        title: "Cosmic Voyage",
        genre: "science fiction",
        genreLabel: "Sci-fi",
        screen: 1,
        time: "18:00",
        timeMins: 18 * 60,
        capacity: 10,
        adjective: "exciting",
        descriptions: [
          "I'm going to see the space voyage film.",
          "I want an exciting science-fiction story."
        ],
        purposePhrases: ["to see the stars"]
      },
      {
        id: "ocean_mysteries",
        title: "Ocean Mysteries",
        genre: "documentary",
        genreLabel: "Documentary",
        screen: 2,
        time: "19:00",
        timeMins: 19 * 60,
        capacity: 10,
        adjective: "interesting",
        descriptions: [
          "I'm going to watch the ocean documentary.",
          "I want something interesting about the deep sea."
        ],
        purposePhrases: ["to learn about the ocean"]
      }
    ],
    tvLoungeSchedule: [
      {
        id: "tv_reef",
        title: "Coral Reef Live",
        genre: "wildlife documentary",
        genreLabel: "Wildlife documentary",
        screen: "TV Lounge",
        time: "19:30",
        timeMins: 19 * 60 + 30,
        capacity: 6,
        statement: "I'm going to watch the reef documentary."
      }
    ]
  },

  languagePacks: {
    intermediate: {
      version: 2,
      unitTitle: "Festival Showcase — Intermediate Pack",
      filmGenres: ["science fiction", "documentary"],
      tvProgrammes: ["wildlife documentary"],
      adjectives: ["exciting", "interesting"],
      films: [
        {
          id: "cosmic_voyage",
          title: "Cosmic Voyage",
          genre: "science fiction",
          genreLabel: "Sci-fi",
          screen: 1,
          time: "18:00",
          timeMins: 18 * 60,
          capacity: 10,
          adjective: "exciting",
          descriptions: [
            "I'm planning to attend the interstellar sci-fi screening.",
            "I'd like an exciting science-fiction adventure."
          ],
          purposePhrases: ["to explore distant galaxies"]
        },
        {
          id: "ocean_mysteries",
          title: "Ocean Mysteries",
          genre: "documentary",
          genreLabel: "Documentary",
          screen: 2,
          time: "19:00",
          timeMins: 19 * 60,
          capacity: 10,
          adjective: "interesting",
          descriptions: [
            "I'm hoping to catch the marine biology documentary.",
            "I'm looking for an interesting deep-sea feature."
          ],
          purposePhrases: ["to discover marine ecosystems"]
        }
      ],
      tvLoungeSchedule: [
        {
          id: "tv_reef",
          title: "Coral Reef Live",
          genre: "wildlife documentary",
          genreLabel: "Wildlife documentary",
          screen: "TV Lounge",
          time: "19:30",
          timeMins: 19 * 60 + 30,
          capacity: 6,
          statement: "I'm planning to watch the live coral reef broadcast."
        }
      ]
    }
  },

  days: {
    1: {
      dayNum: 1,
      dayName: "FESTIVAL DAY",
      playable: true,
      title: "Day 1 — Opening Gala",
      memo: "FESTIVAL GALA NOTICE:\nCosmic Voyage (18:00) has moved to Screen 2. Strict 5-minute late limit.",
      briefingMemo: "Welcome to the Festival Showcase.\nCosmic Voyage is relocated to Screen 2 today, and the late limit is 5 minutes.",
      checklist: [
        "Cosmic Voyage moved from Screen 1 to Screen 2.",
        "Strict 5-minute late entry limit.",
        "Corrections printer is enabled from Day 1."
      ],
      rulesSummary: [
        { id: "r_fest_move", title: "Room Change", text: "Cosmic Voyage (18:00) moved to Screen 2." }
      ],
      policies: {
        allowCorrections: true,
        lateToleranceMins: 5,
        checkDuplicates: true,
        allowPromoChanges: false,
        tvLoungeOpen: false,
        allowVipPasses: true,
        initialUsedSerials: ["FS-001"],
        conditionalScreenRules: [
          {
            id: "gala_glasses",
            screen: 1,
            afterMins: 1200,
            requiredPersonProp: "glasses",
            issueText: "Screen 1: after 20:00, festival guests need glasses.",
            ruleTitle: "Screen 1: festival glasses",
            ruleText: "After 20:00, only guests wearing glasses can enter Screen 1.",
            portraitInspectMatchValue: "WEARING GLASSES",
            portraitInspectMismatchValue: "NO GLASSES",
            portraitInspectMatchLabel: "Wearing Festival Glasses",
            portraitInspectMismatchLabel: "No glasses",
            inspectMatchPrefix: "Glasses worn.",
            inspectMismatchPrefix: "No glasses worn.",
            inspectSummary: "Screen 1 requires festival glasses after 20:00. All other rules apply."
          }
        ]
      },
      scheduleChanges: [
        {
          type: "relocate",
          screeningId: "cosmic_voyage",
          toScreen: 2,
          statusLabel: "MOVED TO SCR 2"
        }
      ],
      midShiftNotices: [
        {
          id: "gala_notice",
          atMins: 1080,
          text: "The 18:00 Festival Gala screening is now starting in Screen 2."
        }
      ],
      casePool: ["wrong_film", "screen", "time", "date", "missing", "duplicate", "late"],
      scriptedEncounters: [
        {
          id: "vega_visit",
          trigger: { caseIndex: 1, requireOpenScreeningId: "ocean_mysteries" },
          characterId: "dr_vega",
          storyKey: "vega",
          caseType: "vega_visit",
          targetScreeningId: "ocean_mysteries",
          statementTemplate: "Hello! I'm Dr Vega. I'm going to see {title} at {time}."
        }
      ]
    },
    2: { dayNum: 2, dayName: "TUESDAY", playable: false, title: "Reserved", memo: "", checklist: [], rulesSummary: [], policies: { allowCorrections: true, lateToleranceMins: 5, checkDuplicates: true, allowPromoChanges: false, tvLoungeOpen: false, allowVipPasses: true, initialUsedSerials: [], conditionalScreenRules: [] }, scheduleChanges: [], midShiftNotices: [], casePool: ["missing"], scriptedEncounters: [] },
    3: { dayNum: 3, dayName: "WEDNESDAY", playable: false, title: "Reserved", memo: "", checklist: [], rulesSummary: [], policies: { allowCorrections: true, lateToleranceMins: 5, checkDuplicates: true, allowPromoChanges: false, tvLoungeOpen: false, allowVipPasses: true, initialUsedSerials: [], conditionalScreenRules: [] }, scheduleChanges: [], midShiftNotices: [], casePool: ["missing"], scriptedEncounters: [] },
    4: { dayNum: 4, dayName: "THURSDAY", playable: false, title: "Reserved", memo: "", checklist: [], rulesSummary: [], policies: { allowCorrections: true, lateToleranceMins: 5, checkDuplicates: true, allowPromoChanges: false, tvLoungeOpen: false, allowVipPasses: true, initialUsedSerials: [], conditionalScreenRules: [] }, scheduleChanges: [], midShiftNotices: [], casePool: ["missing"], scriptedEncounters: [] },
    5: { dayNum: 5, dayName: "FRIDAY", playable: false, title: "Reserved", memo: "", checklist: [], rulesSummary: [], policies: { allowCorrections: true, lateToleranceMins: 5, checkDuplicates: true, allowPromoChanges: false, tvLoungeOpen: false, allowVipPasses: true, initialUsedSerials: [], conditionalScreenRules: [] }, scheduleChanges: [], midShiftNotices: [], casePool: ["missing"], scriptedEncounters: [] },
    6: { dayNum: 6, dayName: "SATURDAY", playable: false, title: "Reserved", memo: "", checklist: [], rulesSummary: [], policies: { allowCorrections: true, lateToleranceMins: 5, checkDuplicates: true, allowPromoChanges: false, tvLoungeOpen: false, allowVipPasses: true, initialUsedSerials: [], conditionalScreenRules: [] }, scheduleChanges: [], midShiftNotices: [], casePool: ["missing"], scriptedEncounters: [] },
    7: { dayNum: 7, dayName: "SUNDAY", playable: false, title: "Reserved", memo: "", checklist: [], rulesSummary: [], policies: { allowCorrections: true, lateToleranceMins: 5, checkDuplicates: true, allowPromoChanges: false, tvLoungeOpen: false, allowVipPasses: true, initialUsedSerials: [], conditionalScreenRules: [] }, scheduleChanges: [], midShiftNotices: [], casePool: ["missing"], scriptedEncounters: [] }
  },

  endlessDay: {
    dayNum: 2,
    dayName: "FESTIVAL ENCORE",
    isEndless: true,
    title: "Endless Mode — Festival Encore",
    memo: "Endless festival shift.",
    briefingMemo: "Welcome to the Festival Encore shift.",
    checklist: ["All festival policies apply."],
    rulesSummary: [{ id: "r_end", title: "Encore Rules", text: "5-minute late limit and Screen 2 relocation." }],
    policies: {
      allowCorrections: true,
      lateToleranceMins: 5,
      checkDuplicates: true,
      allowPromoChanges: false,
      tvLoungeOpen: true,
      allowVipPasses: true,
      initialUsedSerials: ["FS-001"],
      conditionalScreenRules: []
    },
    scheduleChanges: [
      {
        type: "relocate",
        screeningId: "cosmic_voyage",
        toScreen: 2,
        statusLabel: "MOVED TO SCR 2"
      }
    ],
    midShiftNotices: [],
    casePool: ["wrong_film", "screen", "time", "date", "missing", "duplicate", "late"],
    scriptedEncounters: []
  }
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = MINIMAL_TEST_CAMPAIGN;
}
if (typeof window !== "undefined" && window.CinemaChaos && window.CinemaChaos.CampaignRegistry) {
  window.CinemaChaos.CampaignRegistry.register(MINIMAL_TEST_CAMPAIGN);
}
