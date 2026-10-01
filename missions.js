/**
 * missions.js - Story Campaign, Dossier Briefings, and 6 Tactical Missions
 * For Agent Transposition
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Missions = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Agent Ranks based on total stars earned (max 18 stars)
  const AGENT_RANKS = [
    { minStars: 0, title: "Rookie", badge: "ROOKIE", desc: " تازه-وارد / Probationary Agent" },
    { minStars: 4, title: "Field Operative", badge: "OPERATIVE", desc: "Proven in frontline field communication" },
    { minStars: 7, title: "Special Agent", badge: "SPEC AGENT", desc: "Expert in clandestine cryptography" },
    { minStars: 11, title: "Senior Investigator", badge: "INVESTIGATOR", desc: "Master of codebreaking and intercept recovery" },
    { minStars: 15, title: "Spymaster", badge: "SPYMASTER", desc: "Elite tactician trusted with national secrets" },
    { minStars: 18, title: "Master Spy", badge: "MASTER SPY", desc: "Legendary clearance. Top Secret classification." }
  ];

  // 6 Progressive Covert Missions
  const MISSIONS = [
    {
      id: 1,
      number: 1,
      title: "Operation First Contact",
      type: "encrypt",
      codename: "WHISPER",
      key: "SPY",
      plaintext: "AGENTCHECKIN",
      classification: "CONFIDENTIAL // EYES ONLY",
      briefing: "Welcome to active duty, Agent Echo. Before we authorize your deep-cover infiltration of the Obsidian Syndicate, you must establish secure comms. Encrypt your check-in code using key 'SPY'. Remember: fill the notepad grid row-by-row, then select columns by key rank (P=1, S=2, Y=3).",
      debriefing: "Transmission received at Safehouse Echo. Signal is crystal clear. Your covert credentials are now active in the field.",
      targetLocation: "Safehouse Echo (Berlin Sector)",
      clue: null,
      tip: "Key 'SPY': alphabetical order is P=1, S=2, Y=3. 12 letters evenly fill 3 columns (4 letters each).",
      hint: "Alphabetical rank: P is 1st (Rank 1), S is 2nd (Rank 2), Y is 3rd (Rank 3). Tap Column 'P' first!",
      timeLimit: 0 // untimed
    },
    {
      id: 2,
      number: 2,
      title: "The Dockside Dead Drop",
      type: "decrypt",
      codename: "RIVERFRONT",
      key: "COVERT",
      plaintext: "RENDEZVOUSATTHEOLDPIER",
      classification: "SECRET // INTELLIGENCE INTERCEPT",
      briefing: "Our radio intercept post captured a high-frequency burst transmission sent to syndicate courier 'Viper'. Decrypt the message to uncover where the stolen microfiche will be delivered tonight. First deduce column lengths, place chunks by rank, then read across rows!",
      debriefing: "Target confirmed: OLD PIER 42. Field tactical teams have deployed to intercept the courier.",
      targetLocation: "Old Pier 42 (North Basin)",
      clue: null,
      tip: "22 letters / 6 columns = 3 full rows + 4 leftover letters. Columns 1 to 4 have 4 letters (Full); columns 5 and 6 have 3 letters (Short).",
      hint: "4 columns are Full (4 letters) and 2 are Short (3 letters). Mark them correctly to advance to chunk placement!",
      timeLimit: 0
    },
    {
      id: 3,
      number: 3,
      title: "Ambush at Sector 7",
      type: "encrypt",
      codename: "NIGHTFALL",
      key: "CIPHER",
      plaintext: "SENDEXTRACTIONTEAMNOW",
      classification: "TOP SECRET // FLASH OVERRIDE",
      briefing: "Syndicate enforcers have breached the perimeter! Send an encrypted extraction request before enemy radio direction finders triangulate your antenna. Notice: the last row has empty cells that must remain unpadded!",
      debriefing: "Extraction beacon received! Gunship deployed to rooftop coordinates. Evacuation in progress.",
      targetLocation: "Rooftop Helipad (Sector 7)",
      clue: null,
      tip: "Key 'CIPHER': ranks C=1, E=2, H=3, I=4, P=5, R=6. 20 letters / 6 columns leaves 2 letters on the last row.",
      hint: "Only Columns 0 ('C') and 1 ('I') get a 4th letter on row 4. Columns 2-5 only have 3 letters!",
      timeLimit: 0
    },
    {
      id: 4,
      number: 4,
      title: "Crack the Syndicate Telegraph",
      type: "crack",
      codename: "BLACKWIRE",
      key: "BRIDGE",
      plaintext: "MEETATTHEBRIDGEATMIDNIGHT",
      classification: "TOP SECRET // CRYPTANALYSIS",
      briefing: "We seized an encoded telegram from a captured syndicate lieutenant. The key is unknown, but informant 'Nightshade' leaked that the message contains the word 'BRIDGE'. Rearrange the scrambled columns until readable plaintext appears!",
      debriefing: "Brilliant cryptanalysis, Agent! The syndicate's midnight bridge ambush has been foiled.",
      targetLocation: "Ironworks Suspension Bridge",
      crib: "BRIDGE",
      clue: "Informant reports the message contains the location keyword: 'BRIDGE'.",
      tip: "Swap columns until the letters 'B-R-I-D-G-E' form a contiguous word across one of the horizontal rows.",
      hint: "Look for column pairs containing 'B' and 'R' on the same row. Drag or tap them into position.",
      timeLimit: 0
    },
    {
      id: 5,
      number: 5,
      title: "The Mole's Dispatch",
      type: "decrypt",
      codename: "DOUBLECROSS",
      key: "TARGET",
      plaintext: "MOLEISPLANTEDATHEADQUARTERS",
      classification: "TOP SECRET // COMPROMISED INTERNAL",
      briefing: "A traitor inside the intelligence bureau sent this encrypted dispatch to Syndicate Commander Raven. The key is 'TARGET'. Beware: the letter 'T' appears twice! Ties are broken strictly from left to right. Decode the mole's orders!",
      debriefing: "The mole has been detained in Central Records! Our agent registry and field operatives are protected.",
      targetLocation: "Central Records Vault (Sub-Level 3)",
      clue: null,
      tip: "Key 'TARGET': A=1, E=2, G=3, R=4, first T=5, second T=6. Left-to-right tie-breaking applies.",
      hint: "First 'T' at index 0 gets Rank 5. Second 'T' at index 5 gets Rank 6. 26 letters leaves 2 full columns (5 letters each).",
      timeLimit: 0
    },
    {
      id: 6,
      number: 6,
      title: "Operation Blackout: Final Mission",
      type: "final",
      codename: "APOCALYPSE",
      key: "PHOENIX",
      plaintext: "SHUTDOWNALLCENTRALPOWERGRIDSIMMEDIATELY",
      classification: "TOP SECRET // MASTER SPY CLEARANCE",
      briefing: "CRITICAL ALERT: The syndicate has initiated a global power grid collapse. You have 90 seconds to transmit the master neutralization command using 7-letter key 'PHOENIX'. Irregular last row, strict timer, and zero room for error. Good luck, Operative.",
      debriefing: "OVERRIDE CODE ACCEPTED! Syndicate mainframe disabled globally. All regional grids stabilized. Outstanding work, Agent. You have earned the title of MASTER SPY.",
      targetLocation: "Syndicate Deep-Sea Citadel",
      clue: null,
      tip: "Key 'PHOENIX': E=1, H=2, I=3, N=4, O=5, P=6, X=7. 38 letters / 7 columns = 5 rows + 3 leftover letters.",
      hint: "Columns 0 ('P'), 1 ('H'), 2 ('O') have 6 letters; columns 3-6 have 5 letters. Select columns by rank (E, H, I, N, O, P, X).",
      timeLimit: 90
    }
  ];

  // Training Room Guided Tutorial Steps
  const TRAINING_STEPS = [
    {
      step: 1,
      title: "Step 1: Key Alphabetical Ranking",
      caption: "Every secret mission uses a codeword (the key). Each letter is assigned an alphabetical rank (1, 2, 3...). If letters repeat (like in BANANA), ties are broken strictly from left to right!",
      key: "ZEBRAS",
      plaintext: "WEAREDISCOVERED",
      highlight: "headers",
      details: "For key ZEBRAS: A=1, B=2, E=3, R=4, S=5, Z=6. The rank numbers sit directly under the key letters."
    },
    {
      step: 2,
      title: "Step 2: Writing Plaintext Row by Row",
      caption: "The agent writes the secret message horizontally across the notepad grid, filling row by row from left to right directly beneath the key.",
      key: "ZEBRAS",
      plaintext: "WEAREDISCOVERED",
      highlight: "rows",
      details: "Row 0: W - E - A - R - E - D. Row 1: I - S - C - O - V - E. Row 2: R - E - D."
    },
    {
      step: 3,
      title: "Step 3: Incomplete Rows (No Padding)",
      caption: "If the message length is not an exact multiple of the key length, the final row is incomplete. The remaining cells stay empty — agents NEVER add filler letters.",
      key: "ZEBRAS",
      plaintext: "WEAREDISCOVERED",
      highlight: "empty-cells",
      details: "15 letters / 6 columns = 2 full rows with 3 leftover letters. Only columns 0, 1, 2 get a 3rd letter (Full); columns 3, 4, 5 only get 2 letters (Short)."
    },
    {
      step: 4,
      title: "Step 4: Reading Columns by Rank",
      caption: "To form the scrambled ciphertext, read down the columns in order of their key rank (Rank 1, then Rank 2, Rank 3, ..., up to the highest rank).",
      key: "ZEBRAS",
      plaintext: "WEAREDISCOVERED",
      highlight: "columns-read",
      details: "Rank 1 (A): EV + Rank 2 (B): ACD + Rank 3 (E): ESE + Rank 4 (R): RO + Rank 5 (S): DE + Rank 6 (Z): WIR = EVACDESERODEWIR!"
    },
    {
      step: 5,
      title: "Step 5: Decrypting the Message",
      caption: "The receiving agent calculates which columns are full vs short, slices the ciphertext into chunks for each column by rank, places them into the grid, and reads across rows to reveal the plain message.",
      key: "ZEBRAS",
      plaintext: "WEAREDISCOVERED",
      highlight: "reconstruct",
      details: "By placing EV into Col 4 (Rank 1), ACD into Col 2 (Rank 2), etc., the original message WE ARE DISCOVERED appears across the rows!"
    }
  ];

  return {
    AGENT_RANKS,
    MISSIONS,
    TRAINING_STEPS
  };
}));
