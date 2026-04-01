// Fallout TTRPG Perks Canonical Data

const perks = [
  {
    id: "WildWasteland",
    name: "Wild Wasteland",
    benefit: "Taking this trait adds and/or changes certain random encounters and locations which would not appear the same in-game without the trait.",
    levelReq: 2,
    prereqs: [],
    rank: 1
  },
  {
    id: "FriendOfTheNight",
    name: "Friend of the Night",
    benefit: "Your eyes adapt quickly to low-light conditions. Gives you Dark Vision.",
    levelReq: 2,
    prereqs: [
      { type: "attribute", code: "PE", value: 6 },
      { type: "skill", code: "Sneak", value: 30 }
    ],
    rank: 1
  },
  {
    id: "HeaveHo",
    name: "Heave, Ho!",
    benefit: "Doubles thrown weapon range.",
    levelReq: 2,
    prereqs: [
      { type: "attribute", code: "ST", value: 5 },
      { type: "skill", code: "Explosives", value: 30 }
    ],
    rank: 1
  },
  {
    id: "Hunter",
    name: "Hunter",
    benefit: "Gain +1 to the sweetspot of critical.",
    levelReq: 2,
    prereqs: [
      { type: "skill", code: "Survival", value: 30 }
    ],
    rank: 1
  },
  {
    id: "IntenseTraining",
    name: "Intense Training",
    benefit: "You can put a single point into any of your SPECIAL attributes.",
    levelReq: 2,
    prereqs: [],
    rank: 10
  },
  {
    id: "RapidReload",
    name: "Rapid Reload",
    benefit: "Reloading is a bonus action and not a full action.",
    levelReq: 2,
    prereqs: [
      { type: "attribute", code: "AG", value: 5 },
      { type: "skill", code: "Guns", value: 30 }
    ],
    rank: 1
  },
  {
    id: "SwiftLearner",
    name: "Swift Learner",
    benefit: "You gain an additional 10% whenever experience points are earned.",
    levelReq: 2,
    prereqs: [
      { type: "attribute", code: "IN", value: 4 }
    ],
    rank: 3
  },
  {
    id: "GoodReader",
    name: "Good Reader",
    benefit: "Skill magazines last twice as long.",
    levelReq: 2,
    prereqs: [
      { type: "attribute", code: "IN", value: 5 }
    ],
    rank: 1
  },
  {
    id: "Cannibal",
    name: "Cannibal",
    benefit: "Gain the option to eat a human corpse to regain 1d6 hit points.",
    levelReq: 4,
    prereqs: [],
    rank: 1
  },
  {
    id: "Entomologist",
    name: "Entomologist",
    benefit: "You do an additional 1d6 damage every time you attack a mutated insect.",
    levelReq: 4,
    prereqs: [
      { type: "attribute", code: "IN", value: 4 },
      { type: "skill", code: "Survival", value: 45 }
    ],
    rank: 1
  },
  {
    id: "RadChild",
    name: "Rad Child",
    benefit: "Regenerate 2 HP per second per 200 rads accumulated.",
    levelReq: 4,
    prereqs: [
      { type: "skill", code: "Survival", value: 70 }
    ],
    rank: 1
  },
  {
    id: "RunNGun",
    name: "Run 'n Gun",
    benefit: "One handed weapons have additional +1 to attack.",
    levelReq: 4,
    prereqs: [
      { type: "skill", code: "Guns", value: 45 }
      // If you wish to support OR logic (Guns 45 or Energy Weapons 45), see the note at the bottom
    ],
    rank: 1
  },
  {
    id: "TravelLight",
    name: "Travel Light",
    benefit: "While wearing light armor or no armor, you gain 10ft of movement.",
    levelReq: 4,
    prereqs: [
      { type: "skill", code: "Survival", value: 45 }
    ],
    rank: 1
  },
  {
    id: "BloodyMess",
    name: "Bloody Mess",
    benefit: "Add 1d4 to all damage.",
    levelReq: 6,
    prereqs: [],
    rank: 1
  },
  {
    id: "DemolitionExpert",
    name: "Demolition Expert",
    benefit: "Add 1 more damage dice to explosives.",
    levelReq: 6,
    prereqs: [
      { type: "skill", code: "Explosives", value: 50 }
    ],
    rank: 3
  },
  {
    id: "FerociousLoyalty",
    name: "Ferocious Loyalty",
    benefit: "When you drop below 50% HP anyone within a 5 ft space gains +1 to Armor Class.",
    levelReq: 6,
    prereqs: [
      { type: "attribute", code: "CH", value: 6 }
    ],
    rank: 1
  },
  {
    id: "FortuneFinder",
    name: "Fortune Finder",
    benefit: "Considerably more bottle caps will be found in stockpiles.",
    levelReq: 6,
    prereqs: [
      { type: "attribute", code: "LK", value: 5 }
    ],
    rank: 1
  },
  {
    id: "Gunslinger",
    name: "Gunslinger",
    benefit: "Ignore 1 AC in V.A.T.S. with one-handed weapons.",
    levelReq: 6,
    prereqs: [],
    rank: 1
  },
  {
    id: "ShotgunSurgeon",
    name: "Shotgun Surgeon",
    benefit: "When using shotguns, you ignore -2 AC to all enemies.",
    levelReq: 6,
    prereqs: [
      { type: "skill", code: "Guns", value: 45 }
    ],
    rank: 1
  },
  {
    id: "TheProfessional",
    name: "The Professional",
    benefit: "Sneak Attack Criticals with revolvers, pistols, and submachine guns inflict an additional 2 attack dice worth of damage.",
    levelReq: 6,
    prereqs: [],
    rank: 1
  },
  {
    id: "Toughness",
    name: "Toughness",
    benefit: "+2 AC permanently. As long as you are unarmored.",
    levelReq: 6,
    prereqs: [
      { type: "attribute", code: "EN", value: 5 }
    ],
    rank: 2
  },
  {
    id: "Commando",
    name: "Commando",
    benefit: "Ignore 1 AC accuracy in V.A.T.S. with two-handed weapons.",
    levelReq: 8,
    prereqs: [],
    rank: 1
  },
  {
    id: "Cowboy",
    name: "Cowboy",
    benefit: "Add +1 damage dice with dynamite, hatchets, knives, revolvers, and lever-action guns.",
    levelReq: 8,
    prereqs: [
      { type: "skill", code: "Guns", value: 45 },
      { type: "skill", code: "Melee", value: 45 }
    ],
    rank: 1
  },
  {
    id: "LivingAnatomy",
    name: "Living Anatomy",
    benefit: "Can ask for health and Armor class of any target.",
    levelReq: 8,
    prereqs: [
      { type: "skill", code: "Medicine", value: 70 }
    ],
    rank: 1
  },
  {
    id: "QuickDraw",
    name: "Quick Draw",
    benefit: "You can switch between weapons as a bonus action and not an action.",
    levelReq: 8,
    prereqs: [
      { type: "attribute", code: "AG", value: 5 }
    ],
    rank: 1
  },
  {
    id: "RadResistance",
    name: "Rad Resistance",
    benefit: "Radiation resistance permanently. Gain half radiation points.",
    levelReq: 8,
    prereqs: [
      { type: "attribute", code: "EN", value: 5 },
      { type: "skill", code: "Survival", value: 40 }
    ],
    rank: 1
  },
  {
    id: "Scrounger",
    name: "Scrounger",
    benefit: "Considerably more ammunition in stockpiles.",
    levelReq: 8,
    prereqs: [
      { type: "attribute", code: "LK", value: 5 }
    ],
    rank: 1
  },
  {
    id: "Stonewall",
    name: "Stonewall",
    benefit: "Add +1 AC against melee and unarmed attacks and cannot be knocked down during combat.",
    levelReq: 8,
    prereqs: [
      { type: "attribute", code: "ST", value: 6 },
      { type: "attribute", code: "EN", value: 6 }
    ],
    rank: 1
  },
  {
    id: "SuperSlam",
    name: "Super Slam!",
    benefit: "All melee (except thrown) and unarmed attacks have a chance of knocking your target down. D20: 16-20 for Unarmed, 14-20 for Melee.",
    levelReq: 8,
    prereqs: [
      { type: "attribute", code: "ST", value: 6 },
      { type: "skill", code: "Melee Weapons", value: 45 }
    ],
    rank: 1
  },
  {
    id: "TerrifyingPresence",
    name: "Terrifying Presence",
    benefit: "Can intimidate foes in dialogue. Roll against the overseer using speech bonus.",
    levelReq: 8,
    prereqs: [
      { type: "skill", code: "Speech", value: 70 }
    ],
    rank: 1
  },
  {
    id: "HereAndNow",
    name: "Here and Now",
    benefit: "You instantly level up again.",
    levelReq: 10,
    prereqs: [],
    rank: 1
  },
  {
    id: "AnimalFriend",
    name: "Animal Friend",
    benefit: "Rank 1: Hostile animals will not attack you unless you are the last remaining player. Rank 2: They assist in combat, but not against other animals.",
    levelReq: 10,
    prereqs: [
      { type: "attribute", code: "CH", value: 6 },
      { type: "skill", code: "Survival", value: 45 }
    ],
    rank: 2
  },
  {
    id: "Finesse",
    name: "Finesse",
    benefit: "Increase sweet spot of criticals by 1.",
    levelReq: 10,
    prereqs: [],
    rank: 1
  },
  {
    id: "MathWrath",
    name: "Math Wrath",
    benefit: "Reduces all AP costs by 1/2.",
    levelReq: 10,
    prereqs: [
      { type: "skill", code: "Science", value: 70 }
    ],
    rank: 1
  },
  {
    id: "MysteriousStranger",
    name: "Mysterious Stranger",
    benefit: "On a critical in V.A.T.S, chance the Mysterious Stranger will finish off a target (target must have under 20% health).",
    levelReq: 10,
    prereqs: [
      { type: "attribute", code: "LK", value: 6 }
    ],
    rank: 1
  },
  {
    id: "MissFortune",
    name: "Miss Fortune",
    benefit: "On critical chance Miss Fortune will incapacitate a target in V.A.T.S. (target must have Strength lower than 5).",
    levelReq: 10,
    prereqs: [
      { type: "attribute", code: "LK", value: 6 }
    ],
    rank: 1
  },
  {
    id: "NerdRage",
    name: "Nerd Rage!",
    benefit: "Add +3 to AC and unarmed and melee damage add an extra 2 damage dice.",
    levelReq: 10,
    prereqs: [
      { type: "attribute", code: "IN", value: 5 },
      { type: "skill", code: "Science", value: 50 }
    ],
    rank: 1
  },
  {
    id: "PlasmaSpaz",
    name: "Plasma Spaz",
    benefit: "AP costs for all plasma weapons are reduced by 2 Points.",
    levelReq: 10,
    prereqs: [
      { type: "skill", code: "Energy Weapons", value: 70 }
    ],
    rank: 1
  },
  {
    id: "FastMetabolism",
    name: "Fast Metabolism",
    benefit: "Give an additional hit dice restored with stimpaks.",
    levelReq: 12,
    prereqs: [],
    rank: 1
  },
  {
    id: "GhastlyScavenger",
    name: "Ghastly Scavenger",
    benefit: "You gain the option to eat a super mutant or feral ghoul corpse to regain 1d4 hit points.",
    levelReq: 12,
    prereqs: [
      { type: "perk", code: "Cannibal", value: 1 }
    ],
    rank: 1
  },
  {
    id: "HitTheDeck",
    name: "Hit the Deck",
    benefit: "Half damage against explosives.",
    levelReq: 12,
    prereqs: [
      { type: "skill", code: "Explosives", value: 70 }
    ],
    rank: 1
  },
  {
    id: "LifeGiver",
    name: "Life Giver",
    benefit: "Gain +10 hit points for ranks 1 and 2, rank 3 gain the ability to give yourself 1d10 healing once per long rest.",
    levelReq: 12,
    prereqs: [
      { type: "attribute", code: "EN", value: 6 }
    ],
    rank: 1
  },
  {
    id: "PiercingStrike",
    name: "Piercing Strike",
    benefit: "All your unarmed and melee attacks negate 1 point of AC against enemies.",
    levelReq: 12,
    prereqs: [
      { type: "skill", code: "Unarmed", value: 70 }
    ],
    rank: 1
  },
  {
    id: "Pyromaniac",
    name: "Pyromaniac",
    benefit: "Add an additional hit die with fire-based weapons.",
    levelReq: 12,
    prereqs: [
      { type: "skill", code: "Explosives", value: 60 }
    ],
    rank: 1
  },
  {
    id: "RoboticsExpert",
    name: "Robotics Expert",
    benefit: "1d6 extra damage to robots; can shut down robots by sneaking up and deactivating. Some robots require Terminal mini game.",
    levelReq: 12,
    prereqs: [
      { type: "skill", code: "Science", value: 50 }
    ],
    rank: 1
  },
  {
    id: "Sniper",
    name: "Sniper",
    benefit: "25% more likely to hit the target's head in V.A.T.S.",
    levelReq: 12,
    prereqs: [
      { type: "attribute", code: "PE", value: 6 },
      { type: "attribute", code: "AG", value: 6 }
    ],
    rank: 1
  },
  {
    id: "SplashDamage",
    name: "Splash Damage",
    benefit: "Explosives have a 10 ft larger area of effect.",
    levelReq: 12,
    prereqs: [
      { type: "skill", code: "Explosives", value: 70 }
    ],
    rank: 1
  },
  {
    id: "Chemist",
    name: "Chemist",
    benefit: "Chems last twice as long.",
    levelReq: 14,
    prereqs: [
      { type: "skill", code: "Medicine", value: 60 }
    ],
    rank: 1
  },
  {
    id: "CenterOfMass",
    name: "Center of Mass",
    benefit: "You do an additional 1d4 additional damage when targeting the torso.",
    levelReq: 14,
    prereqs: [
      { type: "skill", code: "Guns", value: 70 }
    ],
    rank: 1
  },
  {
    id: "LightStep",
    name: "Light Step",
    benefit: "Floor traps or mines will not be set off.",
    levelReq: 14,
    prereqs: [
      { type: "attribute", code: "PE", value: 6 },
      { type: "attribute", code: "AG", value: 6 }
    ],
    rank: 1
  },
  {
    id: "Purifier",
    name: "Purifier",
    benefit: "You do an extra damage die with melee and unarmed weapons against centaurs, night stalkers, spore plants, spore carriers, deathclaws and super mutants.",
    levelReq: 14,
    prereqs: [],
    rank: 1
  },
  {
    id: "ActionBoyGirl",
    name: "Action Boy/Action Girl",
    benefit: "15 Action Points.",
    levelReq: 16,
    prereqs: [
      { type: "attribute", code: "AG", value: 6 }
    ],
    rank: 2
  },
  {
    id: "BetterCriticals",
    name: "Better Criticals",
    benefit: "1 extra hit die damage with critical hits.",
    levelReq: 16,
    prereqs: [
      { type: "attribute", code: "PE", value: 6 },
      { type: "attribute", code: "LK", value: 6 }
    ],
    rank: 1
  },
  {
    id: "ChemResistant",
    name: "Chem Resistant",
    benefit: "Rank 1: Half as likely to get addicted. Rank 2: You can no longer be addicted.",
    levelReq: 16,
    prereqs: [
      { type: "skill", code: "Medicine", value: 60 }
    ],
    rank: 2
  },
  {
    id: "Meltdown",
    name: "Meltdown",
    benefit: "Foes killed by your Energy Weapons explode causing 1d6 damage to anything in a 5 ft radius.",
    levelReq: 16,
    prereqs: [
      { type: "skill", code: "Energy Weapons", value: 90 }
    ],
    rank: 1
  },
  {
    id: "Tag",
    name: "Tag!",
    benefit: "Fourth 'tag' skill: +15 points to that skill.",
    levelReq: 16,
    prereqs: [],
    rank: 1
  },
  {
    id: "ComputerWhiz",
    name: "Computer Whiz",
    benefit: "Can make one extra attempt on terminal.",
    levelReq: 18,
    prereqs: [
      { type: "attribute", code: "IN", value: 7 },
      { type: "skill", code: "Science", value: 70 }
    ],
    rank: 1
  },
  {
    id: "ConcentratedFire",
    name: "Concentrated Fire",
    benefit: "Increase sweet spot accuracy in V.A.T.S. by 1 with every subsequent attack on a given body part queued.",
    levelReq: 18,
    prereqs: [
      { type: "skill", code: "Energy Weapons", value: 60 },
      { type: "skill", code: "Guns", value: 60 }
    ],
    rank: 1
  },
  {
    id: "Infiltrator",
    name: "Infiltrator",
    benefit: "Can make one more attempt to pick a broken lock.",
    levelReq: 18,
    prereqs: [
      { type: "attribute", code: "PE", value: 7 },
      { type: "skill", code: "Lockpick", value: 70 }
    ],
    rank: 1
  },
  {
    id: "WalkerInstinct",
    name: "Walker Instinct",
    benefit: "+1 Perception and Agility when outside.",
    levelReq: 18,
    prereqs: [
      { type: "skill", code: "Survival", value: 50 }
    ],
    rank: 1
  },
  {
    id: "GrimReapersSprint",
    name: "Grim Reaper's Sprint",
    benefit: "A kill in V.A.T.S. restores 20 AP immediately.",
    levelReq: 20,
    prereqs: [],
    rank: 1
  },
  {
    id: "Ninja",
    name: "Ninja",
    benefit: "CD stars, daggers, tranq guns, and syringe rifle all have 1 extra damage die.",
    levelReq: 20,
    prereqs: [
      { type: "skill", code: "Melee Weapons", value: 80 },
      { type: "skill", code: "Sneak", value: 80 }
    ],
    rank: 1
  },
  {
    id: "IrradiatedBeauty",
    name: "Irradiated Beauty",
    benefit: "Sleep removes all Rads.",
    levelReq: 22,
    prereqs: [
      { type: "attribute", code: "EN", value: 8 }
    ],
    rank: 1
  },
  {
    id: "LaserCommander",
    name: "Laser Commander",
    benefit: "You do an extra 1d6 damage with laser weapons.",
    levelReq: 22,
    prereqs: [
      { type: "skill", code: "Energy Weapons", value: 90 }
    ],
    rank: 1
  },
  {
    id: "SprayAndPray",
    name: "Spray and Pray",
    benefit: "Your attacks do half damage to companions.",
    levelReq: 22,
    prereqs: [],
    rank: 1
  },
  {
    id: "Slayer",
    name: "Slayer",
    benefit: "Action Surge: you can make 1 extra attack per turn. Refreshes on long rest.",
    levelReq: 24,
    prereqs: [
      { type: "attribute", code: "AG", value: 7 },
      { type: "skill", code: "Unarmed", value: 90 }
    ],
    rank: 1
  },
  {
    id: "TunnelRunner",
    name: "Tunnel Runner",
    benefit: "When you take the sneak action, you gain 10ft of extra movement for the first turn if you haven't been spotted.",
    levelReq: 24,
    prereqs: [
      { type: "attribute", code: "AG", value: 8 }
    ],
    rank: 1
  },
  {
    id: "NervesOfSteel",
    name: "Nerves of Steel",
    benefit: "Full AP Regeneration on Short Rest.",
    levelReq: 26,
    prereqs: [
      { type: "attribute", code: "AG", value: 7 }
    ],
    rank: 1
  },
  {
    id: "RadAbsorption",
    name: "Rad Absorption",
    benefit: "-1 Rad every turn in combat. Out of combat may short rest for full radiation healing.",
    levelReq: 28,
    prereqs: [
      { type: "attribute", code: "EN", value: 7 }
    ],
    rank: 1
  },
  {
    id: "CertifiedTech",
    name: "Certified Tech",
    benefit: "Increase critical sweet spot by 2 against robots.",
    levelReq: 40,
    prereqs: [],
    rank: 1
  }
];

// If you need "OR" logic (e.g. "Guns 45 OR Energy Weapons 45") for some perks later, you can use:
// prereqs: [ { type: "skill", code: "Guns", value: 45 }, { type: "skill", code: "Energy Weapons", value: 45, orGroup: true }]
// And update selection logic accordingly.

// Make available globally for non-module scripts
if (typeof window !== 'undefined') { window.PERKS_POOL = perks; }
export default perks;
