// assets/logic/crafting-utils.test.js
// Tests for CraftingUtils — cross-pool ingredient resolution, crafting checks,
// ingredient consumption, and filtering helpers.

const CraftingUtils = require('./crafting-utils');

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const JUNK_POOL = [
  { name: 'Wonderglue',            type: 'adhesive',   weight: 0.5, value: 15 },
  { name: 'Duct Tape',             type: 'adhesive',   weight: 0.5, value: 10 },
  { name: 'Tin Can',               type: 'metal',      weight: 0.2, value: 2  },
  { name: 'Scrap Metal',           type: 'metal',      weight: 2,   value: 4  },
  { name: 'Blood Pack',            type: 'medical',    weight: 0.25,value: 25 },
  { name: 'Antiseptic Bottle',     type: 'medical',    weight: 0.5, value: 10 },
  { name: 'Empty Nuka-Cola Bottle',type: 'glass',      weight: 0.5, value: 2  },
  { name: 'Glass Shard',           type: 'glass',      weight: 0.2, value: 2  },
  { name: 'Fertilizer Bag',        type: 'chemical',   weight: 2,   value: 5  },
  { name: 'Acid Vial',             type: 'chemical',   weight: 0.2, value: 8  },
  { name: 'Plastic Scrap',         type: 'plastic',    weight: 0.5, value: 3  },
  { name: 'Cloth Rags',            type: 'cloth',      weight: 0.3, value: 2  },
  { name: 'Dirty Water',           type: 'liquid',     weight: 1,   value: 1  },
  { name: 'Purified Water',        type: 'liquid',     weight: 1,   value: 20 },
  { name: 'Charcoal',              type: 'chemical',   weight: 0.5, value: 3  },
  { name: 'Bloodleaf',             type: 'organic',    weight: 0.1, value: 8  },
  { name: 'Agave Fruit',           type: 'organic',    weight: 0.3, value: 6  },
  { name: 'Ant Egg',               type: 'organic',    weight: 0.5, value: 5  },
  { name: 'Bighorner Meat',        type: 'organic',    weight: 1,   value: 8  },
];

const ITEM_POOL = [
  { id: 'item_stimpak_1',    name: 'Stimpak',    type: 'consumable', rarity: 'common'   },
  { id: 'item_10mm_pistol_1',name: '10mm Pistol',type: 'weapon',     rarity: 'common'   },
  { id: 'item_leather_1',    name: 'Leather Armor', type: 'armor',   rarity: 'common'   },
];

// ─── isWildcard ───────────────────────────────────────────────────────────────

describe('isWildcard', () => {
  test('returns true for { type } objects', () => {
    expect(CraftingUtils.isWildcard({ type: 'metal', name: 'Any Metal' })).toBe(true);
  });
  test('returns true for strings starting with "Any "', () => {
    expect(CraftingUtils.isWildcard('Any Chem')).toBe(true);
  });
  test('returns false for plain name strings', () => {
    expect(CraftingUtils.isWildcard('Wonderglue')).toBe(false);
  });
  test('returns false for objects without type', () => {
    expect(CraftingUtils.isWildcard({ name: 'Stimpak' })).toBe(false);
  });
});

// ─── normaliseIngredient ──────────────────────────────────────────────────────

describe('normaliseIngredient', () => {
  test('plain string → name with null type', () => {
    const r = CraftingUtils.normaliseIngredient('Blood Pack');
    expect(r).toEqual({ name: 'Blood Pack', type: null });
  });
  test('{ type, name } object → preserved', () => {
    const r = CraftingUtils.normaliseIngredient({ type: 'metal', name: 'Any Metal' });
    expect(r).toEqual({ name: 'Any Metal', type: 'metal' });
  });
  test('"Any Chem" string → derives type "chem"', () => {
    const r = CraftingUtils.normaliseIngredient('Any Chem');
    expect(r.type).toBe('chem');
  });
  test('"Any Metal" string → derives type "metal"', () => {
    const r = CraftingUtils.normaliseIngredient('Any Metal');
    expect(r.type).toBe('metal');
  });
});

// ─── findItemInPools ──────────────────────────────────────────────────────────

describe('findItemInPools', () => {
  test('finds item by exact name in junk pool', () => {
    const result = CraftingUtils.findItemInPools('Wonderglue', JUNK_POOL, ITEM_POOL);
    expect(result).not.toBeNull();
    expect(result.name).toBe('Wonderglue');
  });

  test('finds item by exact name in inventory pool when not in junk', () => {
    const result = CraftingUtils.findItemInPools('Stimpak', JUNK_POOL, ITEM_POOL);
    expect(result).not.toBeNull();
    expect(result.name).toBe('Stimpak');
  });

  test('junk pool takes priority over inventory pool for same name', () => {
    const junk = [{ name: 'Steel', type: 'metal' }];
    const inv  = [{ id: 'steel_inv', name: 'Steel', type: 'misc' }];
    const result = CraftingUtils.findItemInPools('Steel', junk, inv);
    expect(result.type).toBe('metal');
  });

  test('wildcard { type } matches first junk item with that type', () => {
    const result = CraftingUtils.findItemInPools({ type: 'metal', name: 'Any Metal' }, JUNK_POOL, ITEM_POOL);
    expect(result).not.toBeNull();
    expect(result.type).toBe('metal');
  });

  test('wildcard falls through to inventory pool when junk has no match', () => {
    const result = CraftingUtils.findItemInPools({ type: 'weapon', name: 'Any Weapon' }, JUNK_POOL, ITEM_POOL);
    expect(result).not.toBeNull();
    expect(result.type).toBe('weapon');
  });

  test('returns null when nothing matches', () => {
    const result = CraftingUtils.findItemInPools('Unobtainium', JUNK_POOL, ITEM_POOL);
    expect(result).toBeNull();
  });
});

// ─── checkIngredient ─────────────────────────────────────────────────────────

describe('checkIngredient', () => {
  const playerInv  = [{ uid: 'u1', id: 'item_stimpak_1', name: 'Stimpak', type: 'consumable', quantity: 2 }];
  const playerJunk = [{ name: 'Tin Can', type: 'metal', quantity: 3 }];

  test('exact name match in junk stash', () => {
    expect(CraftingUtils.checkIngredient('Tin Can', playerInv, playerJunk, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('exact name match in inventory', () => {
    expect(CraftingUtils.checkIngredient('Stimpak', playerInv, playerJunk, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('wildcard type match in junk stash', () => {
    expect(CraftingUtils.checkIngredient({ type: 'metal', name: 'Any Metal' }, playerInv, playerJunk, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('wildcard type match in inventory when not in junk', () => {
    expect(CraftingUtils.checkIngredient({ type: 'consumable', name: 'Any Consumable' }, playerInv, playerJunk, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('returns false when item not held', () => {
    expect(CraftingUtils.checkIngredient('Wonderglue', playerInv, playerJunk, JUNK_POOL, ITEM_POOL)).toBe(false);
  });

  test('returns false for wildcard type not held', () => {
    expect(CraftingUtils.checkIngredient({ type: 'electronic', name: 'Any Electronic' }, playerInv, playerJunk, JUNK_POOL, ITEM_POOL)).toBe(false);
  });
});

// ─── checkCanCraft ────────────────────────────────────────────────────────────

describe('checkCanCraft', () => {
  const recipe = {
    id: 'recipe_test',
    name: 'Test Item',
    ingredients: [
      'Wonderglue',
      { type: 'metal', name: 'Any Metal' }
    ]
  };

  test('returns true when player has all ingredients', () => {
    const inv  = [];
    const junk = [
      { name: 'Wonderglue', type: 'adhesive', quantity: 1 },
      { name: 'Tin Can',    type: 'metal',    quantity: 1 }
    ];
    expect(CraftingUtils.checkCanCraft(recipe, inv, junk, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('returns true when ingredients split across inventory and junk', () => {
    const inv  = [{ name: '10mm Pistol', type: 'weapon', quantity: 1 }];
    const junk = [{ name: 'Wonderglue',  type: 'adhesive', quantity: 1 }];
    const recipeWithWeapon = {
      id: 'recipe_test2',
      name: 'Test2',
      ingredients: ['Wonderglue', { type: 'weapon', name: 'Any Weapon' }]
    };
    expect(CraftingUtils.checkCanCraft(recipeWithWeapon, inv, junk, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('returns false when an ingredient is missing', () => {
    const inv  = [];
    const junk = [{ name: 'Wonderglue', type: 'adhesive', quantity: 1 }];
    // Missing: Any Metal
    expect(CraftingUtils.checkCanCraft(recipe, inv, junk, JUNK_POOL, ITEM_POOL)).toBe(false);
  });

  test('does not double-count the same item for two wildcard slots', () => {
    const twoMetal = {
      id: 'recipe_twometal',
      name: 'Double Metal',
      ingredients: [
        { type: 'metal', name: 'Any Metal' },
        { type: 'metal', name: 'Any Metal' }
      ]
    };
    const junkOne = [{ name: 'Tin Can', type: 'metal', quantity: 1 }]; // only 1 metal item
    expect(CraftingUtils.checkCanCraft(twoMetal, [], junkOne, JUNK_POOL, ITEM_POOL)).toBe(false);

    const junkTwo = [
      { name: 'Tin Can',    type: 'metal', quantity: 1 },
      { name: 'Scrap Metal',type: 'metal', quantity: 1 }
    ];
    expect(CraftingUtils.checkCanCraft(twoMetal, [], junkTwo, JUNK_POOL, ITEM_POOL)).toBe(true);
  });

  test('returns false for recipe with no ingredients', () => {
    expect(CraftingUtils.checkCanCraft({ id: 'x', name: 'X', ingredients: [] }, [], [], JUNK_POOL, ITEM_POOL)).toBe(false);
  });

  test('returns false for null recipe', () => {
    expect(CraftingUtils.checkCanCraft(null, [], [], JUNK_POOL, ITEM_POOL)).toBe(false);
  });
});

// ─── consumeIngredients ───────────────────────────────────────────────────────

describe('consumeIngredients', () => {
  test('removes exact-name item from junk stash', () => {
    const recipe = { ingredients: ['Wonderglue'] };
    const inv    = [];
    const junk   = [{ name: 'Wonderglue', type: 'adhesive', quantity: 2 }];

    const consumed = CraftingUtils.consumeIngredients(recipe, inv, junk, JUNK_POOL, ITEM_POOL);

    expect(consumed).toHaveLength(1);
    expect(consumed[0]).toMatchObject({ name: 'Wonderglue', source: 'junk' });
    expect(junk[0].quantity).toBe(1); // quantity decremented, not removed
  });

  test('removes item with quantity 1 entirely from junk', () => {
    const recipe = { ingredients: ['Tin Can'] };
    const junk   = [{ name: 'Tin Can', type: 'metal', quantity: 1 }];

    CraftingUtils.consumeIngredients(recipe, [], junk, JUNK_POOL, ITEM_POOL);
    expect(junk).toHaveLength(0);
  });

  test('removes exact-name item from inventory when not in junk', () => {
    const recipe = { ingredients: ['Stimpak'] };
    const inv    = [{ name: 'Stimpak', type: 'consumable', quantity: 1 }];
    const junk   = [];

    const consumed = CraftingUtils.consumeIngredients(recipe, inv, junk, JUNK_POOL, ITEM_POOL);
    expect(consumed[0]).toMatchObject({ name: 'Stimpak', source: 'inventory' });
    expect(inv).toHaveLength(0);
  });

  test('wildcard consumes first matching junk item', () => {
    const recipe = { ingredients: [{ type: 'metal', name: 'Any Metal' }] };
    const junk   = [
      { name: 'Tin Can',    type: 'metal', quantity: 1 },
      { name: 'Scrap Metal',type: 'metal', quantity: 1 }
    ];

    const consumed = CraftingUtils.consumeIngredients(recipe, [], junk, JUNK_POOL, ITEM_POOL);
    expect(consumed).toHaveLength(1);
    expect(consumed[0].source).toBe('junk');
    expect(junk).toHaveLength(1); // one was consumed
  });

  test('wildcard falls through to inventory when junk has no match', () => {
    const recipe = { ingredients: [{ type: 'weapon', name: 'Any Weapon' }] };
    const inv    = [{ name: '10mm Pistol', type: 'weapon', quantity: 1 }];
    const junk   = [];

    const consumed = CraftingUtils.consumeIngredients(recipe, inv, junk, JUNK_POOL, ITEM_POOL);
    expect(consumed[0]).toMatchObject({ source: 'inventory' });
    expect(inv).toHaveLength(0);
  });

  test('returns empty array when no ingredients', () => {
    const result = CraftingUtils.consumeIngredients({ ingredients: [] }, [], [], JUNK_POOL, ITEM_POOL);
    expect(result).toEqual([]);
  });
});

// ─── filterRecipes ────────────────────────────────────────────────────────────

describe('filterRecipes', () => {
  const recipes = [
    { id: 'r1', name: 'Improvised Stimpak',  category: 'Aid',     effect: 'Restores 10 HP', ingredients: ['Blood Pack'] },
    { id: 'r2', name: 'Wasteland Omelette',  category: 'Food',    effect: 'Restores 15 HP', ingredients: ['Ant Egg']   },
    { id: 'r3', name: 'Weapon Repair Kit',   category: 'Utility', effect: 'Repairs weapons', ingredients: ['Duct Tape'] },
    { id: 'r4', name: 'Homemade Jet',        category: 'Chem',    effect: 'Temp +10 AP',    ingredients: [{ type: 'plastic', name: 'Any Plastic' }] },
  ];

  test('returns all recipes when no filter given', () => {
    expect(CraftingUtils.filterRecipes(recipes, '', '')).toHaveLength(4);
  });

  test('filters by category', () => {
    const result = CraftingUtils.filterRecipes(recipes, '', 'Aid');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  test('filters by text query on name', () => {
    const result = CraftingUtils.filterRecipes(recipes, 'jet', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r4');
  });

  test('filters by text query on effect', () => {
    const result = CraftingUtils.filterRecipes(recipes, '+10 ap', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r4');
  });

  test('filters by ingredient name', () => {
    const result = CraftingUtils.filterRecipes(recipes, 'Duct Tape', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r3');
  });

  test('filters by wildcard ingredient display name', () => {
    const result = CraftingUtils.filterRecipes(recipes, 'Plastic', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r4');
  });

  test('combines query and category', () => {
    const result = CraftingUtils.filterRecipes(recipes, 'HP', 'Aid');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r1');
  });

  test('returns empty when no match', () => {
    expect(CraftingUtils.filterRecipes(recipes, 'unobtainium', '')).toHaveLength(0);
  });

  test('returns empty array for non-array input', () => {
    expect(CraftingUtils.filterRecipes(null, '', '')).toEqual([]);
  });
});

// ─── filterItems ─────────────────────────────────────────────────────────────

describe('filterItems', () => {
  const items = [
    { name: 'Wonderglue', type: 'adhesive',   description: 'Highly effective adhesive.' },
    { name: 'Tin Can',    type: 'metal',       description: 'Used tin food can.'         },
    { name: 'Bloodleaf',  type: 'organic',     description: 'Red-leafed plant.'          },
    { name: 'Stimpak',    type: 'consumable',  description: 'Restores HP.'               },
  ];

  test('returns all when no filter', () => {
    expect(CraftingUtils.filterItems(items, '', '')).toHaveLength(4);
  });

  test('filters by type', () => {
    const result = CraftingUtils.filterItems(items, '', 'metal');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Tin Can');
  });

  test('filters by query on name', () => {
    const result = CraftingUtils.filterItems(items, 'glue', '');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Wonderglue');
  });

  test('filters by query on description', () => {
    const result = CraftingUtils.filterItems(items, 'HP', '');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Stimpak');
  });

  test('type and query combined', () => {
    const result = CraftingUtils.filterItems(items, 'red', 'organic');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Bloodleaf');
  });

  test('returns empty for non-array', () => {
    expect(CraftingUtils.filterItems(undefined, '', '')).toEqual([]);
  });
});

// ─── ingredientLabel ──────────────────────────────────────────────────────────

describe('ingredientLabel', () => {
  test('plain string returns unchanged', () => {
    expect(CraftingUtils.ingredientLabel('Blood Pack')).toBe('Blood Pack');
  });
  test('{ type, name } returns name', () => {
    expect(CraftingUtils.ingredientLabel({ type: 'metal', name: 'Any Metal' })).toBe('Any Metal');
  });
  test('{ type } only returns synthesised label', () => {
    expect(CraftingUtils.ingredientLabel({ type: 'chemical' })).toBe('Any chemical');
  });
});
