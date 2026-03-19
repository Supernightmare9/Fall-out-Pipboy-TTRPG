// items.js
// Item Catalog for Fall-out Pipboy TTRPG
// Used by the Overseer to distribute loot and by players to manage inventory.
// type: "weapon" | "armor" | "consumable" | "misc"
// rarity: "common" | "uncommon" | "rare" | "legendary"

const ITEMS = [
  // ── WEAPONS ───────────────────────────────────────────────────────────────
  {
    id: "item_10mm_pistol_1",
    name: "10mm Pistol",
    type: "weapon",
    rarity: "common",
    weight: 2.5,
    value: 75,
    description: "A reliable semi-automatic pistol chambered in 10mm. A staple sidearm of the wasteland.",
    properties: ["Ranged", "Semi-Auto", "10mm Ammo"]
  },
  {
    id: "item_combat_rifle_1",
    name: "Combat Rifle",
    type: "weapon",
    rarity: "uncommon",
    weight: 8,
    value: 350,
    description: "A versatile, select-fire rifle designed for mid-range combat. Reliable and easy to maintain.",
    properties: ["Ranged", "Semi-Auto", "Full-Auto", ".45 Ammo"]
  },
  {
    id: "item_super_sledge_1",
    name: "Super Sledge",
    type: "weapon",
    rarity: "uncommon",
    weight: 20,
    value: 400,
    description: "A massive two-handed sledgehammer with a kinetic energy store that amplifies the impact of each swing.",
    properties: ["Melee", "Two-Handed", "Kinetic Amplifier"]
  },
  {
    id: "item_minigun_1",
    name: "Minigun",
    type: "weapon",
    rarity: "rare",
    weight: 27,
    value: 1200,
    description: "A six-barreled rotary cannon capable of firing thousands of rounds per minute. Devastating against unarmored targets.",
    properties: ["Ranged", "Full-Auto", "Heavy Weapon", "5mm Ammo"]
  },
  {
    id: "item_hunting_knife_1",
    name: "Hunting Knife",
    type: "weapon",
    rarity: "common",
    weight: 1,
    value: 30,
    description: "A sharp, single-edged blade. Lightweight and easily concealed, favored by scouts and wastelanders alike.",
    properties: ["Melee", "One-Handed", "Concealable"]
  },
  // ── ARMOR ─────────────────────────────────────────────────────────────────
  {
    id: "item_leather_armor_1",
    name: "Leather Armor",
    type: "armor",
    rarity: "common",
    weight: 10,
    value: 100,
    description: "Panels of hardened leather stitched together for basic protection. Light enough to allow free movement.",
    properties: ["Light Armor", "DR 10"]
  },
  {
    id: "item_combat_armor_1",
    name: "Combat Armor",
    type: "armor",
    rarity: "uncommon",
    weight: 22,
    value: 600,
    description: "Military-grade modular armor plating. Offers solid ballistic protection without sacrificing mobility.",
    properties: ["Medium Armor", "DR 20", "Modular"]
  },
  {
    id: "item_power_armor_1",
    name: "T-51 Power Armor",
    type: "armor",
    rarity: "rare",
    weight: 60,
    value: 5000,
    description: "Pre-war military-issue power armor. Hydraulic joints multiply the wearer's strength and a sealed suit provides environmental protection.",
    properties: ["Heavy Armor", "DR 40", "Strength Boost", "Sealed Environment", "Fusion Core Required"]
  },
  // ── CONSUMABLES ───────────────────────────────────────────────────────────
  {
    id: "item_stimpak_1",
    name: "Stimpak",
    type: "consumable",
    rarity: "common",
    weight: 0.1,
    value: 60,
    description: "A syringer filled with healing compounds and Med-X. Immediately restores a moderate amount of hit points.",
    properties: ["Heal 30 HP", "Instant"]
  },
  {
    id: "item_rad_away_1",
    name: "RadAway",
    type: "consumable",
    rarity: "common",
    weight: 0.1,
    value: 50,
    description: "An intravenous chemical solution that bonds with radioactive particles and flushes them from the body.",
    properties: ["Remove 50 Rads", "Instant"]
  },
  {
    id: "item_nuka_cola_1",
    name: "Nuka-Cola",
    type: "consumable",
    rarity: "common",
    weight: 1,
    value: 20,
    description: "The most popular soft drink of the pre-war era, still found stashed away across the wasteland. Refreshing, if mildly irradiated.",
    properties: ["Restore 10 HP", "+5 Rads"]
  },
  {
    id: "item_psycho_1",
    name: "Psycho",
    type: "consumable",
    rarity: "uncommon",
    weight: 0.1,
    value: 120,
    description: "A powerful combat stimulant developed during the Resource Wars. Grants bursts of aggression and pain resistance at the cost of perception.",
    properties: ["Damage Resistance +25%", "Damage Dealt +25%", "Duration: 3 rounds", "Addiction Risk"]
  },
  // ── MISC ──────────────────────────────────────────────────────────────────
  {
    id: "item_caps_1",
    name: "Bottle Caps",
    type: "misc",
    rarity: "common",
    weight: 0,
    value: 1,
    description: "Pre-war bottle caps. The standard currency of the wasteland, backed by the scarcity of clean water.",
    properties: ["Currency"]
  },
  {
    id: "item_frag_grenade_1",
    name: "Frag Grenade",
    type: "misc",
    rarity: "common",
    weight: 0.5,
    value: 100,
    description: "A standard fragmentation grenade. Pull the pin and throw for area-of-effect explosive damage.",
    properties: ["Thrown", "AoE", "Explosive Damage"]
  },
  {
    id: "item_legendary_mod_1",
    name: "Legendary Weapon Mod",
    type: "misc",
    rarity: "legendary",
    weight: 0.5,
    value: 2000,
    description: "A rare modification salvaged from a legendary creature. Can be applied to any compatible weapon to grant a powerful unique effect.",
    properties: ["Weapon Upgrade", "Unique Effect", "Rare Drop"]
  },
  // ── CRAFTING / LOOT ───────────────────────────────────────────────────────
  {
    id: "item_radroach_meat_1",
    name: "Radroach Meat",
    type: "misc",
    rarity: "common",
    weight: 0.2,
    value: 5,
    description: "Stringy, slightly glowing meat cut from a radroach. Edible if cooked, though not exactly appetizing.",
    properties: ["Crafting Ingredient", "Food Source"]
  },
  {
    id: "item_dog_meat_1",
    name: "Dog Meat",
    type: "misc",
    rarity: "common",
    weight: 0.5,
    value: 8,
    description: "Rough-cut meat from a feral dog. A reliable protein source for wastelanders in desperate times.",
    properties: ["Crafting Ingredient", "Food Source"]
  },
  {
    id: "item_mirelurk_meat_1",
    name: "Mirelurk Meat",
    type: "misc",
    rarity: "uncommon",
    weight: 1,
    value: 25,
    description: "Dense, pale meat harvested from a Mirelurk. High in nutrients and surprisingly tasty when properly prepared.",
    properties: ["Crafting Ingredient", "Food Source", "Restore 15 HP when cooked"]
  },
  {
    id: "item_mirelurk_shell_1",
    name: "Mirelurk Shell Fragment",
    type: "misc",
    rarity: "uncommon",
    weight: 3,
    value: 60,
    description: "A thick shard of Mirelurk chitin. Prized by armorers for its natural ballistic resistance.",
    properties: ["Crafting Ingredient", "Armor Component"]
  },
  {
    id: "item_deathclaw_hand_1",
    name: "Deathclaw Hand",
    type: "misc",
    rarity: "rare",
    weight: 10,
    value: 500,
    description: "The severed claw of a Deathclaw. Each finger-talon is as long as a combat knife. Coveted for crafting and trade.",
    properties: ["Crafting Ingredient", "Trophy", "Melee Weapon Blueprint Component"]
  },
  {
    id: "item_deathclaw_hide_1",
    name: "Deathclaw Hide",
    type: "misc",
    rarity: "rare",
    weight: 15,
    value: 750,
    description: "Thick, scaly hide stripped from a Deathclaw carcass. Incredibly tough material used to craft high-quality armor.",
    properties: ["Crafting Ingredient", "Armor Component"]
  }
];
