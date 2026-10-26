/**
 * THE FIRST WEEK — INTERMEDIATE ENGLISH (B1–B2)
 * Same encounters, ticket facts and story branches as Elementary.
 * Only player-facing language is overridden here. Unchanged labels and
 * narrative facts inherit from Elementary; there is no runtime rewriting.
 */
const FIRST_WEEK_INTERMEDIATE = {
  "textOverrides": {
    "days/1/briefingMemo": "Welcome to The Grand Cinema. I'm Mrs Blackwood, the manager.\nBefore admitting anyone, compare the film, screen, starting time, date and number of seats on their ticket with the official programme. Ask customers what they're planning to see if their request isn't clear.\nThe correction printer won't be available until Wednesday, so for now you must ADMIT valid tickets and REFUSE tickets containing errors.",
    "days/2/briefingMemo": "The council is enforcing the cinema's age classifications today, Tuesday 13/10/2026.\nFilms marked [G] have no minimum age; [12] and [16] require customers to be at least twelve and sixteen respectively. If someone looks too young, you may request identification and compare the photograph and date of birth.\nThe printer remains unavailable, and anyone below the minimum age must be refused entry.",
    "days/3/briefingMemo": "We've had a projector breakdown in Screen 3, affecting the 19:00 showing of Planet X. That screening has been moved to Screen 1.\nThe correction printer is finally operational. If someone has a valid booking but their ticket still shows the old screen, use CORRECT to issue a replacement.\nAge restrictions and identity checks still apply, even when you're dealing with a ticket correction.",
    "days/4/briefingMemo": "We've discovered that ticket touts outside the cinema have been reselling tickets with duplicate serial numbers.\nCheck each serial against the Used Serials log. The ten-minute late-entry restriction remains in force, and PROMO (NO CHANGE) tickets cannot be replaced if the details are incorrect.\nTake particular care when examining identity cards: verify the holder's name, the dates and whether the photograph matches the customer.",
    "days/5/briefingMemo": "Friday's programme has changed, and Mrs Blackwood is expecting several important guests.\nLove in Paris at 20:00 has been CANCELLED. Ask affected customers whether they would accept another film before using CORRECT. There is also an extra screening of Happy Penguins in Screen 2 at 19:15.\nOnly passes listed in the Authorised VIP List are valid. As usual, compare any ID with the customer's stated details.",
    "days/6/briefingMemo": "Saturday's premiere is expected to draw a large crowd, so group bookings, VIP permissions, age restrictions and the late-entry policy will all matter.\nThere are only two seats left for Planet X in Screen 1 unless Maya has opened the additional balcony row. Check the customer's group size against the booking.\nBe alert for forged staff passes. Staff access must appear on the authorised list, and working here does not exempt anyone from the [16] age restriction.",
    "days/7/briefingMemo": "Today, Sunday 18/10/2026, is your seventh shift and the final Corporate Inspection.\nAll existing policies remain in effect: [G], [12] and [16] age classifications; appropriate ID checks; the relocation of Planet X to Screen 1; the cancellation of Love in Paris; the 19:15 extra showing of Happy Penguins; the ten-minute late limit; duplicate serial checks; and the authorised VIP and staff lists.\nThe way you've treated Leo, Mr Morris, Sofia, Maya and Mrs Blackwood throughout the week may influence the Inspector's final assessment.",
    "days/1/midShiftNotices/@day1_blackwood_memo/text": "From Mrs Blackwood: Please keep the queue moving. Official film age classifications ([G], [12], [16]) come into force tomorrow. I don't want any embarrassing mistakes.",
    "days/2/midShiftNotices/@day2_age_notice/text": "Box Office Reminder: If a customer's age seems doubtful, request ID and check both the photograph and date of birth. Do not admit anyone who fails the film's age requirement.",
    "days/3/midShiftNotices/@day3_projector_notice/text": "Projection Update: The 19:00 screening of Planet X has been relocated to Screen 1. Customers holding an original Screen 3 ticket will need a corrected one.",
    "days/4/midShiftNotices/@day4_fraud_notice/text": "Security Bulletin: Duplicate tickets with serials GC-4-102, GC-4-109 and GC-4-115 have been reported outside. An unidentified visitor may also be observing the booth on behalf of Head Office.",
    "days/5/midShiftNotices/@day5_vip_notice/text": "Head Office Audit: The authorised VIP passes are VIP-770-MORRIS, VIP-880-PREMIERE and VIP-900-INSPECTOR. A pass that isn't on the official list is not valid.",
    "days/6/midShiftNotices/@day6_premiere_notice/text": "Premiere Night: Check that every group has the number of seats shown in the booking records. The final Corporate Inspection takes place tomorrow.",
    "days/7/midShiftNotices/@day7_audit_notice/text": "Final Audit: The Corporate Inspector will review the full seven-day record once tonight's shift has ended.",
    "printerClosedMessage": "The correction printer is unavailable until Wednesday. For now, tickets with errors cannot be replaced.",
    "lateRuleText": "Customers arriving more than ten minutes after their screening begins must be refused. Check the recorded arrival time, not the time spent at the desk.",
    "vipRuleText": "A VIP pass is valid only if its number appears on the authorised list. All standard booking details and age restrictions still apply.",
    "ageRuleText": "The schedule shows three classifications: [G] for all ages, [12] for customers aged twelve and over, and [16] for those aged sixteen and over. Request ID if you consider it necessary, and check the holder's name, photograph and birth date.",
    "languageModes/elementary/description": "Clear, direct customer conversations and straightforward cinema instructions.",
    "days/1/scriptedEncounters/@morris_day1/statementTemplate": "Good evening. Could I have a ticket for {title}, please?",
    "days/1/scriptedEncounters/@morris_day1/qaOverrides/which_film": "I'm booked for Happy Penguins in Screen 2.",
    "days/1/scriptedEncounters/@morris_day1/qaOverrides/why_see": "I love wildlife documentaries, especially ones about penguins.",
    "days/1/scriptedEncounters/@sofia_day1/statementTemplate": "Hello, I'm Sofia. I've got a ticket for {title}.",
    "days/1/scriptedEncounters/@sofia_day1/qaOverrides/which_film": "I'm here for the 20:30 showing of The Last Train.",
    "days/1/scriptedEncounters/@sofia_day1/qaOverrides/why_see": "I'm studying film, and I've heard this thriller is really good.",
    "days/1/scriptedEncounters/@blackwood_day1/statementTemplate": "Mrs Blackwood, the manager. I'd like you to examine this ticket.",
    "days/1/scriptedEncounters/@blackwood_day1/qaOverrides/which_film": "It's a test ticket for Laughing Bananas in Screen 1.",
    "days/1/scriptedEncounters/@blackwood_day1/qaOverrides/are_you_sure": "I want to see if you spot the wrong screen number. The printer's still out of order.",
    "days/2/scriptedEncounters/@leo_day2/statementTemplate": "Hi there. I've got a ticket for {title}.",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/ask_age": "I'm sixteen, obviously. Why would I say otherwise?",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/ask_id": "My ID? I must have left it in my school locker. You can take my word for it, can't you?",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/which_film": "I've booked The Dark House in Screen 3.",
    "days/2/scriptedEncounters/@leo_day2/qaOverrides/why_see": "Everyone says it's the scariest horror film of the year, and I don't want to miss it.",
    "days/2/scriptedEncounters/@adult_horror_day2/statementTemplate": "Hi. Can you check my ticket for {title}?",
    "days/2/scriptedEncounters/@adult_horror_day2/qaOverrides/ask_age": "I actually turn thirty-two today; I was born on 13/10/1994.",
    "days/2/scriptedEncounters/@adult_horror_day2/qaOverrides/ask_id": "Of course. My date of birth is 13/10/1994, as you can see on the card.",
    "days/2/scriptedEncounters/@birthday_teen_day2/statementTemplate": "I've come to see {title}. It's my birthday, by the way!",
    "days/2/scriptedEncounters/@birthday_teen_day2/qaOverrides/ask_age": "I've just turned twelve today, 13/10/2026.",
    "days/2/scriptedEncounters/@birthday_teen_day2/qaOverrides/ask_id": "Here's my ID. The birth date is 13/10/2014, so I'm twelve today.",
    "days/3/scriptedEncounters/@morris_day3/statementByStory/0/text": "It's Mr Morris again. I heard the screening might have moved. Is my ticket still correct?",
    "days/3/scriptedEncounters/@morris_day3/statementByStory/1/text": "Mr Morris here. Would you mind checking the screen number on this ticket?",
    "days/3/scriptedEncounters/@morris_day3/statementByStory/2/text": "Good evening. I'm Mr Morris. Which screen should I go to?",
    "days/3/scriptedEncounters/@morris_day3/qaOverrides/which_film": "I've booked Planet X for seven o'clock this evening.",
    "days/3/scriptedEncounters/@morris_day3/qaOverrides/alternative": "I don't mind moving to Screen 1, provided it's still Planet X.",
    "days/3/scriptedEncounters/@maya_day3/statementTemplate": "I'm Maya, from the morning box office. I'm worried there's a mistake on this ticket.",
    "days/3/scriptedEncounters/@maya_day3/qaOverrides/which_film": "The booking is for Wild World at 19:30, in Screen 2.",
    "days/3/scriptedEncounters/@maya_day3/qaOverrides/are_you_sure": "Absolutely. The booking is fine; the printed screen number is what needs correcting.",
    "days/3/scriptedEncounters/@leo_day3/statementByStory/0/text": "Me again? You must be confusing me with somebody else. One adult ticket, please.",
    "days/3/scriptedEncounters/@leo_day3/statementByStory/1/text": "Good evening. I'm a fully grown adult, and I'd like one for {title}.",
    "days/3/scriptedEncounters/@leo_day3/qaOverrides/ask_age": "I'm twenty-four, if you really need to know.",
    "days/3/scriptedEncounters/@leo_day3/qaOverrides/ask_id": "Fine, have a look at this.",
    "days/3/scriptedEncounters/@leo_day3/qaOverrides/which_film": "I've booked The Dark House, the [16] film in Screen 3.",
    "days/4/scriptedEncounters/@sofia_day4/statementByStory/0/text": "Hello again. I saw something suspicious outside the cinema.",
    "days/4/scriptedEncounters/@sofia_day4/statementByStory/1/text": "It's Sofia. I've come for {title}, but there's something strange going on outside.",
    "days/4/scriptedEncounters/@sofia_day4/qaOverrides/which_film": "I'm booked for Love in Paris at 20:00, in Screen 2.",
    "days/4/scriptedEncounters/@sofia_day4/qaOverrides/why_see": "I fancied something romantic for a change.",
    "days/4/scriptedEncounters/@sofia_day4/qaOverrides/what_did_you_see": "Someone outside was reselling ticket GC-4-109, and I saw Mrs Blackwood accept cash for VIP passes that weren't on the official list!",
    "days/4/scriptedEncounters/@sofia_day4/questionEffects/ask_receipts/revealStatement": "I'll look through the student society's receipts before Saturday and see what I can find.",
    "days/4/scriptedEncounters/@sofia_day4/questionEffects/what_did_you_see/unlockQuestions/0/1": "Can you check those receipts?",
    "days/4/scriptedEncounters/@leo_day4/statementByStory/0/text": "Never mind that beard. My name's Mr Leonardo Smith, and I'd like a ticket.",
    "days/4/scriptedEncounters/@leo_day4/statementByStory/1/text": "Leonardo Smith. I've booked a place for {title}.",
    "days/4/scriptedEncounters/@leo_day4/qaOverrides/ask_age": "I'm forty. I was born in 1985.",
    "days/4/scriptedEncounters/@leo_day4/qaOverrides/ask_id": "Certainly. This is my ID: Leonardo Senior, born 20/11/1985.",
    "days/4/scriptedEncounters/@leo_day4/qaOverrides/which_film": "I'm booked for The Dark House, the one rated [16].",
    "days/4/scriptedEncounters/@mystery_day4/statementTemplate": "Good evening. I've brought my ticket for {title}.",
    "days/4/scriptedEncounters/@mystery_day4/qaOverrides/ask_age": "I'm forty-four years old.",
    "days/4/scriptedEncounters/@mystery_day4/qaOverrides/ask_id": "Certainly. You'll find 14/05/1982 as my date of birth.",
    "days/4/scriptedEncounters/@maya_day4_helped/statementTemplate": "Maya again! I really appreciated your help with that ticket on Wednesday.",
    "days/4/scriptedEncounters/@maya_day4_helped/questionEffects/ask_observer/revealStatement": "I have a feeling the visitor wearing a fedora works for Head Office.",
    "days/4/scriptedEncounters/@maya_day4_helped/qaOverrides/which_film": "It's for the 18:15 screening of Happy Penguins in Screen 2.",
    "days/4/scriptedEncounters/@maya_day4_blamed/statementByStory/0/text": "Hi, it's Maya. Things haven't gone well today. Could you look at this?",
    "days/4/scriptedEncounters/@maya_day4_blamed/statementByStory/1/text": "I'm Maya from the morning counter. Could you check this ticket?",
    "days/4/scriptedEncounters/@maya_day4_blamed/qaOverrides/which_film": "We need the Happy Penguins screening in Screen 2, please.",
    "days/4/scriptedEncounters/@maya_day4_blamed/qaOverrides/alternative": "I'm afraid Happy Penguins is the only one that will do.",
    "days/4/scriptedEncounters/@dilemma_late_day4/statementTemplate": "I'm terribly sorry I'm late. I stopped to help somebody on the way. Is there any chance I could still get in?",
    "days/4/scriptedEncounters/@dilemma_late_day4/qaOverrides/which_film": "I only came for Happy Penguins. I've been looking forward to it all week.",
    "days/4/scriptedEncounters/@dilemma_late_day4/qaOverrides/alternative": "That's kind of you, but I wouldn't want to see anything other than Happy Penguins tonight.",
    "days/5/scriptedEncounters/@blackwood_day5/statementTemplate": "It's Mrs Blackwood. This guest is with me, so let them through, please.",
    "days/5/scriptedEncounters/@blackwood_day5/qaOverrides/which_film": "Their booking is for The Dark House at 21:00.",
    "days/5/scriptedEncounters/@blackwood_day5/qaOverrides/are_you_sure": "I'm your manager. Follow my instructions rather than that Head Office list.",
    "days/5/scriptedEncounters/@blackwood_day5/qaOverrides/challenge_vip": "They paid me directly, in cash, in my office! Don't start quoting Head Office policy at me. Just stamp ADMIT.",
    "days/5/scriptedEncounters/@leo_day5/statementTemplate": "Good evening. I'd like to get into {title}, please.",
    "days/5/scriptedEncounters/@leo_day5/qaOverrides/ask_age": "I'm seventeen, so there's no problem with the age rating.",
    "days/5/scriptedEncounters/@leo_day5/qaOverrides/ask_id": "I've brought my ID this time. Here you go.",
    "days/5/scriptedEncounters/@leo_day5/qaOverrides/which_film": "I've booked The Dark House, rated [16].",
    "days/5/scriptedEncounters/@mystery_day5/statementTemplate": "Good evening. I have a pass for {title} if you'd like to inspect it.",
    "days/5/scriptedEncounters/@mystery_day5/qaOverrides/ask_id": "Certainly. My birth date is 14/05/1982, and the VIP number is VIP-900-INSPECTOR.",
    "days/6/scriptedEncounters/@morris_day6_loyal/statementTemplate": "Hello again. Could I have three places for {title}, please?",
    "days/6/scriptedEncounters/@morris_day6_loyal/qaOverrides/how_many": "There are three of us altogether: my two grandchildren and me.",
    "days/6/scriptedEncounters/@morris_day6_loyal/qaOverrides/which_film": "We're here for Wild World at 19:30, in Screen 2.",
    "days/6/scriptedEncounters/@morris_day6_standard/statementTemplate": "Good evening. I've brought my grandchildren, so there are three of us.",
    "days/6/scriptedEncounters/@morris_day6_standard/qaOverrides/which_film": "We're planning to see Wild World at 19:30 in Screen 2.",
    "days/6/scriptedEncounters/@morris_day6_standard/qaOverrides/how_many": "There are three of us in the group.",
    "days/6/scriptedEncounters/@maya_day6_helped/statementTemplate": "It's Maya again. We've got three tickets for {title}.",
    "days/6/scriptedEncounters/@maya_day6_helped/questionEffects/ask_balcony/revealStatement": "Yes, I managed to open the additional balcony row for tonight. I still owe you for helping me on Wednesday.",
    "days/6/scriptedEncounters/@maya_day6_helped/qaOverrides/how_many": "There are three people in our premiere group.",
    "days/6/scriptedEncounters/@maya_day6_helped/qaOverrides/which_film": "We've booked the 19:00 premiere of Planet X.",
    "days/6/scriptedEncounters/@maya_day6_unhelped/statementTemplate": "I'm Maya. There are three of us here for {title}.",
    "days/6/scriptedEncounters/@maya_day6_unhelped/qaOverrides/how_many": "There are three of us, and we've specifically come to see Planet X.",
    "days/6/scriptedEncounters/@maya_day6_unhelped/qaOverrides/alternative": "I'm afraid we wouldn't be interested in a different film; it's the Planet X premiere we came for.",
    "days/6/scriptedEncounters/@leo_day6/statementTemplate": "I'm the new projection assistant. This is my staff pass, so I should be allowed through.",
    "days/6/scriptedEncounters/@leo_day6/qaOverrides/ask_age": "I'm nineteen.",
    "days/6/scriptedEncounters/@leo_day6/qaOverrides/ask_id": "I haven't brought a separate ID card. My staff pass is STAFF-99-LEO, and that should be enough.",
    "days/6/scriptedEncounters/@leo_day6/qaOverrides/which_film": "I'm supposed to be inspecting The Dark House [16] in Screen 3.",
    "days/6/scriptedEncounters/@sofia_day6_ally/statementTemplate": "Hi, it's Sofia. I've found some strange receipts.",
    "days/6/scriptedEncounters/@sofia_day6_ally/qaOverrides/which_film": "I'm here for The Last Train at 20:30.",
    "days/6/scriptedEncounters/@sofia_day6_ally/qaOverrides/why_see": "I'd like to see the thriller while I'm here.",
    "days/6/scriptedEncounters/@sofia_day6_ally/qaOverrides/what_did_you_see": "Mrs Blackwood has been taking cash for VIP-000 passes that aren't officially registered. Refuse them, and make sure the Inspector hears about it tomorrow.",
    "days/6/scriptedEncounters/@sofia_day6_standard/statementTemplate": "Hello, it's Sofia. I've come for a thriller, and I've also found something you might want to know.",
    "days/6/scriptedEncounters/@sofia_day6_standard/qaOverrides/which_film": "The thriller I want is The Last Train at 20:30.",
    "days/6/scriptedEncounters/@sofia_day6_standard/qaOverrides/alternative": "I'd rather stick with The Last Train in Screen 3, thanks.",
    "days/6/scriptedEncounters/@sofia_day6_standard/qaOverrides/what_did_you_see": "I've discovered that Mrs Blackwood has been selling VIP-000 passes for cash without adding them to the official list.",
    "days/6/scriptedEncounters/@blackwood_day6/statementTemplate": "Mrs Blackwood here. I'm bringing another personal guest. Please let them through.",
    "days/6/scriptedEncounters/@blackwood_day6/qaOverrides/which_film": "They're attending The Last Train at 20:30.",
    "days/6/scriptedEncounters/@blackwood_day6/qaOverrides/are_you_sure": "I manage this cinema, and I expect you to follow my instructions.",
    "days/6/scriptedEncounters/@blackwood_day6/qaOverrides/challenge_vip": "They're my private guest for the premiere! I don't need a lecture about the authorised list.",
    "days/7/scriptedEncounters/@leo_day7/statementByStory/0/text": "Hi, it's Leo. No silly beard or disguise this time. I've got a ticket for {title}.",
    "days/7/scriptedEncounters/@leo_day7/statementByStory/1/text": "It's Leo. I've brought my ticket for {title}.",
    "days/7/scriptedEncounters/@leo_day7/qaOverrides/ask_age": "I'm fourteen. I was born on 10/09/2012.",
    "days/7/scriptedEncounters/@leo_day7/qaOverrides/ask_id": "Here's my genuine student ID. It says Leo, born 10/09/2012.",
    "days/7/scriptedEncounters/@leo_day7/qaOverrides/which_film": "I've booked Laughing Bananas at 18:00 in Screen 1.",
    "days/7/scriptedEncounters/@leo_day7/qaOverrides/why_see": "I just want a laugh for once. Keeping up all those disguises was exhausting.",
    "days/7/scriptedEncounters/@morris_day7/statementByStory/0/text": "It's Mr Morris again. I appreciate everything you've done for me this week. Just one ticket tonight, please.",
    "days/7/scriptedEncounters/@morris_day7/statementByStory/1/text": "Good evening, Mr Morris here. I'd like one for {title}.",
    "days/7/scriptedEncounters/@morris_day7/qaOverrides/which_film": "I'm here for Happy Penguins at 18:15 in Screen 2.",
    "days/7/scriptedEncounters/@morris_day7/qaOverrides/why_see": "I fancied a relaxing evening at the cinema I like best.",
    "days/7/scriptedEncounters/@blackwood_day7/statementTemplate": "Blackwood. I've brought one final guest, and I need you to let them in immediately.",
    "days/7/scriptedEncounters/@blackwood_day7/qaOverrides/which_film": "They're attending The Dark House at 21:00.",
    "days/7/scriptedEncounters/@blackwood_day7/qaOverrides/are_you_sure": "If you turn away VIP-000-AUDIT, the Inspector will discover what I've been doing on the side!",
    "days/7/scriptedEncounters/@blackwood_day7/qaOverrides/challenge_vip": "Keep your voice down! The Corporate Inspector is standing just behind me. Stamp ADMIT so the accounts will look right.",
    "days/7/scriptedEncounters/@mystery_day7/statementByStory/0/text": "Corporate Inspector. I've been told you have information you wish to report.",
    "days/7/scriptedEncounters/@mystery_day7/statementByStory/1/text": "I'm the Corporate Inspector. Mr Morris spoke very highly of you. Here's my pass.",
    "days/7/scriptedEncounters/@mystery_day7/statementByStory/2/text": "Corporate Inspector here. This is my pass for tonight's visit.",
    "days/7/scriptedEncounters/@mystery_day7/questionEffects/report_vip/revealStatement": "Thank you. I'll make a formal note of your evidence and examine Mrs Blackwood's accounts.",
    "days/7/scriptedEncounters/@mystery_day7/qaOverrides/ask_age": "I'm forty-four; my date of birth is 14/05/1982.",
    "days/7/scriptedEncounters/@mystery_day7/qaOverrides/ask_id": "Of course. Here's my official Inspector ID, showing 14/05/1982, together with VIP pass VIP-900-INSPECTOR.",
    "days/7/scriptedEncounters/@mystery_day7/qaOverrides/which_film": "I'm inspecting the 21:00 screening of The Dark House [16], in Screen 3.",
    "days/1/scriptedEncounters/@sofia_day1/storyEffects/dilemmaNoteByAction/ADMIT": "You greeted Sofia with her valid ticket.",
    "days/1/scriptedEncounters/@blackwood_day1/storyEffects/dilemmaNoteByAction/REFUSE": "You successfully completed Mrs Blackwood’s surprise Monday spot-check.",
    "days/2/scriptedEncounters/@leo_day2/storyEffects/dilemmaNoteByAction/REFUSE": "You turned away the customer entry to The Dark House [16] because he was too young.",
    "days/2/scriptedEncounters/@leo_day2/storyEffects/dilemmaNoteOnMistake": "You allowed an underage customer to The Dark House [16].",
    "days/3/scriptedEncounters/@morris_day3/storyEffects/dilemmaNoteOnMistake": "Mr Morris was disappointed when his relocated Planet X ticket was not corrected.",
    "days/3/scriptedEncounters/@morris_day3/customFeedback/CORRECT": "Mr Morris’s ticket was reprinted for Screen 1. He expressed his gratitude warmly!",
    "days/3/scriptedEncounters/@maya_day3/customFeedback/CORRECT": "You fixed Maya’s misprinted ticket to Screen 2. Maya breathed a huge sigh of relief!",
    "days/3/scriptedEncounters/@leo_day3/storyEffects/dilemmaNoteByAction/REFUSE": "You turned away the visitor wearing a visibly attached fake beard.",
    "days/4/scriptedEncounters/@sofia_day4/storyEffects/dilemmaNoteByAction/CORRECT": "You fixed Sofia’s ticket for Love in Paris.",
    "days/5/scriptedEncounters/@blackwood_day5/storyEffects/dilemmaNoteByAction/REFUSE": "You turned away Mrs Blackwood’s unlisted VIP-000-CASH pass and upheld the official VIP list.",
    "days/5/scriptedEncounters/@leo_day5/storyEffects/dilemmaNoteByAction/REFUSE": "You turned away the altered ID with inconsistent validity dates.",
    "days/6/scriptedEncounters/@sofia_day6_ally/storyEffects/dilemmaNoteByAction/ADMIT": "You allowed Sofia with her valid ticket.",
    "days/6/scriptedEncounters/@blackwood_day6/storyEffects/dilemmaNoteByAction/REFUSE": "You turned away Mrs Blackwood’s unlisted VIP-000-PREMIERE pass.",
    "days/7/scriptedEncounters/@leo_day7/storyEffects/dilemmaNoteOnMistake": "You turned away Leo even when he had a completely valid ticket for a G-rated comedy!",
    "days/7/scriptedEncounters/@morris_day7/storyEffects/dilemmaNoteByAction/ADMIT": "You allowed Mr Morris with his valid ticket.",
    "days/7/scriptedEncounters/@blackwood_day7/storyEffects/dilemmaNoteByAction/REFUSE": "You turned away Mrs Blackwood’s VIP-000-AUDIT cover-up pass right in front of the audit!",
    "days/2/policies/ageRuleText": "[G] films are suitable for all ages. Customers attending [12] films must have been born no later than 13/10/2014, while [16] films require a birth date of 13/10/2010 or earlier. Request identification when a visitor's appearance gives you reason to doubt their age. Refuse those who do not meet the relevant minimum.",
    "days/3/policies/ageRuleText": "The [G], [12] and [16] classifications remain in force. You may ask for identification where necessary, but any document you examine must contain valid calendar dates and a photograph matching its holder.",
    "days/4/policies/ageRuleText": "Continue checking [G], [12] and [16] restrictions. When an ID is presented, confirm that its photograph, personal details and validity dates are consistent with the customer and the ticket holder.",
    "days/4/policies/lateRuleText": "Entry is prohibited once more than ten minutes have elapsed since the scheduled starting time. Use the customer's recorded arrival time to establish whether the limit has been exceeded.",
    "days/5/policies/ageRuleText": "Examine the date of birth, issue date and expiry date on any ID you request. The dates must be valid, in the correct order and consistent with the customer's claimed age.",
    "days/6/policies/ageRuleText": "Premiere Night does not suspend normal requirements: enforce [12] and [16] age limits, inspect identification where appropriate, and accept only officially authorised staff passes.",
    "days/7/policies/ageRuleText": "Apply the [G], [12] and [16] age restrictions consistently. A customer who meets the rating's requirements must not be refused merely because you recognise them from an earlier incident.",
    "endings/@youre_fired/summary": "Head Office decided that your warnings, inspection record or declining customer trust fell below the standard required. Your probation has been terminated.",
    "endings/@the_whistleblower/summary": "After refusing Mrs Blackwood's unauthorised VIP passes, you investigated the scheme and supplied your evidence to the Corporate Inspector. Head Office dismissed the manager and offered you the position of Senior Box Office Supervisor.",
    "endings/@management_material/summary": "Whenever Mrs Blackwood instructed you to admit guests carrying unlisted VIP-000 passes, you followed her orders. The Inspector questioned the records, but Mrs Blackwood claimed credit for the profits and appointed you Assistant Manager.",
    "endings/@peoples_champion/summary": "You helped Mr Morris and his grandchildren, supported Maya's premiere booking and eventually welcomed Leo with a genuine Sunday ticket. Your patient treatment of the regulars did not go unnoticed.",
    "endings/@employee_of_the_week/summary": "Throughout seven demanding shifts, you enforced age restrictions, corrected ticket errors and treated customers fairly, even when pressured to ignore the rules. Head Office has named you Employee of the Week, and your portrait will hang in the cinema foyer.",
    "endings/@probation_passed/summary": "You made it through seven shifts behind the box-office window. Although you made mistakes and missed some details, the cinema continued operating and you passed your probationary week."
  },
  "proceduralOverrides": {
    "openings": [
      {
        "text": "Hi, I've booked a ticket for {title}.",
        "namesPlan": true
      },
      {
        "text": "Good evening. I'm here for {title}; here's my ticket.",
        "namesPlan": true
      },
      {
        "text": "Hello. Could you take a look at this, please?",
        "namesPlan": false
      }
    ],
    "defaultOpening": "I've booked a seat for {title}.",
    "wrongFilm": "I think there's been a mistake. This isn't what I booked—I asked for {request}.",
    "comedyRequest": "a comedy that will make me laugh",
    "genreRequest": "something in the {genre} genre",
    "hiddenTicket": "I know I had my ticket a moment ago. Let me check my bag.",
    "noTicket": "I haven't bought a ticket yet.",
    "noTicketOnDesk": "The customer hasn't presented a ticket.",
    "incomplete": "I'm meeting some friends and I need to confirm which screening they've booked.",
    "cancelled": "I've got a booking for {title}. Is there a problem with it?",
    "group": "There are {count} of us here for {title}.",
    "three": "There are three of us.",
    "late": "Sorry for the delay. I've been trying to get here for {title}.",
    "redRule": "I've got a booking for {title} at {time}.",
    "adultDisguise": "Good evening. I'd like to use my adult ticket for {title}.",
    "staffImpostor": "I'm with the staff. Here's my pass for {title}.",
    "refusal": "I'm not comfortable showing my identity card.",
    "missingIdReason": "The customer has not provided an identity document.",
    "photoMismatch": "The photo shows someone much older, and the name doesn't match the ticket.",
    "obviousDisguise": "The beard appears to be attached with visible adhesive.",
    "fakeStaffBadge": "The visitor is wearing a handmade staff badge, but their pass does not appear on the authorised list.",
    "genericPurpose": "to enjoy a night out",
    "joinGenres": " or ",
    "questionLabels": {
      "which_film": "Which film did you book?",
      "are_you_sure": "Is that the film you wanted?",
      "why_see": "Why did you choose that film?",
      "how_many": "How many people are in your group?",
      "alternative": "Would you like to see something else?",
      "other_ticket": "Have you got another ticket?",
      "ask_age": "How old are you?",
      "ask_id": "Can I see your photo ID, please?",
      "ask_name": "Can I have your full name, please?"
    },
    "answers": {
      "whichGenre": "I'm looking for {genres}; either would suit me.",
      "whichFilm": "I have a booking for {title}.",
      "purpose": "I chose it {purpose}.",
      "wrongFilmGenre": "No, that's not what I asked for. I'd prefer a {genre}.",
      "wrongFilmTitle": "No, I specifically booked {title}.",
      "confirmFilm": "Yes, I'm definitely here for {title}.",
      "groupOne": "It's just me, so I only need one seat.",
      "groupMany": "There are {count} of us altogether.",
      "friendsYes": "Yes, they're coming too; we're all watching the same screening.",
      "friendsNo": "No, he can't make it today.",
      "foundTicket": "Here we are! I knew it was in my coat somewhere.",
      "noOtherTicket": "No, this is the only one I've got.",
      "alternativeGenre": "I'd be happy with a {genres}, if you have one available.",
      "alternativeTitle": "I'd rather see {title}; that's what I came for.",
      "age": "I'm {age} years old.",
      "name": "My name is {name}.",
      "idShown": "Sure. My date of birth is {dob}. It's on my ID.",
      "noId": "I'm sorry, I haven't brought any ID with me.",
      "fallback": "I've come to see a film this evening."
    }
  },
  "playerQuestions": [
    [
      "which_film",
      "Which film did you book?"
    ],
    [
      "are_you_sure",
      "Is that the film you wanted?"
    ],
    [
      "why_see",
      "Why did you choose that film?"
    ],
    [
      "how_many",
      "How many people are in your group?"
    ],
    [
      "ask_age",
      "How old are you?"
    ],
    [
      "ask_id",
      "Can I see your photo ID, please?"
    ],
    [
      "alternative",
      "Would you like to see something else?"
    ],
    [
      "other_ticket",
      "Have you got another ticket?"
    ]
  ],
  "filmPhrases": {
    "laughing_bananas": {
      "descriptions": [
        "I'm in the mood for a comedy, so I've booked Laughing Bananas.",
        "My friends recommended this film because they said it was really funny.",
        "I thought a light-hearted comedy would be a good way to end the day."
      ],
      "purposePhrases": [
        "to have a good laugh",
        "to cheer myself up",
        "to enjoy an evening with friends"
      ]
    },
    "happy_penguins": {
      "descriptions": [
        "I've booked Happy Penguins because I enjoy documentaries about wildlife.",
        "I'm looking forward to learning more about penguins in their natural habitat.",
        "We're taking the family to see the new penguin documentary."
      ],
      "purposePhrases": [
        "to learn more about penguins",
        "to enjoy a relaxing documentary",
        "to spend time with my family"
      ]
    },
    "planet_x": {
      "descriptions": [
        "I've been looking forward to Planet X since I saw the trailer.",
        "I usually enjoy science fiction, especially stories involving space travel.",
        "We've reserved seats for the new science-fiction adventure."
      ],
      "purposePhrases": [
        "to see a science-fiction adventure",
        "to watch a story about space exploration",
        "to enjoy an exciting evening"
      ]
    },
    "wild_world": {
      "descriptions": [
        "I chose Wild World because I'm interested in the natural world.",
        "I've heard this documentary includes some remarkable wildlife footage.",
        "We're going to the nature documentary that starts at half past seven."
      ],
      "purposePhrases": [
        "to learn about wildlife",
        "to watch the nature documentary"
      ]
    },
    "love_in_paris": {
      "descriptions": [
        "My partner and I have booked Love in Paris for a romantic evening.",
        "I thought a love story might be a nice change from the usual action films.",
        "We're booked for the romance at eight o'clock."
      ],
      "purposePhrases": [
        "to enjoy a romantic evening",
        "to watch a love story"
      ]
    },
    "the_last_train": {
      "descriptions": [
        "I've heard The Last Train is a gripping thriller, so I wanted to see it.",
        "I'm in the mood for a mystery with a few unexpected twists.",
        "We've booked the late thriller because we enjoy suspenseful stories."
      ],
      "purposePhrases": [
        "to watch a suspenseful story",
        "to enjoy a good mystery"
      ]
    },
    "the_dark_house": {
      "descriptions": [
        "I've been told The Dark House is genuinely frightening.",
        "We're going to the late-night horror screening in Screen 3.",
        "I enjoy scary films, especially when they have plenty of suspense."
      ],
      "purposePhrases": [
        "to watch a frightening horror film",
        "to experience a tense evening"
      ]
    }
  },
  "dilemmaMessage": {
    "exceptionFeedback": "You made a compassionate exception for Mr Morris despite his late arrival. +€6.",
    "exceptionNote": "You used your discretion to admit Mr Morris after the usual late-entry limit.",
    "refusedNote": "Mr Morris was refused entry because he arrived more than ten minutes after the screening began.",
    "correctedNote": "Mr Morris agreed to attend an alternative screening instead."
  },
  "inspectorNotes": {
    "highRep": "The Corporate Inspector commended the accuracy of your decisions and the way you handled difficult customers.",
    "lowRep": "The Corporate Inspector raised concerns about several irregularities in your handling of the box office."
  }
};
