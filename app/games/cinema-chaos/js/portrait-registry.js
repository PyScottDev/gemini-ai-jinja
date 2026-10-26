/**
 * Stage 2A: visual assets live independently of any campaign or language pack.
 * These are relative URLs; they work offline via a local server or on a static host.
 * Generic roster age groups guide illustration casting, NEVER age verification.
 * Recurring-character portraits live in the recurring folder and can be
 * swapped without touching the engine or campaign logic.
 */
const PORTRAIT_REGISTRY = Object.freeze({
  recurring: Object.freeze({
    mr_morris: 'assets/characters/recurring/mr_morris.webp',
    sofia: 'assets/characters/recurring/sofia.webp',
    leo: 'assets/characters/recurring/leo/leo_neutral.webp',
    mystery: 'assets/characters/recurring/mystery_customer.webp',
    maya: 'assets/characters/recurring/maya.webp',
    mr_blackwood: 'assets/characters/recurring/manager.webp'
  }),
  // Campaign character IDs live here, not inside the generic character renderer.
  costumeProfiles: Object.freeze({
    leo: Object.freeze({
      variants: Object.freeze({
        neutral: 'assets/characters/recurring/leo/leo_neutral.webp',
        innocent: 'assets/characters/recurring/leo/leo_innocent.webp',
        caught: 'assets/characters/recurring/leo/leo_caught.webp',
        frustrated: 'assets/characters/recurring/leo/leo_frustrated.webp',
        dyedHair: 'assets/characters/recurring/leo/leo_dyed_hair.webp',
        cap: 'assets/characters/recurring/leo/leo_cap.webp',
        glasses: 'assets/characters/recurring/leo/leo_glasses.webp',
        suit: 'assets/characters/recurring/leo/leo_suit.webp',
        moustache: 'assets/characters/recurring/leo/leo_moustache.webp',
        beard: 'assets/characters/recurring/leo/leo_beard.webp'
      }),
      defaultVariant: 'neutral',
      // Highest-priority visual cue first; special variants use existing WebP art.
      rules: Object.freeze([
        { whenAny: ['fakeBeard'], variant: 'beard' },
        { whenAny: ['staffHat','staffBadge'], variant: 'cap', overlay: 'staffUniform' },
        { whenAny: ['oversizedSuit'], variant: 'suit', overlay: 'sunglasses', overlayIf: 'sunglasses' },
        { whenAny: ['editedMoustache'], variant: 'moustache' },
        { whenAny: ['sunglasses'], variant: 'neutral', overlay: 'sunglasses' }
      ])
    }),
    maya: Object.freeze({})
  }),
  reservedVisitorIds: Object.freeze([]),
  visitors: Object.freeze([
  {
    "id": "man-01",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-01.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-02",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-02.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-03",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-03.webp",
    "ageGroup": "under18",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-04",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-04.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-05",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-05.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-06",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-06.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-07",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-07.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-08",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-08.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  },
  {
    "id": "man-09",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-09.webp",
    "ageGroup": "youngAdult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-10",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-10.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-11",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-11.webp",
    "ageGroup": "adult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-12",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-12.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  },
  {
    "id": "man-13",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-13.webp",
    "ageGroup": "adult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-14",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-14.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-15",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-15.webp",
    "ageGroup": "adult",
    "wearingRed": true,
    "glasses": true,
    "hat": false
  },
  {
    "id": "man-16",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-16.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-17",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-17.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "man-18",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-18.webp",
    "ageGroup": "adult",
    "wearingRed": true,
    "glasses": true,
    "hat": false
  },
  {
    "id": "man-19",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-19.webp",
    "ageGroup": "olderAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": true
  },
  {
    "id": "man-20",
    "genderPresentation": "male",
    "src": "assets/characters/customers/men/man-20.webp",
    "ageGroup": "olderAdult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-01",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-01.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-02",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-02.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-03",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-03.webp",
    "ageGroup": "under18",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-04",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-04.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-05",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-05.webp",
    "ageGroup": "under18",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-06",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-06.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-07",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-07.webp",
    "ageGroup": "youngAdult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-08",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-08.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  },
  {
    "id": "woman-09",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-09.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-10",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-10.webp",
    "ageGroup": "youngAdult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-11",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-11.webp",
    "ageGroup": "adult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-12",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-12.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  },
  {
    "id": "woman-13",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-13.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-14",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-14.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-15",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-15.webp",
    "ageGroup": "adult",
    "wearingRed": true,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-16",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-16.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  },
  {
    "id": "woman-17",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-17.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": false,
    "hat": false
  },
  {
    "id": "woman-18",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-18.webp",
    "ageGroup": "adult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  },
  {
    "id": "woman-19",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-19.webp",
    "ageGroup": "olderAdult",
    "wearingRed": true,
    "glasses": false,
    "hat": true
  },
  {
    "id": "woman-20",
    "genderPresentation": "female",
    "src": "assets/characters/customers/women/woman-20.webp",
    "ageGroup": "olderAdult",
    "wearingRed": false,
    "glasses": true,
    "hat": false
  }
]),
});
