// enemies.js
// Enemy Bestiary for Fall-out Pipboy TTRPG
// Used by the Overseer to populate combat encounters.
// difficulty: "common" | "uncommon" | "rare" | "legendary"

const ENEMIES = [
  // ── COMMON ────────────────────────────────────────────────────────────────
  {
    id: "enemy_ghoul_1",
    name: "Feral Ghoul",
    type: "ghoul",
    hp: 30,
    maxHp: 30,
    ac: 11,
    initiative: 3,
    description: "A radiation-warped former human driven mad by prolonged exposure. Fast, relentless, and nearly mindless.",
    abilities: ["Feral Charge", "Radiation Scratch"],
    loot: ["item_caps_1", "item_rad_away_1"],
    difficulty: "common"
  },
  {
    id: "enemy_radroach_1",
    name: "Radroach",
    type: "insect",
    hp: 10,
    maxHp: 10,
    ac: 9,
    initiative: 5,
    description: "A cockroach mutated to roughly the size of a large cat by residual radiation. They swarm in packs.",
    abilities: ["Swarm", "Radiation Bite"],
    loot: ["item_radroach_meat_1"],
    difficulty: "common"
  },
  {
    id: "enemy_raider_1",
    name: "Raider",
    type: "human",
    hp: 40,
    maxHp: 40,
    ac: 12,
    initiative: 2,
    description: "A lawless scavenger who preys on wastelanders. Armed with scavenged weapons and driven by greed.",
    abilities: ["Ambush", "Intimidate"],
    loot: ["item_10mm_pistol_1", "item_caps_1", "item_stimpak_1"],
    difficulty: "common"
  },
  {
    id: "enemy_feral_dog_1",
    name: "Feral Dog",
    type: "animal",
    hp: 20,
    maxHp: 20,
    ac: 10,
    initiative: 4,
    description: "A once-domesticated dog gone wild in the wasteland. Travels in packs and attacks on sight.",
    abilities: ["Pack Tactics", "Savage Bite"],
    loot: ["item_dog_meat_1"],
    difficulty: "common"
  },
  // ── UNCOMMON ──────────────────────────────────────────────────────────────
  {
    id: "enemy_super_mutant_1",
    name: "Super Mutant Brute",
    type: "super_mutant",
    hp: 80,
    maxHp: 80,
    ac: 14,
    initiative: 1,
    description: "A human transformed by the Forced Evolutionary Virus into a massive, green-skinned behemoth with limited intelligence but tremendous strength.",
    abilities: ["Mighty Smash", "Battle Cry", "Thick Hide"],
    loot: ["item_super_sledge_1", "item_caps_1", "item_stimpak_1"],
    difficulty: "uncommon"
  },
  {
    id: "enemy_mirelurk_1",
    name: "Mirelurk",
    type: "crustacean",
    hp: 60,
    maxHp: 60,
    ac: 15,
    initiative: 2,
    description: "A bipedal, crab-like mutant that lurks in irradiated water. Its chitinous shell is nearly impervious to small arms fire.",
    abilities: ["Shell Block", "Claw Pinch", "Aquatic Ambush"],
    loot: ["item_mirelurk_meat_1", "item_mirelurk_shell_1"],
    difficulty: "uncommon"
  },
  {
    id: "enemy_ghoul_reaver_1",
    name: "Ghoul Reaver",
    type: "ghoul",
    hp: 55,
    maxHp: 55,
    ac: 13,
    initiative: 3,
    description: "A heavily irradiated ghoul that has absorbed so much radiation it can emit lethal bursts of energy.",
    abilities: ["Radiation Burst", "Feral Charge", "Radiation Aura"],
    loot: ["item_rad_away_1", "item_caps_1"],
    difficulty: "uncommon"
  },
  // ── RARE ──────────────────────────────────────────────────────────────────
  {
    id: "enemy_deathclaw_1",
    name: "Deathclaw",
    type: "mutant_lizard",
    hp: 120,
    maxHp: 120,
    ac: 17,
    initiative: 4,
    description: "The apex predator of the wasteland. Originally a Jackson's Chameleon mutated by the FEV and radiation, now standing over six feet tall with razor-sharp claws.",
    abilities: ["Rending Claws", "Terrifying Roar", "Pounce", "Iron Hide"],
    loot: ["item_deathclaw_hand_1", "item_deathclaw_hide_1"],
    difficulty: "rare"
  },
  {
    id: "enemy_super_mutant_overlord_1",
    name: "Super Mutant Overlord",
    type: "super_mutant",
    hp: 130,
    maxHp: 130,
    ac: 16,
    initiative: 2,
    description: "An older, more battle-hardened Super Mutant that has survived long enough to develop crude tactical intelligence. Commands lesser mutants.",
    abilities: ["Rally Mutants", "Frag Grenade Throw", "Suppressive Fire", "Adrenaline Surge"],
    loot: ["item_minigun_1", "item_frag_grenade_1", "item_stimpak_1"],
    difficulty: "rare"
  },
  // ── LEGENDARY ─────────────────────────────────────────────────────────────
  {
    id: "enemy_deathclaw_alpha_1",
    name: "Alpha Deathclaw",
    type: "mutant_lizard",
    hp: 220,
    maxHp: 220,
    ac: 19,
    initiative: 5,
    description: "The pack leader of a Deathclaw brood. Larger, faster, and more cunning than common Deathclaws, it coordinates attacks with brutal efficiency.",
    abilities: ["Alpha Strike", "Rending Claws", "Terrifying Roar", "Pounce", "Regeneration", "Pack Leader"],
    loot: ["item_deathclaw_hand_1", "item_deathclaw_hide_1", "item_caps_1", "item_legendary_mod_1"],
    difficulty: "legendary"
  },
  {
    id: "enemy_raider_boss_1",
    name: "Raider Warlord",
    type: "human",
    hp: 180,
    maxHp: 180,
    ac: 18,
    initiative: 3,
    description: "The ruthless leader of a major raider gang. Armed with the best loot from countless victims and surrounded by loyal lieutenants.",
    abilities: ["Call Reinforcements", "Suppressive Fire", "Frag Grenade Throw", "Intimidating Presence", "Last Stand"],
    loot: ["item_combat_rifle_1", "item_combat_armor_1", "item_caps_1", "item_stimpak_1"],
    difficulty: "legendary"
  }
];
