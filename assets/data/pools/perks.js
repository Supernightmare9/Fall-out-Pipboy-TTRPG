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
    id: "RunnGun",
    name: "Run 'n Gun",
    benefit: "One handed weapons have additional +1 to attack.",
    levelReq: 4,
    prereqs: [
      // OR is possible between Guns or Energy Weapons, but default structure supports AND. Consider for future logic.
      { type: "skill", code: "Guns", value: 45 }
      // If "or" needed, see note below for complex pre-req structure.
    ],
    rank: 1
  },
  // ... continue for each perk in the same object format
];

// e.g., to handle OR in prereqs, use this style:
//
// prereqs: [
//   [{ type: "skill", code: "Guns", value: 45 }, { type: "skill", code: "Energy Weapons", value: 45 }]
// ]
//
// and in logic: if any element inside the sub-array passes, that's enough for that bundle of requirements.
// For now, your description specified "AND only," so the simpler model is used.

export default perks;
