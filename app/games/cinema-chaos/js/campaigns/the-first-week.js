/***************************************************************************
 * CAMPAIGN 1: THE FIRST WEEK (Seven-Day Narrative Campaign Configuration)
 ***************************************************************************/
const THE_FIRST_WEEK_CAMPAIGN = {
    schemaVersion: 1,
    id: 'the-first-week',
    title: null,
    subtitle: null,
    description: null,
    totalDays: 7,
    playableDaysCount: 7,
    unlockRequirements: { type: 'always' },
    serialPrefix: 'GC',

    languageModes: {
      elementary: {
        id: 'elementary',
        label: 'Elementary',
        available: true,
        description: null
      },
      intermediate: {
        id: 'intermediate',
        label: 'Intermediate',
        available: true,
        description: 'Natural conversation, explanations and more varied vocabulary.'
      },
      advanced: {
        id: 'advanced',
        label: 'Advanced',
        available: true,
        description: 'Natural dialogue with nuance, persuasive language and detailed workplace communication.'
      }
    },

    authorizedVips: ['VIP-770-MORRIS', 'VIP-880-PREMIERE', 'VIP-900-INSPECTOR'],
    authorizedStaff: ['STAFF-01-MAYA', 'STAFF-02-BOOTH'],
    inspectorCharacterId: 'mystery',

    printerClosedMessage: null,
    lateRuleText: null,
    vipRuleText: null,
    ageRuleText: null,

    dilemmaMessage: null,

    inspectorNotes: null,

    playerQuestions: null,


    upgradesCatalog: [
      { id: 'scanner', name: null, cost: 40, icon: '🔍', desc: null },
      { id: 'printer', name: null, cost: 45, icon: '🖨️', desc: null },
      { id: 'seating', name: null, cost: 35, icon: '🛋️', desc: null },
      { id: 'computer', name: null, cost: 50, icon: '💻', desc: null },
      { id: 'handbook', name: null, cost: 55, icon: '📘', desc: null }
    ],

    characters: {
      mr_morris: {
        id: 'mr_morris',
        name: 'Mr Morris',
        tag: null,
        isElderly: true,
        skin: '#f1c27d',
        skinColor: '#f1c27d',
        hairColor: '#cbd5e1',
        coatColor: '#475569',
        shirtColor: '#f8fafc',
        glasses: true,
        hat: true,
        moustache: true,
        wearingRed: false
      },
      sofia: {
        id: 'sofia',
        name: 'Sofia',
        tag: null,
        isElderly: false,
        skin: '#e0ac69',
        skinColor: '#e0ac69',
        hairColor: '#3b1e08',
        coatColor: '#0f766e',
        shirtColor: '#fef08a',
        glasses: true,
        hat: false,
        moustache: false,
        wearingRed: false
      },
      leo: {
        id: 'leo',
        name: 'Leo',
        tag: null,
        isElderly: false,
        skin: '#ffdbac',
        skinColor: '#ffdbac',
        hairColor: '#eab308',
        coatColor: '#dc2626',
        shirtColor: '#ffffff',
        glasses: false,
        hat: false,
        moustache: false,
        wearingRed: true
      },
      mystery: {
        id: 'mystery',
        name: 'Mystery Customer',
        tag: null,
        isElderly: false,
        skin: '#d2996c',
        skinColor: '#d2996c',
        hairColor: '#111827',
        coatColor: '#311042',
        shirtColor: '#fde047',
        glasses: true,
        hat: true,
        moustache: false,
        wearingRed: false
      },
      maya: {
        id: 'maya',
        name: 'Maya',
        tag: null,
        isElderly: false,
        skin: '#b9724d',
        skinColor: '#b9724d',
        hairColor: '#2d1b12',
        coatColor: '#556b2f',
        shirtColor: '#f5efe1',
        glasses: false,
        hat: false,
        moustache: false,
        wearingRed: false,
        staffBadge: false,
        shoulderBag: true
      },
      mr_blackwood: {
        id: 'mr_blackwood',
        name: 'Mrs Blackwood',
        tag: null,
        isElderly: false,
        skin: '#f1c27d',
        skinColor: '#f1c27d',
        hairColor: '#374151',
        coatColor: '#111827',
        shirtColor: '#fca5a5',
        glasses: true,
        hat: false,
        moustache: false,
        wearingRed: false
      }
    },

    days: {
      1: {
        dayNum: 1,
        shift: { targetCustomers: 6, durationSeconds: 480 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-12',
          dateDisplay: '12/10/2026',
          allowCorrections: false,
          checkAgeRestrictions: false,
          lateToleranceMins: null,
          checkDuplicates: false,
          allowPromoChanges: false,
          tvLoungeOpen: false,
          allowVipPasses: false,
          allowStaffPasses: false,
          conditionalScreenRules: []
        },
        scheduleChanges: [],
        casePool: ['wrong_film', 'screen', 'time', 'date', 'missing', 'hidden_ticket', 'incomplete', 'subjective'],
        midShiftNotices: [
          {
            id: 'day1_blackwood_memo',
            atMins: 1090,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'morris_day1',
            characterId: 'mr_morris',
            caseType: 'valid',
            targetScreeningId: 'happy_penguins',
            expectedAction: 'ADMIT',
            storyKey: 'morris_day1_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              why_see: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { morris_relationship: 'warm', morris_day1_outcome: 'helped' }
              },
              onMistake: { morris_relationship: 'upset', morris_day1_outcome: 'mistake' },
              dilemmaNoteByAction: {
                ADMIT: null
              }
            }
          },
          {
            id: 'sofia_day1',
            characterId: 'sofia',
            caseType: 'valid',
            targetScreeningId: 'the_last_train',
            expectedAction: 'ADMIT',
            revealsNameInOpening: true,
            introducedName: 'Sofia',
            storyKey: 'sofia_day1_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              why_see: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { sofia_trust: 'trusted', sofia_day1_outcome: 'helped' }
              },
              onMistake: { sofia_trust: 'wary', sofia_day1_outcome: 'mistake' },
              dilemmaNoteByAction: {
                ADMIT: null
              }
            }
          },
          {
            id: 'blackwood_day1',
            characterId: 'mr_blackwood',
            caseType: 'screen',
            targetScreeningId: 'laughing_bananas',
            expectedAction: 'REFUSE',
            revealsNameInOpening: true,
            introducedName: 'Mrs Blackwood',
            storyKey: 'blackwood_day1_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              are_you_sure: null
            },
            storyEffects: {
              onAction: {
                REFUSE: { blackwood_day1_outcome: 'passed_test' }
              },
              onMistake: { blackwood_day1_outcome: 'failed_test' },
              dilemmaNoteByAction: {
                REFUSE: null
              }
            }
          }
        ]
      },

      2: {
        dayNum: 2,
        shift: { targetCustomers: 8, durationSeconds: 540 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-13',
          dateDisplay: '13/10/2026',
          allowCorrections: false,
          checkAgeRestrictions: true,
          ageRuleTitle: null,
          ageRuleText: null,
          lateToleranceMins: null,
          checkDuplicates: false,
          allowPromoChanges: false,
          tvLoungeOpen: false,
          allowVipPasses: false,
          allowStaffPasses: false,
          conditionalScreenRules: []
        },
        scheduleChanges: [],
        casePool: ['underage', 'missing_id', 'refused_id', 'age_valid', 'wrong_film', 'screen', 'time', 'date', 'missing'],
        midShiftNotices: [
          {
            id: 'day2_age_notice',
            atMins: 1092,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'leo_day2',
            characterId: 'leo',
            caseType: 'missing_id',
            targetScreeningId: 'the_dark_house',
            expectedAction: 'REFUSE',
            claimedAge: 16,
            trueAge: 14,
            allowAgeCorrection: false,
            requiresAgeCheck: true,
            idCard: {
              exists: false,
              presented: false,
              reason: null
            },
            questionEffects: {
              ask_age: { evidence: ['age_claimed'] },
              ask_id: { evidence: ['id_missing'], setStory: { leo_missing_id_spotted: 'yes' } }
            },
            storyKey: 'leo_day2_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementTemplate: null,
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null,
              why_see: null
            },
            storyEffects: {
              onAction: {
                REFUSE: { leo_day2_outcome: 'refused' }
              },
              onMistake: { leo_day2_outcome: 'mistake' },
              onMistakeByAction: { ADMIT: { leo_day2_outcome: 'admitted' } },
              incrementOnAction: {
                REFUSE: { leo_caught_count: 1 }
              },
              incrementOnMistakeByAction: { ADMIT: { leo_admitted_underage: 1 } },
              dilemmaNoteByAction: {
                REFUSE: null
              },
              dilemmaNoteOnMistake: null
            }
          },
          {
            id: 'adult_horror_day2',
            caseType: 'age_valid',
            targetScreeningId: 'the_dark_house',
            expectedAction: 'ADMIT',
            claimedAge: 32,
            trueAge: 32,
            idCard: {
              exists: true,
              presented: false,
              holderName: 'Elena',
              dob: '13/10/1994',
              issueDate: '10/04/2023',
              expiryDate: '10/04/2028',
              docNumber: 'CID-941013',
              issuingAuthority: 'City Civil Registry'
            },
            personOverrides: {
              name: 'Elena',
              tag: null,
              glasses: true,
              hat: 'none'
            },
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            statementTemplate: null,
            qaOverrides: {
              ask_age: null,
              ask_id: null
            }
          },
          {
            id: 'birthday_teen_day2',
            caseType: 'age_valid',
            targetScreeningId: 'planet_x',
            expectedAction: 'ADMIT',
            claimedAge: 12,
            trueAge: 12,
            idCard: {
              exists: true,
              presented: false,
              holderName: 'Sam',
              dob: '13/10/2014',
              issueDate: '15/09/2025',
              expiryDate: '15/09/2028',
              docNumber: 'STU-141013',
              issuingAuthority: 'Grandview Schools'
            },
            personOverrides: {
              name: 'Sam',
              tag: null,
              hat: 'cap'
            },
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementTemplate: null,
            qaOverrides: {
              ask_age: null,
              ask_id: null
            }
          }
        ]
      },

      3: {
        dayNum: 3,
        shift: { targetCustomers: 9, durationSeconds: 540 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-14',
          dateDisplay: '14/10/2026',
          allowCorrections: true,
          checkAgeRestrictions: true,
          ageRuleTitle: null,
          ageRuleText: null,
          lateToleranceMins: null,
          checkDuplicates: false,
          allowPromoChanges: true,
          tvLoungeOpen: false,
          allowVipPasses: false,
          allowStaffPasses: false,
          conditionalScreenRules: []
        },
        scheduleChanges: [
          {
            type: 'relocate',
            screeningId: 'planet_x',
            toScreen: 1,
            statusLabel: null
          }
        ],
        casePool: ['move', 'screen', 'wrong_film', 'incomplete', 'underage', 'missing_id', 'age_valid', 'time', 'date'],
        midShiftNotices: [
          {
            id: 'day3_projector_notice',
            atMins: 1090,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'morris_day3',
            characterId: 'mr_morris',
            caseType: 'move',
            targetScreeningId: 'planet_x',
            expectedAction: 'CORRECT',
            revealsNameInOpening: true,
            introducedName: 'Mr Morris',
            storyKey: 'morris_day3_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementByStory: [
              {
                condition: { key: 'morris_day1_outcome', value: 'helped' },
                text: null
              },
              {
                condition: { key: 'morris_day1_outcome', value: 'mistake' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              which_film: null,
              alternative: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { morris_relationship: 'loyal', morris_day3_outcome: 'helped', known_char_mr_morris: 'yes' }
              },
              onMistake: { morris_relationship: 'cold', morris_day3_outcome: 'mistake' },
              dilemmaNoteByAction: {
                CORRECT: null
              },
              dilemmaNoteOnMistake: null
            },
            customFeedback: {
              CORRECT: null
            }
          },
          {
            id: 'maya_day3',
            characterId: 'maya',
            caseType: 'screen',
            targetScreeningId: 'wild_world',
            expectedAction: 'CORRECT',
            revealsNameInOpening: true,
            introducedName: 'Maya',
            storyKey: 'maya_day3_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            ticketOverrides: {
              screen: 3
            },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              are_you_sure: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { maya_relationship: 'helped', maya_day3_outcome: 'helped', known_char_maya: 'yes' }
              },
              onMistake: { maya_relationship: 'blamed', maya_day3_outcome: 'mistake' },
              dilemmaNoteByAction: {
                CORRECT: null
              },
              dilemmaNoteOnMistake: null
            },
            customFeedback: {
              CORRECT: null
            }
          },
          {
            id: 'leo_day3',
            characterId: 'leo',
            caseType: 'disguise',
            targetScreeningId: 'the_dark_house',
            expectedAction: 'REFUSE',
            claimedAge: 24,
            trueAge: 14,
            allowAgeCorrection: false,
            concealIdentity: true,
            requiresAgeCheck: true,
            personTagOverride: null,
            personOverrides: {
              fakeBeard: true,
              obviousDisguise: true,
              disguiseIssueText: null
            },
            idCard: {
              exists: true,
              presented: false,
              holderName: 'Leo',
              dob: '30/02/2012',
              issueDate: '01/04/2025',
              expiryDate: '01/04/2030',
              docNumber: 'TH-3002',
              issuingAuthority: 'Town Hall'
            },
            questionEffects: {
              ask_age: { evidence: ['age_claimed'] },
              ask_id: { evidence: ['id_presented'] }
            },
            storyKey: 'leo_day3_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementByStory: [
              {
                condition: { key: 'leo_day2_outcome', value: 'refused' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null
            },
            storyEffects: {
              onEvidence: {
                age_id_contradiction: { leo_contradiction_spotted: 'yes' }
              },
              onAction: {
                REFUSE: { leo_day3_outcome: 'refused', leo_beard_detected: 'yes' }
              },
              onMistake: { leo_day3_outcome: 'mistake', leo_beard_detected: 'no' },
              onMistakeByAction: { ADMIT: { leo_day3_outcome: 'admitted' } },
              incrementOnAction: {
                REFUSE: { leo_caught_count: 1 }
              },
              incrementOnMistakeByAction: { ADMIT: { leo_admitted_underage: 1 } },
              dilemmaNoteByAction: {
                REFUSE: null
              }
            }
          }
        ]
      },

      4: {
        dayNum: 4,
        shift: { targetCustomers: 10, durationSeconds: 540 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-15',
          dateDisplay: '15/10/2026',
          allowCorrections: true,
          checkAgeRestrictions: true,
          ageRuleTitle: null,
          ageRuleText: null,
          lateToleranceMins: 10,
          lateRuleTitle: null,
          lateRuleText: null,
          checkDuplicates: true,
          initialUsedSerials: ['GC-4-102', 'GC-4-109', 'GC-4-115'],
          allowPromoChanges: false,
          tvLoungeOpen: false,
          allowVipPasses: false,
          allowStaffPasses: false,
          conditionalScreenRules: []
        },
        scheduleChanges: [],
        casePool: ['duplicate', 'promo', 'late', 'false_identity', 'underage', 'screen', 'wrong_film', 'age_valid', 'incomplete'],
        midShiftNotices: [
          {
            id: 'day4_fraud_notice',
            atMins: 1092,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'sofia_day4',
            characterId: 'sofia',
            caseType: 'screen',
            targetScreeningId: 'love_in_paris',
            expectedAction: 'CORRECT',
            revealsNameInOpening: true,
            introducedName: 'Sofia',
            extraQuestions: [
              ['what_did_you_see', null]
            ],
            questionEffects: {
              ask_receipts: { revealStatement: null, evidence: ['receipts_requested'], setStory: { sofia_receipts_requested: 'yes' } },
              what_did_you_see: {
                setStory: { sofia_whistleblower_clue: 'yes' },
                evidence: ['sofia_clue'],
                unlockQuestions: [['ask_receipts', null]]
              }
            },
            storyKey: 'sofia_day4_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementByStory: [
              {
                condition: { key: 'sofia_day1_outcome', value: 'helped' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              which_film: null,
              why_see: null,
              what_did_you_see: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { sofia_trust: 'ally', sofia_day4_outcome: 'helped' }
              },
              onEvidence: {
                sofia_clue: { sofia_whistleblower_clue: 'yes' }
              },
              onMistake: { sofia_trust: 'distant', sofia_day4_outcome: 'mistake' },
              dilemmaNoteByAction: {
                CORRECT: null
              }
            }
          },
          {
            id: 'leo_day4',
            characterId: 'leo',
            caseType: 'false_identity',
            targetScreeningId: 'the_dark_house',
            expectedAction: 'REFUSE',
            claimedAge: 40,
            trueAge: 14,
            allowAgeCorrection: false,
            concealIdentity: true,
            requiresAgeCheck: true,
            introducedName: 'Mr Leonardo Smith',
            personTagOverride: null,
            personOverrides: {
              oversizedSuit: true,
              sunglasses: true
            },
            ticketOverrides: {
              holderName: 'Leo'
            },
            idCard: {
              exists: true,
              presented: false,
              holderName: 'Leonardo Senior',
              dob: '20/11/1985',
              issueDate: '12/03/2022',
              expiryDate: '12/03/2027',
              docNumber: 'CID-851120',
              issuingAuthority: 'City Civil Registry',
              photoMismatch: true,
              portraitPerson: { skinColor: '#f1c27d', hairColor: '#cbd5e1', coatColor: '#334155', shirtColor: '#ffffff', isElderly: true, glasses: true, genderPresentation: 'male' },
              photoMismatchText: null
            },
            questionEffects: {
              ask_age: { evidence: ['age_claimed'] },
              ask_id: { evidence: ['id_presented'] }
            },
            storyKey: 'leo_day4_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            statementByStory: [
              {
                condition: { key: 'leo_beard_detected', value: 'yes' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null
            },
            storyEffects: {
              onEvidence: {
                age_id_contradiction: { leo_contradiction_spotted: 'yes' }
              },
              onAction: {
                REFUSE: { leo_day4_outcome: 'refused' }
              },
              onMistake: { leo_day4_outcome: 'mistake' },
              onMistakeByAction: { ADMIT: { leo_day4_outcome: 'admitted' } },
              incrementOnAction: {
                REFUSE: { leo_caught_count: 1 }
              },
              incrementOnMistakeByAction: { ADMIT: { leo_admitted_underage: 1 } },
              dilemmaNoteByAction: {
                REFUSE: null
              }
            }
          },
          {
            id: 'mystery_day4',
            characterId: 'mystery',
            caseType: 'valid',
            targetScreeningId: 'the_last_train',
            expectedAction: 'ADMIT',
            claimedAge: 44,
            trueAge: 44,
            idCard: {
              exists: true,
              presented: false,
              holderName: 'V. Vance',
              dob: '14/05/1982',
              issueDate: '01/02/2023',
              expiryDate: '01/02/2028',
              docNumber: 'CID-820514',
              issuingAuthority: 'City Civil Registry'
            },
            personOverrides: {
              name: 'V. Vance'
            },
            storyKey: 'inspector_day4_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementTemplate: null,
            qaOverrides: {
              ask_age: null,
              ask_id: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { inspector_day4_outcome: 'helped' }
              },
              onMistake: { inspector_day4_outcome: 'mistake' }
            }
          },
          {
            id: 'maya_day4_helped',
            encounterGroup: 'maya_day4_group',
            characterId: 'maya',
            caseType: 'valid',
            targetScreeningId: 'happy_penguins',
            expectedAction: 'ADMIT',
            revealsNameInOpening: true,
            introducedName: 'Maya',
            storyKey: 'maya_day4_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: {
              minCaseIndex: 3,
              requireStoryValue: { key: 'maya_relationship', value: 'helped' }
            },
            statementTemplate: null,
            extraQuestions: [['ask_observer', null]],
            questionEffects: {
              ask_observer: { revealStatement: null, evidence: ['observer_tip'], setStory: { maya_inspector_tip: 'yes' } }
            },
            qaOverrides: {
              which_film: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { maya_day4_outcome: 'helped' }
              }
            }
          },
          {
            id: 'maya_day4_blamed',
            encounterGroup: 'maya_day4_group',
            characterId: 'maya',
            caseType: 'incomplete',
            targetScreeningId: 'happy_penguins',
            expectedAction: 'CORRECT',
            requiredQuestion: true,
            revealsNameInOpening: true,
            introducedName: 'Maya',
            storyKey: 'maya_day4_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 3 },
            statementByStory: [
              {
                condition: { key: 'maya_relationship', value: 'blamed' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              which_film: null,
              alternative: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { maya_relationship: 'helped', maya_day4_outcome: 'helped' }
              }
            }
          },
          {
            id: 'dilemma_late_day4',
            characterId: 'mr_morris',
            caseType: 'dilemma_late',
            targetScreeningId: 'happy_penguins',
            advanceClockToMins: 1108,
            dilemma: true,
            requiredQuestion: true,
            discretionaryIssueCode: 'late',
            storyKey: 'morris_day4_late',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: {
              minCaseIndex: 4,
              requireLateScreeningId: 'happy_penguins'
            },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              alternative: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { morris_late_exception: 'kind', morris_relationship: 'loyal', people_champion_path: 'yes' },
                REFUSE: { morris_late_exception: 'refused' }
              },
              dilemmaNoteByAction: {
                ADMIT: null,
                REFUSE: null
              }
            }
          }
        ]
      },

      5: {
        dayNum: 5,
        shift: { targetCustomers: 10, durationSeconds: 480 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-16',
          dateDisplay: '16/10/2026',
          allowCorrections: true,
          checkAgeRestrictions: true,
          ageRuleTitle: null,
          ageRuleText: null,
          lateToleranceMins: 10,
          checkDuplicates: true,
          initialUsedSerials: ['GC-5-204', 'GC-5-211', 'GC-5-219'],
          allowPromoChanges: false,
          tvLoungeOpen: false,
          allowVipPasses: true,
          allowStaffPasses: false,
          conditionalScreenRules: []
        },
        scheduleChanges: [
          {
            type: 'cancel',
            screeningId: 'love_in_paris',
            statusLabel: null
          },
          {
            type: 'add_extra',
            sourceScreeningId: 'happy_penguins',
            newId: 'happy_penguins_late',
            screen: 2,
            time: '19:15',
            timeMins: 1155,
            statusLabel: null
          }
        ],
        casePool: ['cancelled', 'duplicate', 'promo', 'fake_id', 'underage', 'screen', 'wrong_film', 'age_valid', 'late'],
        midShiftNotices: [
          {
            id: 'day5_vip_notice',
            atMins: 1090,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'blackwood_day5',
            characterId: 'mr_blackwood',
            caseType: 'manager_pressure',
            targetScreeningId: 'the_dark_house',
            vipSerial: 'VIP-000-CASH',
            managerDirective: true,
            managerBonusCash: 5,
            managerComplyRepDelta: -3,
            managerRefuseRepDelta: 4,
            expectedAction: 'REFUSE',
            revealsNameInOpening: true,
            introducedName: 'Mrs Blackwood',
            extraQuestions: [
              ['challenge_vip', null]
            ],
            questionEffects: {
              challenge_vip: {
                setStory: { blackwood_questioned: 'yes', whistleblower_identified: 'yes' },
                evidence: ['vip_challenged']
              }
            },
            storyKey: 'blackwood_day5_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              are_you_sure: null,
              challenge_vip: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { blackwood_day5_outcome: 'complied' },
                REFUSE: { blackwood_day5_outcome: 'refused' }
              },
              dilemmaNoteByAction: {
                ADMIT: null,
                REFUSE: null
              }
            },
            customFeedback: {
              ADMIT: null,
              REFUSE: null
            }
          },
          {
            id: 'leo_day5',
            characterId: 'leo',
            caseType: 'fake_id',
            targetScreeningId: 'the_dark_house',
            expectedAction: 'REFUSE',
            claimedAge: 17,
            trueAge: 14,
            allowAgeCorrection: false,
            concealIdentity: true,
            requiresAgeCheck: true,
            personTagOverride: null,
            personOverrides: {
              editedMoustache: true
            },
            idCard: {
              exists: true,
              presented: false,
              holderName: 'Leo',
              dob: '10/09/2012',
              issueDate: '20/10/2026',
              expiryDate: '10/10/2025',
              docNumber: 'SCH-2012-99',
              issuingAuthority: 'School Print Club',
              photoAltered: true,
              photoMismatchText: null
            },
            questionEffects: {
              ask_age: { evidence: ['age_claimed'] },
              ask_id: { evidence: ['id_presented'] }
            },
            storyKey: 'leo_day5_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            statementTemplate: null,
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null
            },
            storyEffects: {
              onEvidence: {
                age_id_contradiction: { leo_contradiction_spotted: 'yes' }
              },
              onAction: {
                REFUSE: { leo_day5_outcome: 'refused' }
              },
              onMistake: { leo_day5_outcome: 'mistake' },
              onMistakeByAction: { ADMIT: { leo_day5_outcome: 'admitted' } },
              incrementOnAction: {
                REFUSE: { leo_caught_count: 1 }
              },
              incrementOnMistakeByAction: { ADMIT: { leo_admitted_underage: 1 } },
              dilemmaNoteByAction: {
                REFUSE: null
              }
            }
          },
          {
            id: 'mystery_day5',
            characterId: 'mystery',
            caseType: 'vip',
            targetScreeningId: 'planet_x',
            vipSerial: 'VIP-900-INSPECTOR',
            expectedAction: 'ADMIT',
            claimedAge: 44,
            trueAge: 44,
            idCard: {
              exists: true,
              presented: false,
              holderName: 'V. Vance',
              dob: '14/05/1982',
              issueDate: '01/02/2023',
              expiryDate: '01/02/2028',
              docNumber: 'CID-820514',
              issuingAuthority: 'City Civil Registry'
            },
            personOverrides: {
              name: 'V. Vance'
            },
            storyKey: 'inspector_day5_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementTemplate: null,
            qaOverrides: {
              ask_id: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { inspector_day5_outcome: 'helped' }
              },
              onMistake: { inspector_day5_outcome: 'mistake' }
            }
          }
        ]
      },

      6: {
        dayNum: 6,
        shift: { targetCustomers: 12, durationSeconds: 480 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-17',
          dateDisplay: '17/10/2026',
          allowCorrections: true,
          checkAgeRestrictions: true,
          ageRuleTitle: null,
          ageRuleText: null,
          lateToleranceMins: 10,
          checkDuplicates: true,
          initialUsedSerials: ['GC-6-301', 'GC-6-308', 'GC-6-315'],
          allowPromoChanges: false,
          tvLoungeOpen: false,
          allowVipPasses: true,
          allowStaffPasses: true,
          conditionalScreenRules: []
        },
        capacityOverrides: {
          planet_x: 2
        },
        storyScheduleBoosts: [
          {
            screeningId: 'planet_x',
            capacityDelta: 4,
            requireStoryKey: 'maya_relationship',
            requireStoryValue: 'helped',
            statusLabel: 'EXTRA ROW OPEN'
          }
        ],
        scheduleChanges: [],
        casePool: ['group', 'duplicate', 'promo', 'fake_id', 'false_identity', 'underage', 'combined', 'screen', 'wrong_film', 'age_valid'],
        midShiftNotices: [
          {
            id: 'day6_premiere_notice',
            atMins: 1090,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'morris_day6_loyal',
            encounterGroup: 'morris_day6_group',
            characterId: 'mr_morris',
            caseType: 'valid',
            targetScreeningId: 'wild_world',
            groupSize: 3,
            ticketSeats: 3,
            expectedAction: 'ADMIT',
            revealsNameInOpening: true,
            introducedName: 'Mr Morris',
            storyKey: 'morris_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: {
              minCaseIndex: 0,
              requireStoryValue: { key: 'morris_relationship', value: 'loyal' }
            },
            statementTemplate: null,
            qaOverrides: {
              how_many: null,
              which_film: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { morris_day6_outcome: 'helped', morris_commendation: 'yes' }
              },
              dilemmaNoteByAction: {
                ADMIT: null
              }
            }
          },
          {
            id: 'morris_day6_standard',
            encounterGroup: 'morris_day6_group',
            characterId: 'mr_morris',
            caseType: 'screen',
            targetScreeningId: 'wild_world',
            groupSize: 3,
            ticketSeats: 3,
            requiredQuestion: true,
            expectedAction: 'CORRECT',
            storyKey: 'morris_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              how_many: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { morris_day6_outcome: 'helped', morris_relationship: 'loyal' }
              }
            }
          },
          {
            id: 'maya_day6_helped',
            encounterGroup: 'maya_day6_group',
            characterId: 'maya',
            caseType: 'overbooked_group',
            targetScreeningId: 'planet_x',
            groupSize: 3,
            ticketSeats: 1,
            expectedAction: 'CORRECT',
            revealsNameInOpening: true,
            introducedName: 'Maya',
            storyKey: 'maya_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: {
              minCaseIndex: 1,
              requireStoryValue: { key: 'maya_relationship', value: 'helped' }
            },
            statementTemplate: null,
            extraQuestions: [['ask_balcony', null]],
            questionEffects: {
              ask_balcony: { revealStatement: null, evidence: ['balcony_open'] }
            },
            qaOverrides: {
              how_many: null,
              which_film: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { maya_day6_outcome: 'helped', maya_balcony_saved: 'yes' }
              },
              dilemmaNoteByAction: {
                CORRECT: null
              }
            }
          },
          {
            id: 'maya_day6_unhelped',
            encounterGroup: 'maya_day6_group',
            characterId: 'maya',
            caseType: 'overbooked_group',
            targetScreeningId: 'planet_x',
            groupSize: 3,
            ticketSeats: 1,
            expectedAction: 'REFUSE',
            revealsNameInOpening: true,
            introducedName: 'Maya',
            storyKey: 'maya_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            statementTemplate: null,
            qaOverrides: {
              how_many: null,
              alternative: null
            },
            storyEffects: {
              onAction: {
                REFUSE: { maya_day6_outcome: 'refused_group' }
              },
              dilemmaNoteByAction: {
                REFUSE: null
              }
            }
          },
          {
            id: 'leo_day6',
            characterId: 'leo',
            caseType: 'staff_impostor',
            targetScreeningId: 'the_dark_house',
            expectedAction: 'REFUSE',
            claimedAge: 19,
            trueAge: 14,
            allowAgeCorrection: false,
            concealIdentity: true,
            requiresAgeCheck: true,
            personTagOverride: null,
            personOverrides: {
              staffHat: true,
              staffBadge: true,
              obviousDisguise: true,
              disguiseIssueText: null
            },
            ticketOverrides: {
              ticketType: 'STAFF PASS',
              serial: 'STAFF-99-LEO'
            },
            idCard: {
              exists: false,
              presented: false,
              reason: null
            },
            questionEffects: {
              ask_age: { evidence: ['age_claimed'] },
              ask_id: { evidence: ['id_missing'] }
            },
            storyKey: 'leo_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementTemplate: null,
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null
            },
            storyEffects: {
              onEvidence: {
                age_id_contradiction: { leo_contradiction_spotted: 'yes' }
              },
              onAction: {
                REFUSE: { leo_day6_outcome: 'refused' }
              },
              onMistake: { leo_day6_outcome: 'mistake' },
              onMistakeByAction: { ADMIT: { leo_day6_outcome: 'admitted' } },
              incrementOnAction: {
                REFUSE: { leo_caught_count: 1 }
              },
              incrementOnMistakeByAction: { ADMIT: { leo_admitted_underage: 1 } },
              dilemmaNoteByAction: {
                REFUSE: null
              }
            }
          },
          {
            id: 'sofia_day6_ally',
            encounterGroup: 'sofia_day6_group',
            characterId: 'sofia',
            caseType: 'valid',
            targetScreeningId: 'the_last_train',
            expectedAction: 'ADMIT',
            revealsNameInOpening: true,
            introducedName: 'Sofia',
            extraQuestions: [
              ['what_did_you_see', null]
            ],
            questionEffects: {
              what_did_you_see: {
                setStory: { sofia_evidence: 'yes', whistleblower_identified: 'yes' },
                evidence: ['sofia_vip_evidence']
              }
            },
            storyKey: 'sofia_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: {
              minCaseIndex: 3,
              requireStoryValue: { key: 'sofia_trust', value: 'ally' }
            },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              why_see: null,
              what_did_you_see: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { sofia_day6_outcome: 'helped' }
              },
              onEvidence: {
                sofia_vip_evidence: { sofia_evidence: 'yes', whistleblower_identified: 'yes' }
              },
              noteByEvidence: { sofia_vip_evidence: null },
              dilemmaNoteByAction: {
                ADMIT: null
              }
            }
          },
          {
            id: 'sofia_day6_standard',
            encounterGroup: 'sofia_day6_group',
            characterId: 'sofia',
            caseType: 'wrong_film',
            targetScreeningId: 'the_last_train',
            wrongFilmTicket: true,
            requiredQuestion: true,
            intentGenres: ['thriller'],
            expectedAction: 'CORRECT',
            revealsNameInOpening: true,
            introducedName: 'Sofia',
            extraQuestions: [
              ['what_did_you_see', null]
            ],
            questionEffects: {
              what_did_you_see: {
                setStory: { sofia_evidence: 'yes', whistleblower_identified: 'yes' },
                evidence: ['sofia_vip_evidence']
              }
            },
            storyKey: 'sofia_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 3 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              alternative: null,
              what_did_you_see: null
            },
            storyEffects: {
              onAction: {
                CORRECT: { sofia_day6_outcome: 'helped' }
              },
              onEvidence: {
                sofia_vip_evidence: { sofia_evidence: 'yes', whistleblower_identified: 'yes' }
              }
            }
          },
          {
            id: 'blackwood_day6',
            characterId: 'mr_blackwood',
            caseType: 'manager_pressure',
            targetScreeningId: 'the_last_train',
            vipSerial: 'VIP-000-PREMIERE',
            managerDirective: true,
            managerBonusCash: 5,
            managerComplyRepDelta: -3,
            managerRefuseRepDelta: 4,
            expectedAction: 'REFUSE',
            revealsNameInOpening: true,
            introducedName: 'Mrs Blackwood',
            extraQuestions: [
              ['challenge_vip', null]
            ],
            questionEffects: {
              challenge_vip: {
                setStory: { blackwood_questioned: 'yes', whistleblower_identified: 'yes' },
                evidence: ['vip_challenged']
              }
            },
            storyKey: 'blackwood_day6_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 4 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              are_you_sure: null,
              challenge_vip: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { blackwood_day6_outcome: 'complied' },
                REFUSE: { blackwood_day6_outcome: 'refused' }
              },
              dilemmaNoteByAction: {
                ADMIT: null,
                REFUSE: null
              }
            }
          }
        ]
      },

      7: {
        dayNum: 7,
        shift: { targetCustomers: 11, durationSeconds: 450 },
        dayName: null,
        title: null,
        briefingMemo: null,
        policies: {
          currentDate: '2026-10-18',
          dateDisplay: '18/10/2026',
          allowCorrections: true,
          checkAgeRestrictions: true,
          ageRuleTitle: null,
          ageRuleText: null,
          lateToleranceMins: 10,
          checkDuplicates: true,
          initialUsedSerials: ['GC-7-104', 'GC-7-112', 'GC-7-118'],
          allowPromoChanges: false,
          tvLoungeOpen: false,
          allowVipPasses: true,
          allowStaffPasses: true,
          conditionalScreenRules: []
        },
        scheduleChanges: [
          {
            type: 'relocate',
            screeningId: 'planet_x',
            toScreen: 1,
            statusLabel: null
          },
          {
            type: 'cancel',
            screeningId: 'love_in_paris',
            statusLabel: null
          },
          {
            type: 'add_extra',
            sourceScreeningId: 'happy_penguins',
            newId: 'happy_penguins_late',
            screen: 2,
            time: '19:15',
            timeMins: 1155,
            statusLabel: null
          }
        ],
        casePool: ['move', 'cancelled', 'duplicate', 'promo', 'fake_id', 'false_identity', 'underage', 'group', 'combined', 'screen', 'wrong_film', 'age_valid'],
        midShiftNotices: [
          {
            id: 'day7_audit_notice',
            atMins: 1090,
            text: null
          }
        ],
        scriptedEncounters: [
          {
            id: 'leo_day7',
            characterId: 'leo',
            caseType: 'valid',
            targetScreeningId: 'laughing_bananas',
            expectedAction: 'ADMIT',
            claimedAge: 14,
            trueAge: 14,
            revealsNameInOpening: true,
            introducedName: 'Leo',
            personTagOverride: null,
            personOverrides: {
              fakeBeard: false,
              oversizedSuit: false,
              sunglasses: false,
              editedMoustache: false,
              staffHat: false,
              staffBadge: false,
              obviousDisguise: false,
              portraitVariant: 'innocent'
            },
            idCard: {
              exists: true,
              presented: false,
              holderName: 'Leo',
              dob: '10/09/2012',
              issueDate: '01/09/2025',
              expiryDate: '01/09/2028',
              docNumber: 'STU-120910',
              issuingAuthority: 'Grandview High School'
            },
            storyKey: 'leo_day7_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 0 },
            statementByStory: [
              {
                condition: { key: 'leo_day2_outcome', value: 'refused' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null,
              why_see: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { leo_day7_outcome: 'helped' }
              },
              onMistake: { leo_day7_outcome: 'refused_honest' },
              dilemmaNoteByAction: {
                ADMIT: null
              },
              dilemmaNoteOnMistake: null
            },
            customFeedback: {
              ADMIT: null
            }
          },
          {
            id: 'morris_day7',
            characterId: 'mr_morris',
            caseType: 'valid',
            targetScreeningId: 'happy_penguins',
            expectedAction: 'ADMIT',
            revealsNameInOpening: true,
            introducedName: 'Mr Morris',
            storyKey: 'morris_day7_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 1 },
            statementByStory: [
              {
                condition: { key: 'morris_relationship', value: 'loyal' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              which_film: null,
              why_see: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { morris_day7_outcome: 'helped' }
              },
              dilemmaNoteByAction: {
                ADMIT: null
              }
            }
          },
          {
            id: 'blackwood_day7',
            characterId: 'mr_blackwood',
            caseType: 'manager_pressure',
            targetScreeningId: 'the_dark_house',
            vipSerial: 'VIP-000-AUDIT',
            managerDirective: true,
            managerBonusCash: 5,
            managerComplyRepDelta: -4,
            managerRefuseRepDelta: 5,
            expectedAction: 'REFUSE',
            revealsNameInOpening: true,
            introducedName: 'Mrs Blackwood',
            extraQuestions: [
              ['challenge_vip', null]
            ],
            questionEffects: {
              challenge_vip: {
                setStory: { blackwood_questioned: 'yes', whistleblower_identified: 'yes' },
                evidence: ['vip_challenged']
              }
            },
            storyKey: 'blackwood_day7_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 2 },
            statementTemplate: null,
            qaOverrides: {
              which_film: null,
              are_you_sure: null,
              challenge_vip: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { blackwood_day7_outcome: 'complied' },
                REFUSE: { blackwood_day7_outcome: 'refused' }
              },
              dilemmaNoteByAction: {
                ADMIT: null,
                REFUSE: null
              }
            }
          },
          {
            id: 'mystery_day7',
            characterId: 'mystery',
            caseType: 'vip',
            targetScreeningId: 'the_dark_house',
            vipSerial: 'VIP-900-INSPECTOR',
            expectedAction: 'ADMIT',
            claimedAge: 44,
            trueAge: 44,
            revealsNameInOpening: true,
            introducedName: 'Corporate Inspector',
            identityTitle: true,
            extraQuestions: [{ key: 'report_vip', label: null, condition: { anyOf: [{ key: 'sofia_evidence', value: 'yes' }, { key: 'blackwood_questioned', value: 'yes' }] } }],
            questionEffects: {
              report_vip: {
                condition: { anyOf: [{ key: 'sofia_evidence', value: 'yes' }, { key: 'blackwood_questioned', value: 'yes' }] },
                revealStatement: null,
                evidence: ['vip_reported'], setStory: { vip_reported: 'yes' }
              }
            },
            personTagOverride: null,
            idCard: {
              exists: true,
              presented: false,
              holderName: 'V. Vance',
              dob: '14/05/1982',
              issueDate: '01/02/2023',
              expiryDate: '01/02/2028',
              docNumber: 'AUD-9001',
              issuingAuthority: 'Head Office Audit Board'
            },
            personOverrides: {
              name: 'V. Vance'
            },
            storyKey: 'inspector_day7_outcome',
            oncePerShift: true,
            guaranteed: true,
            preventQueueWalkout: true,
            trigger: { minCaseIndex: 3 },
            statementByStory: [
              {
                condition: { key: 'sofia_evidence', value: 'yes' },
                text: null
              },
              {
                condition: { key: 'morris_commendation', value: 'yes' },
                text: null
              },
              {
                text: null
              }
            ],
            qaOverrides: {
              ask_age: null,
              ask_id: null,
              which_film: null
            },
            storyEffects: {
              onAction: {
                ADMIT: { inspector_day7_outcome: 'helped' }
              },
              onMistake: { inspector_day7_outcome: 'mistake' },
              dilemmaNoteByAction: {
                ADMIT: null
              }
            }
          }
        ]
      }
    },

    endlessDay: {
      dayNum: 8,
      shift: { targetCustomers: 12, durationSeconds: 480 },
      dayName: null,
      title: null,
      briefingMemo: null,
      policies: {
        currentDate: '2026-10-19',
        dateDisplay: '19/10/2026',
        allowCorrections: true,
        checkAgeRestrictions: true,
        lateToleranceMins: 10,
        checkDuplicates: true,
        initialUsedSerials: ['GC-8-104', 'GC-8-112', 'GC-8-118'],
        allowPromoChanges: false,
        tvLoungeOpen: false,
        allowVipPasses: true,
        allowStaffPasses: true,
        conditionalScreenRules: []
      },
      scheduleChanges: [
        {
          type: 'relocate',
          screeningId: 'planet_x',
          toScreen: 1,
          statusLabel: null
        },
        {
          type: 'cancel',
          screeningId: 'love_in_paris',
          statusLabel: null
        },
        {
          type: 'add_extra',
          sourceScreeningId: 'happy_penguins',
          newId: 'happy_penguins_late',
          screen: 2,
          time: '19:15',
          timeMins: 1155,
          statusLabel: null
        }
      ],
      casePool: [
        'wrong_film', 'screen', 'time', 'date', 'missing', 'hidden_ticket',
        'incomplete', 'late', 'move', 'duplicate', 'promo', 'group',
        'cancelled', 'combined', 'underage', 'missing_id', 'refused_id', 'fake_id',
        'expired_id', 'false_identity', 'disguise', 'staff_impostor', 'age_valid'
      ],
      midShiftNotices: [],
      scriptedEncounters: []
    },

    endings: [
      {
        id: 'youre_fired',
        title: null,
        badge: null,
        summary: null,
        managerQuote: null,
        inspectorQuote: null,
        conditions: {
          anyOf: [
            { requireDismissed: true },
            { maxReputation: 44 },
            { storyMin: { total_mistakes: 6 } },
            { storyMin: { inspection_violations: 3 }, storyMax: { manager_compliance: 1 } }
          ]
        }
      },
      {
        id: 'the_whistleblower',
        title: null,
        badge: null,
        summary: null,
        managerQuote: null,
        inspectorQuote: null,
        conditions: {
          forbidDismissed: true,
          storyMin: { manager_conflict: 2 },
          storyMax: { manager_compliance: 0 },
          storyEquals: { vip_reported: 'yes', inspector_day7_outcome: 'helped' },
          anyOf: [
            { storyEquals: { blackwood_questioned: 'yes' } },
            { storyEquals: { sofia_evidence: 'yes' } }
          ]
        }
      },
      {
        id: 'management_material',
        title: null,
        badge: null,
        summary: null,
        managerQuote: null,
        inspectorQuote: null,
        conditions: {
          forbidDismissed: true,
          storyMin: { manager_compliance: 2 }
        }
      },
      {
        id: 'peoples_champion',
        title: null,
        badge: null,
        summary: null,
        managerQuote: null,
        inspectorQuote: null,
        conditions: {
          forbidDismissed: true,
          storyEquals: {
            morris_day3_outcome: 'helped',
            morris_day6_outcome: 'helped',
            maya_day3_outcome: 'helped',
            maya_day6_outcome: 'helped',
            maya_relationship: 'helped',
            leo_day7_outcome: 'helped'
          },
          anyOf: [
            { storyMin: { total_exceptions: 1 } },
            { storyEquals: { people_champion_path: 'yes' } }
          ]
        }
      },
      {
        id: 'employee_of_the_week',
        title: null,
        badge: null,
        summary: null,
        managerQuote: null,
        inspectorQuote: null,
        conditions: {
          forbidDismissed: true,
          minReputation: 75,
          storyMax: {
            manager_compliance: 0,
            total_mistakes: 0,
            total_exceptions: 0,
            leo_admitted_underage: 0,
            inspection_violations: 0
          }
        }
      },
      {
        id: 'probation_passed',
        title: null,
        badge: null,
        summary: null,
        managerQuote: null,
        inspectorQuote: null,
        conditions: {
          forbidDismissed: true
        }
      }
    ],

    endingCallbacks: [
      {
        characterName: 'Mr Morris',
        role: null,
        conditions: {
          storyEquals: {
            morris_day3_outcome: 'helped',
            morris_day6_outcome: 'helped'
          }
        },
        text: null
      },
      {
        characterName: 'Mr Morris',
        role: null,
        conditions: {
          storyEquals: {
            morris_day3_outcome: 'helped',
            morris_day6_outcome: 'mistake'
          }
        },
        text: null
      },
      {
        characterName: 'Mr Morris',
        role: null,
        conditions: { storyEquals: { morris_relationship: ['upset', 'cold'] } },
        text: null
      },
      {
        characterName: 'Leo',
        role: null,
        conditions: {
          storyEquals: { leo_day7_outcome: 'helped' },
          storyMin: { leo_caught_count: 1 }
        },
        text: null
      },
      {
        characterName: 'Leo',
        role: null,
        conditions: {
          storyMin: { leo_admitted_underage: 1 }
        },
        text: null
      },
      {
        characterName: 'Leo',
        role: null,
        conditions: { storyEquals: { leo_day7_outcome: 'refused_honest' } },
        text: null
      },
      {
        characterName: 'Maya',
        role: null,
        conditions: {
          storyEquals: {
            maya_day3_outcome: 'helped',
            maya_day6_outcome: 'helped'
          }
        },
        text: null
      },
      {
        characterName: 'Maya',
        role: null,
        conditions: { storyEquals: { maya_relationship: 'blamed' } },
        text: null
      },
      {
        characterName: 'Sofia',
        role: null,
        conditions: { storyEquals: { sofia_evidence: 'yes' } },
        text: null
      }
    ],

    languagePack: null
  };

  applyFirstWeekElementary(THE_FIRST_WEEK_CAMPAIGN);

  if (window.CinemaChaos && window.CinemaChaos.CampaignRegistry) {
    const registered = window.CinemaChaos.CampaignRegistry.register(THE_FIRST_WEEK_CAMPAIGN);
    // Attach the presenter after schema validation. The adapter is not part
    // of the serialised campaign definition or its gameplay data.
    Object.defineProperty(registered, 'applyLanguageMode', {
      value: mode => applyFirstWeekLanguage(registered, mode),
      enumerable: false
    });
  }

