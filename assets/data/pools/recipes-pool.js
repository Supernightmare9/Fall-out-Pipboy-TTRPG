// recipes-pool.js
// Master recipe list for Fall-out Pipboy TTRPG.
// Ingredients can be:
//   - A plain string name matching an item in junk.js or items.js (e.g. "Wonderglue")
//   - A wildcard object { type: '<type>', name: '<display>' } matching ANY item of that
//     type from either pool (e.g. { type: 'metal', name: 'Any Metal' })
//   - A string starting with "Any " is also treated as a wildcard display label.
//
// Categories mirror inventory item types for UI filtering:
//   "Aid" | "Food" | "Drink" | "Chem" | "Utility" | "Weapon" | "Armor" | "Misc"

window.recipesPool = [
  {
    id: "recipe_improvised_stimpak",
    name: "Improvised Stimpak",
    category: "Aid",
    ingredients: [
      "Blood Pack",
      "Antiseptic Bottle",
      { type: "metal", name: "Any Metal" }
    ],
    requiredSkill: "Medicine",
    effect: "Restores 10 HP",
    weight: 0.1,
    value: 40,
    description: "A crude but effective field-medicine syringe."
  },
  {
    id: "recipe_rad_x_alternative",
    name: "Rad-X Alternative",
    category: "Aid",
    ingredients: [
      "Bloodleaf",
      "Agave Fruit",
      { type: "glass", name: "Any Glass" }
    ],
    requiredSkill: "Survival",
    effect: "+15 Rad Healing",
    weight: 0.1,
    value: 35,
    description: "A herbal brew that flushes radiation from the bloodstream."
  },
  {
    id: "recipe_wasteland_omelette",
    name: "Wasteland Omelette",
    category: "Food",
    ingredients: [
      "Ant Egg",
      "Bighorner Meat",
      "Purified Water"
    ],
    requiredSkill: "Survival",
    effect: "Restores 15 HP",
    weight: 0.5,
    value: 15,
    description: "A surprisingly filling wasteland breakfast."
  },
  {
    id: "recipe_weapon_repair_kit",
    name: "Weapon Repair Kit",
    category: "Utility",
    ingredients: [
      "Adjustable Wrench",
      "Duct Tape",
      "Wonderglue",
      { type: "metal", name: "Any Metal" }
    ],
    requiredSkill: "Repair",
    effect: "Restores any broken weapon",
    weight: 1,
    value: 60,
    description: "Everything needed to patch up a damaged firearm or blade."
  },
  {
    id: "recipe_homemade_jet",
    name: "Homemade Jet",
    category: "Chem",
    ingredients: [
      { type: "plastic", name: "Any Plastic" },
      "Fertilizer Bag",
      "Acid Vial"
    ],
    requiredSkill: "Science",
    effect: "Temp +10 AP",
    weight: 0.1,
    value: 80,
    description: "A potent stimulant cobbled together from industrial chemicals."
  },
  {
    id: "recipe_purified_water",
    name: "Purified Water",
    category: "Drink",
    ingredients: [
      "Dirty Water",
      { type: "glass", name: "Any Glass" },
      "Charcoal"
    ],
    requiredSkill: "Survival",
    effect: "Restores 10 HP, no Rads",
    weight: 1,
    value: 20,
    description: "Filtered wasteland water, safe to drink."
  },
  {
    id: "recipe_metal_plating",
    name: "Metal Plating",
    category: "Armor",
    ingredients: [
      { type: "metal", name: "Any Metal" },
      { type: "metal", name: "Any Metal" },
      "Wonderglue"
    ],
    requiredSkill: "Repair",
    effect: "+1 AC to armor piece",
    weight: 3,
    value: 50,
    description: "Scavenged metal sheets bolted over existing armor."
  },
  {
    id: "recipe_molotov_cocktail",
    name: "Molotov Cocktail",
    category: "Weapon",
    ingredients: [
      { type: "glass", name: "Any Glass" },
      { type: "liquid", name: "Any Liquid" },
      { type: "cloth", name: "Any Cloth" }
    ],
    requiredSkill: "Repair",
    effect: "2d6 fire AoE on impact",
    weight: 0.5,
    value: 30,
    description: "An improvised incendiary device."
  },
  {
    id: "recipe_improvised_explosive",
    name: "Improvised Explosive",
    category: "Weapon",
    ingredients: [
      { type: "chemical", name: "Any Chemical" },
      { type: "electronic", name: "Any Electronic" },
      { type: "metal", name: "Any Metal" }
    ],
    requiredSkill: "Science",
    effect: "3d6 explosive AoE",
    weight: 1,
    value: 120,
    description: "A jury-rigged bomb wired to a salvaged detonator."
  },
  {
    id: "recipe_wasteland_jerky",
    name: "Wasteland Jerky",
    category: "Food",
    ingredients: [
      { type: "organic", name: "Any Meat/Organic" },
      "Charcoal"
    ],
    requiredSkill: "Survival",
    effect: "Restores 8 HP, lasts 2 days",
    weight: 0.2,
    value: 10,
    description: "Dried and smoked wasteland protein."
  }
];
