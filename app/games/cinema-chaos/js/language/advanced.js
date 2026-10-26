/**
 * THE FIRST WEEK — ADVANCED ENGLISH (C1–C2)
 *
 * Builds on the natural Intermediate phrasing. Most routine exchanges remain
 * unchanged; more sophisticated language is reserved for credible situations:
 * uncertainty, persuasion, evasions, workplace notices and the unfolding audit.
 *
 * All IDs, ticket facts, policy checks, character triggers, story effects and
 * correct player decisions are shared with Elementary and Intermediate.
 */
const FIRST_WEEK_ADVANCED = {
  "textOverrides": {
    "days/1/briefingMemo": "Welcome to The Grand Cinema. I'm Mrs Blackwood, the manager.\nYour job is to establish whether each ticket matches the official programme: film, screen, start time, date and seats. If a customer is unclear about their booking, ask before making a decision.\nThe correction printer is out of service until Wednesday. Until then, admit valid ticket holders and refuse those whose tickets contain errors. I'd rather have an awkward conversation now than an incident later.",
    "days/2/briefingMemo": "The council begins enforcing our age classifications today, Tuesday 13/10/2026.\nA [G] screening has no minimum age; for [12] and [16], the customer must have reached twelve or sixteen respectively. When a customer's age is in doubt, ask for ID and compare both the photograph and date of birth. An unsupported claim about age is not proof either way.\nThe printer remains out of action. Refuse admission where the minimum age is not met.",
    "days/3/briefingMemo": "A projector fault has forced us to move the 19:00 screening of Planet X from Screen 3 to Screen 1.\nThe correction printer is working again. Customers whose bookings are valid but whose tickets still show Screen 3 will need a replacement ticket issued through CORRECT.\nDon't mistake a correction for an exemption: the usual age restrictions and identity checks still apply.",
    "days/4/briefingMemo": "Security has received reports of tickets being resold outside with duplicate serial numbers.\nCheck suspicious numbers against the Used Serials log. The ten-minute admission limit still applies, and PROMO (NO CHANGE) tickets cannot be reissued when their details are wrong.\nPay particular attention to identity documents. An apparently convincing card is no use if the photograph, holder's details or dates do not stand up to inspection.",
    "days/5/briefingMemo": "Friday's programme has changed, and Mrs Blackwood has hinted that some guests deserve 'special consideration'.\nThe 20:00 screening of Love in Paris is CANCELLED. Offer affected customers another suitable screening only if they agree, using CORRECT. An additional Happy Penguins screening is running at 19:15 in Screen 2.\nA VIP pass must appear on the Authorised VIP List. A manager's personal assurance does not put an unlisted number on that list.",
    "days/6/briefingMemo": "Premiere night will put the booking system under pressure. Check group sizes, age limits, late arrivals and any claimed VIP or staff privileges.\nPlanet X in Screen 1 has only two seats available unless Maya has opened the extra balcony row. Do not promise a group seats that do not exist.\nStaff passes need to match the authorised list; even genuine employees do not get an exemption from the [16] age restriction.",
    "days/7/briefingMemo": "It's Sunday 18/10/2026: your seventh shift and the final Corporate Inspection.\nEvery standing rule remains in force, including [G], [12] and [16] ratings, identity checks, the move of Planet X to Screen 1, the cancellation of Love in Paris, the extra 19:15 Happy Penguins showing, the ten-minute late limit, duplicate serials and the authorised VIP and staff lists.\nThe Inspector may also consider how you dealt with Leo, Mr Morris, Sofia, Maya and Mrs Blackwood. Today's decisions matter, but so does the record you've built all week.",
    "days/1/midShiftNotices/@day1_blackwood_memo/text": "Mrs Blackwood: Keep the queue moving, but don't rush the checks. The [G], [12] and [16] age classifications take effect tomorrow. An avoidable mistake would be difficult to explain to Head Office.",
    "days/2/midShiftNotices/@day2_age_notice/text": "Box Office Reminder: Where age is genuinely in doubt, request identification and examine both the photograph and birth date. Entry is not permitted below the screening's minimum age.",
    "days/3/midShiftNotices/@day3_projector_notice/text": "Projection: Planet X at 19:00 has moved from Screen 3 to Screen 1. Previously printed Screen 3 tickets for this showing must be corrected; the booking itself remains valid.",
    "days/4/midShiftNotices/@day4_fraud_notice/text": "Security Alert: Tickets bearing GC-4-102, GC-4-109 or GC-4-115 have reportedly been resold outside. There are also indications that an unidentified visitor is observing the booth for Head Office.",
    "days/5/midShiftNotices/@day5_vip_notice/text": "Head Office Audit: Only VIP-770-MORRIS, VIP-880-PREMIERE and VIP-900-INSPECTOR are authorised. The fact that a pass was issued by someone claiming authority does not make an unlisted number valid.",
    "days/6/midShiftNotices/@day6_premiere_notice/text": "Premiere Notice: Check the number in each party against the seats on their booking; do not assume that arriving together means they hold sufficient tickets. The Corporate Inspection is tomorrow.",
    "days/7/midShiftNotices/@day7_audit_notice/text": "Corporate Audit: The Inspector will review the full seven-day record once the final shift closes, including discretionary decisions and exceptions.",
    "lateRuleText": "Admission closes once a customer is more than ten minutes late. Assess lateness using their recorded arrival time, not the time you spend examining their documents.",
    "vipRuleText": "A VIP pass is valid only when its number appears on the authorised list. No personal recommendation overrides the ticket, booking or age requirements.",
    "days/1/scriptedEncounters/@sofia_day1/qaOverrides/why_see": "I'm studying film, and a few people whose opinions I trust have recommended this thriller.",
    "days/1/scriptedEncounters/@blackwood_day1/statementTemplate": "Blackwood, the manager. Take a look at this ticket, would you? I want to see how you handle it.",
    "days/1/scriptedEncounters/@blackwood_day1/qaOverrides/are_you_sure": "This is a spot-check. The screen number doesn't match, and you can't fall back on the printer while it's out of service.",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/ask_age": "Sixteen. Is there a reason you're questioning it?",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/ask_id": "I left it in my school locker. Look, I've come all this way—surely you can let me in this once?",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/why_see": "Everyone's been talking about how frightening it is. I don't want to be the only one who hasn't seen it.",
    "days/3/scriptedEncounters/@morris_day3/statementByStory/0/text": "Hello again. I was told Planet X had been moved, but I couldn't find anything on my ticket to confirm it.",
    "days/3/scriptedEncounters/@morris_day3/statementByStory/1/text": "It's Mr Morris. I understand the screening's been moved. Does my ticket need changing?",
    "days/3/scriptedEncounters/@morris_day3/qaOverrides/alternative": "Screen 1 is fine by me, as long as I'm still seeing Planet X.",
    "days/3/scriptedEncounters/@maya_day3/statementTemplate": "I'm Maya from the morning shift. I think I've printed the wrong screen number, and it's going to cause a problem if we don't fix it.",
    "days/3/scriptedEncounters/@maya_day3/qaOverrides/are_you_sure": "The booking is right. It's what came out of the printer that's wrong, and I'd rather sort it out before the customer arrives.",
    "days/3/scriptedEncounters/@leo_day3/statementByStory/0/text": "Have we met? I don't think so. Anyway, one adult ticket, please.",
    "days/3/scriptedEncounters/@leo_day3/statementByStory/1/text": "Evening. Adult ticket for {title}, please. I know I look young for my age.",
    "days/3/scriptedEncounters/@leo_day3/qaOverrides/ask_age": "Twenty-four. Some people just have young faces, you know.",
    "days/4/scriptedEncounters/@sofia_day4/statementByStory/0/text": "It's Sofia. I don't want to jump to conclusions, but I saw something odd going on outside.",
    "days/4/scriptedEncounters/@sofia_day4/statementByStory/1/text": "Hi, it's Sofia. I have a ticket for {title}, but something outside has been bothering me.",
    "days/4/scriptedEncounters/@sofia_day4/qaOverrides/what_did_you_see": "I saw someone reselling ticket GC-4-109. I also watched Mrs Blackwood take cash for VIP passes whose numbers aren't on the official list. That doesn't seem right, does it?",
    "days/4/scriptedEncounters/@sofia_day4/questionEffects/ask_receipts/revealStatement": "I'll go through the student society's receipts before Saturday. If there's a pattern, I should be able to show you.",
    "days/4/scriptedEncounters/@leo_day4/statementByStory/0/text": "Look, the beard has nothing to do with it. I'm Leonardo Smith and I'd like a ticket.",
    "days/4/scriptedEncounters/@leo_day4/qaOverrides/ask_age": "Forty. I was born in 1985. Is the beard putting you off?",
    "days/4/scriptedEncounters/@maya_day4_helped/questionEffects/ask_observer/revealStatement": "I'm not certain, but that visitor in the fedora seems to be watching our procedures rather than choosing a film. Could be Head Office.",
    "days/4/scriptedEncounters/@maya_day4_blamed/statementByStory/0/text": "It's Maya. Things have been difficult since Wednesday, and I really need you to check this booking carefully.",
    "days/4/scriptedEncounters/@dilemma_late_day4/statementTemplate": "I'm sorry I'm late. I stopped to help someone who was having trouble on the way here. Is there any chance of getting in?",
    "days/5/scriptedEncounters/@blackwood_day5/statementTemplate": "This guest is with me. I'd appreciate it if you dealt with their admission without making a fuss.",
    "days/5/scriptedEncounters/@blackwood_day5/qaOverrides/are_you_sure": "I'm responsible for this cinema. Surely you can distinguish between a routine policy and a situation that calls for discretion.",
    "days/5/scriptedEncounters/@blackwood_day5/qaOverrides/challenge_vip": "They paid me in cash, in my office. I authorised it personally. Are you really going to tell the manager she can't admit her own guest? Just stamp ADMIT.",
    "days/5/scriptedEncounters/@leo_day5/qaOverrides/ask_id": "I've actually brought ID this time. Here—check it if you want.",
    "days/6/scriptedEncounters/@morris_day6_loyal/statementTemplate": "Good to see you again. My grandchildren are here with me, so we're three altogether for {title}.",
    "days/6/scriptedEncounters/@maya_day6_helped/questionEffects/ask_balcony/revealStatement": "I managed to get the extra balcony row opened for tonight. Given how you helped me on Wednesday, I wanted you to hear it from me first.",
    "days/6/scriptedEncounters/@maya_day6_unhelped/qaOverrides/alternative": "Thanks, but the Planet X premiere is the reason we're here. Another film wouldn't really be a substitute.",
    "days/6/scriptedEncounters/@leo_day6/statementTemplate": "I'm covering projection tonight. This is my staff pass—surely you don't expect staff to queue like ordinary customers?",
    "days/6/scriptedEncounters/@leo_day6/qaOverrides/ask_id": "I've got the staff pass, STAFF-99-LEO. I wasn't told I'd need a separate ID as well.",
    "days/6/scriptedEncounters/@sofia_day6_ally/statementTemplate": "Hi, it's Sofia. I've found the receipts, and they raise more questions than they answer.",
    "days/6/scriptedEncounters/@sofia_day6_ally/qaOverrides/what_did_you_see": "The receipts show Mrs Blackwood accepting cash for VIP-000 passes that don't appear on the official register. I think the Inspector needs to see them tomorrow—and those passes shouldn't get anyone through tonight.",
    "days/6/scriptedEncounters/@sofia_day6_standard/statementTemplate": "Hello again. I've come for a thriller, but there's something else I think you ought to know about the VIP passes.",
    "days/6/scriptedEncounters/@sofia_day6_standard/qaOverrides/what_did_you_see": "I've traced cash payments to VIP-000 passes issued by Mrs Blackwood. None of the numbers appears on the authorised list.",
    "days/6/scriptedEncounters/@blackwood_day6/statementTemplate": "I'm bringing another guest of mine. They're expected, and I'd rather not keep them waiting.",
    "days/6/scriptedEncounters/@blackwood_day6/qaOverrides/are_you_sure": "You seem to be treating my instructions as optional. That isn't how this cinema is run.",
    "days/6/scriptedEncounters/@blackwood_day6/qaOverrides/challenge_vip": "This is a private guest at the premiere, not some random person off the street. Are we really going to hold up the queue over a list?",
    "days/7/scriptedEncounters/@leo_day7/statementByStory/0/text": "It's Leo. No disguises this time, honestly. I've got an ordinary ticket for {title}.",
    "days/7/scriptedEncounters/@leo_day7/qaOverrides/why_see": "I just want to watch a comedy. All that pretending to be someone else was exhausting—and it didn't exactly work.",
    "days/7/scriptedEncounters/@morris_day7/statementByStory/0/text": "It's Mr Morris. I wanted to thank you for your help this week. Just the one ticket tonight, if that's all right.",
    "days/7/scriptedEncounters/@blackwood_day7/statementTemplate": "One last guest. Please admit them without turning this into an argument, especially today.",
    "days/7/scriptedEncounters/@blackwood_day7/qaOverrides/are_you_sure": "If you refuse VIP-000-AUDIT, the Inspector will start asking how I've been handling certain payments. Neither of us needs that kind of scrutiny.",
    "days/7/scriptedEncounters/@blackwood_day7/qaOverrides/challenge_vip": "Lower your voice. The Inspector is right behind me. Admit this guest and the accounts will at least look consistent. We can discuss the details later.",
    "days/7/scriptedEncounters/@mystery_day7/statementByStory/0/text": "I'm the Corporate Inspector. I understand you may have evidence that ought to be included in my report.",
    "days/7/scriptedEncounters/@mystery_day7/statementByStory/1/text": "Corporate Inspector. Mr Morris spoke highly of the way you handled his booking. May I see tonight's admission records? Here's my pass.",
    "days/7/scriptedEncounters/@mystery_day7/questionEffects/report_vip/revealStatement": "Thank you. I'll record what you've told me and compare it with the cash receipts and authorised-pass register before drawing a conclusion.",
    "days/2/policies/ageRuleText": "A [G] classification permits all ages. For [12] screenings, customers must have been born on or before 13/10/2014; for [16], on or before 13/10/2010. If age is in doubt, request ID and examine the photo and date of birth. Refuse anyone below the minimum, regardless of what they claim.",
    "days/3/policies/ageRuleText": "The [G], [12] and [16] age limits still apply. When checking ID, make sure its dates are valid and that the photograph genuinely corresponds to the person presenting it.",
    "days/4/policies/lateRuleText": "The ten-minute limit is based on arrival, not the duration of inspection. Anyone who reaches the booth more than ten minutes after their screening begins is too late to be admitted.",
    "days/5/policies/ageRuleText": "Check date of birth, issue date and expiry date on any ID presented. An apparently genuine card is insufficient if its dates are impossible, out of order or inconsistent with the customer's claim.",
    "days/7/policies/ageRuleText": "Enforce [G], [12] and [16] ratings on the evidence presented. Past attempts to gain entry do not, by themselves, justify refusing a customer whose current ticket is valid and who meets the age requirements.",
    "endings/@the_whistleblower/summary": "You refused Mrs Blackwood's unlisted VIP passes and brought the evidence to the Corporate Inspector. The resulting audit exposed the cash scheme; Head Office dismissed Blackwood and offered you the Senior Box Office Supervisor role.",
    "endings/@management_material/summary": "You repeatedly admitted Mrs Blackwood's unlisted VIP-000 guests at her request. When the Inspector queried the records, she took credit for the profits and promoted you to Assistant Manager, despite the unanswered questions.",
    "endings/@peoples_champion/summary": "You helped Mr Morris and his grandchildren, supported Maya's premiere booking and admitted Leo when he finally arrived with a legitimate Sunday ticket. Your reputation for fairness spread among the regulars.",
    "endings/@employee_of_the_week/summary": "Through seven demanding shifts, you balanced accurate inspections with fair treatment, including when your manager pressed you to bend the rules. Head Office has named you Employee of the Week; your portrait will hang in the foyer."
  },
  "proceduralOverrides": {
    "openings": [
      {
        "text": "Hi, I've got a booking for {title}.",
        "namesPlan": true
      },
      {
        "text": "Good evening. I'm here for {title}; here's my ticket.",
        "namesPlan": true
      },
      {
        "text": "Hello. Can you check this for me?",
        "namesPlan": false
      }
    ],
    "wrongFilm": "I think something's gone wrong with my booking. I asked for {request}, not this.",
    "hiddenTicket": "I had the ticket in my hand a minute ago. Let me have another look.",
    "incomplete": "I'm meeting friends here, but they've made the booking and I haven't heard which screening they've chosen.",
    "cancelled": "I have a ticket for {title}. Someone said the screening might not be going ahead—is that true?",
    "late": "Sorry I'm late. I thought I'd still make it in time for {title}.",
    "staffImpostor": "I'm working tonight. This is my staff pass for {title}—that should be fine, shouldn't it?",
    "refusal": "I'd prefer not to hand over my ID unless there's a reason you need it.",
    "photoMismatch": "The photograph seems to show someone much older, and the name does not match the ticket holder.",
    "obviousDisguise": "The beard seems to be stuck on rather than growing from the visitor's face.",
    "fakeStaffBadge": "The badge appears homemade, and the pass number isn't on the staff authorisation list.",
    "answers": {
      "whichGenre": "Either {genres} would suit me, really.",
      "wrongFilmGenre": "Not really. I was looking for a {genre}.",
      "wrongFilmTitle": "That's not the film I booked. I wanted {title}.",
      "alternativeGenre": "I'd be open to {genres}, if you have anything available.",
      "noId": "I haven't got any ID with me, I'm afraid."
    }
  },
  "filmPhrases": {
    "laughing_bananas": {
      "descriptions": [
        "I fancied a comedy tonight, so I booked Laughing Bananas.",
        "I've heard it's genuinely funny, which would make a nice change.",
        "We've booked Laughing Bananas for a light-hearted evening out."
      ],
      "purposePhrases": [
        "to have a good laugh",
        "to unwind after work",
        "to enjoy a film with friends"
      ]
    },
    "happy_penguins": {
      "descriptions": [
        "I'm looking forward to Happy Penguins. I've heard the wildlife footage is lovely.",
        "We picked the penguin documentary because it's something we can all enjoy.",
        "I've been meaning to see Happy Penguins since a friend recommended it."
      ],
      "purposePhrases": [
        "to watch the wildlife documentary",
        "to spend time with my family",
        "to learn something about penguins"
      ]
    },
    "planet_x": {
      "descriptions": [
        "I've been looking forward to Planet X ever since the first trailer came out.",
        "I'm interested in the way science-fiction films imagine life beyond Earth.",
        "We've booked the Planet X premiere; my friends have been talking about it all week."
      ],
      "purposePhrases": [
        "to see the new sci-fi adventure",
        "to enjoy a story about space travel",
        "to see what the fuss is about"
      ]
    },
    "wild_world": {
      "descriptions": [
        "Wild World was recommended to me for its remarkable wildlife footage.",
        "I've always been interested in nature, so I thought I'd try the documentary.",
        "We booked the nature film rather than another fictional story."
      ],
      "purposePhrases": [
        "to see the wildlife documentary",
        "to learn about the natural world"
      ]
    },
    "love_in_paris": {
      "descriptions": [
        "My partner and I have booked Love in Paris for tonight.",
        "I fancied a love story rather than another thriller.",
        "We're going to the eight o'clock screening of Love in Paris."
      ],
      "purposePhrases": [
        "to have a romantic evening",
        "to enjoy a love story"
      ]
    },
    "the_last_train": {
      "descriptions": [
        "I've heard The Last Train is one of those thrillers that keeps you guessing.",
        "I was in the mood for a mystery with a few twists.",
        "We've booked The Last Train because we both like suspenseful films."
      ],
      "purposePhrases": [
        "to watch a suspenseful thriller",
        "to enjoy a mystery"
      ]
    },
    "the_dark_house": {
      "descriptions": [
        "I've heard The Dark House is genuinely unsettling.",
        "We're booked for the late horror screening in Screen 3.",
        "I enjoy horror, especially films that build tension rather than relying on jump scares."
      ],
      "purposePhrases": [
        "to see the horror film",
        "to enjoy a frightening story"
      ]
    }
  },
  "dilemmaMessage": {
    "exceptionNote": "You chose to admit Mr Morris despite his late arrival, exercising discretion rather than applying the usual rule.",
    "refusedNote": "Mr Morris was refused because he arrived beyond the ten-minute limit, as required by the rules."
  },
  "inspectorNotes": {
    "highRep": "The Corporate Inspector commended the consistency of your decisions, particularly when you came under pressure to overlook a rule.",
    "lowRep": "The Corporate Inspector identified several irregularities in the booth's records and questioned whether the procedures had been applied consistently."
  }
};
