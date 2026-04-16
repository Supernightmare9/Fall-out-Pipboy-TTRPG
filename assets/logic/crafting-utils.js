// assets/logic/crafting-utils.js
// Cross-pool crafting utilities for Fall-out Pipboy TTRPG.
//
// This module bridges recipes-pool.js with both junk.js and items.js so that
// recipe ingredients can reference items from either pool — by exact name or
// by wildcard type (e.g. { type: 'metal', name: 'Any Metal' }).
//
// Exported as window.CraftingUtils for browser use, and module.exports for Node/Jest.
//
// Ingredient formats accepted by all functions here:
//   - Plain string:  "Wonderglue"                   → match by name in either pool
//   - Wildcard obj:  { type: 'metal', name: '...' } → match any item with that type
//   - "Any <X>" str: treated as a display label only; still matched by name first

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.CraftingUtils = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Return true when the ingredient spec is a wildcard (object with a `type`
   * property, or a string starting with "Any ").
   */
  function isWildcard(ingredient) {
    if (ingredient && typeof ingredient === 'object' && ingredient.type) return true;
    if (typeof ingredient === 'string' && ingredient.startsWith('Any ')) return true;
    return false;
  }

  /**
   * Normalise an ingredient to { name, type }.
   *   "Blood Pack"                     → { name: "Blood Pack",   type: null }
   *   { type: "metal", name: "Any Metal" } → { name: "Any Metal", type: "metal" }
   *   "Any Chem"                       → { name: "Any Chem",     type: "chem" }
   */
  function normaliseIngredient(ingredient) {
    if (ingredient && typeof ingredient === 'object') {
      var rawName = ingredient.name || ('Any ' + (ingredient.type
        ? ingredient.type.charAt(0).toUpperCase() + ingredient.type.slice(1)
        : '?'));
      return { name: rawName, type: ingredient.type || null };
    }
    if (typeof ingredient === 'string') {
      if (ingredient.startsWith('Any ')) {
        // "Any Metal" → type = "metal"
        var derivedType = ingredient.slice(4).toLowerCase().split('/')[0].trim();
        return { name: ingredient, type: derivedType };
      }
      return { name: ingredient, type: null };
    }
    return { name: String(ingredient), type: null };
  }

  // ─── Pool lookup ────────────────────────────────────────────────────────────

  /**
   * Find the first item in either pool that satisfies the ingredient spec.
   *
   * @param {string|object} ingredient
   * @param {Array} junkPool   - items from junk.js  (each has .name and .type)
   * @param {Array} itemPool   - items from items.js (each has .name and .type)
   * @returns {object|null}    - the matched item record, or null
   */
  function findItemInPools(ingredient, junkPool, itemPool) {
    junkPool = junkPool || [];
    itemPool = itemPool || [];
    var spec = normaliseIngredient(ingredient);

    if (spec.type) {
      // Wildcard: match any item with the same type (case-insensitive) in either pool
      var typeLower = spec.type.toLowerCase();
      return (
        junkPool.find(function (i) { return i.type && i.type.toLowerCase() === typeLower; }) ||
        itemPool.find(function (i) { return i.type && i.type.toLowerCase() === typeLower; }) ||
        null
      );
    }

    // Exact name match, junk pool first then inventory pool
    var nameLower = spec.name.toLowerCase();
    return (
      junkPool.find(function (i) { return i.name && i.name.toLowerCase() === nameLower; }) ||
      itemPool.find(function (i) { return i.name && i.name.toLowerCase() === nameLower; }) ||
      null
    );
  }

  // ─── Player-stock checks ────────────────────────────────────────────────────

  /**
   * Return true when the player holds (in their inventory or junk stash) at
   * least one item satisfying the ingredient spec.
   *
   * @param {string|object} ingredient
   * @param {Array} playerInventory - player's carried items
   * @param {Array} playerJunk      - player's junk stash
   * @param {Array} junkPool        - master junk.js pool (for type look-ups)
   * @param {Array} itemPool        - master items.js pool (for type look-ups)
   * @returns {boolean}
   */
  function checkIngredient(ingredient, playerInventory, playerJunk, junkPool, itemPool) {
    playerInventory = playerInventory || [];
    playerJunk = playerJunk || [];
    junkPool = junkPool || [];
    itemPool = itemPool || [];

    var spec = normaliseIngredient(ingredient);

    if (spec.type) {
      var typeLower = spec.type.toLowerCase();
      // Check player junk: match by type in master pool, then confirm player has it
      var junkMatch = junkPool.find(function (i) {
        return i.type && i.type.toLowerCase() === typeLower;
      });
      if (junkMatch) {
        var inJunk = playerJunk.some(function (pi) {
          return pi.name && pi.name.toLowerCase() === junkMatch.name.toLowerCase();
        });
        if (inJunk) return true;
      }
      // Check all junk pool items of this type against player junk
      var anyJunkMatch = junkPool.filter(function (i) {
        return i.type && i.type.toLowerCase() === typeLower;
      }).some(function (poolItem) {
        return playerJunk.some(function (pi) {
          return pi.name && pi.name.toLowerCase() === poolItem.name.toLowerCase();
        });
      });
      if (anyJunkMatch) return true;
      // Check player inventory: match by type in master item pool
      var invMatch = itemPool.find(function (i) {
        return i.type && i.type.toLowerCase() === typeLower;
      });
      if (invMatch) {
        return playerInventory.some(function (pi) {
          return (pi.name && pi.name.toLowerCase() === invMatch.name.toLowerCase()) ||
                 (pi.id && pi.id === invMatch.id);
        });
      }
      // Fallback: check directly by type field on player's held items
      return (
        playerJunk.some(function (pi) { return pi.type && pi.type.toLowerCase() === typeLower; }) ||
        playerInventory.some(function (pi) { return pi.type && pi.type.toLowerCase() === typeLower; })
      );
    }

    var nameLower = spec.name.toLowerCase();
    return (
      playerJunk.some(function (pi) { return pi.name && pi.name.toLowerCase() === nameLower; }) ||
      playerInventory.some(function (pi) {
        return (pi.name && pi.name.toLowerCase() === nameLower) ||
               (pi.id  && pi.id  === spec.name);
      })
    );
  }

  /**
   * Return true when the player can satisfy every ingredient in the recipe.
   *
   * @param {object} recipe         - recipe from recipesPool
   * @param {Array}  playerInventory
   * @param {Array}  playerJunk
   * @param {Array}  junkPool
   * @param {Array}  itemPool
   * @returns {boolean}
   */
  function checkCanCraft(recipe, playerInventory, playerJunk, junkPool, itemPool) {
    if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
      return false;
    }

    // Track temporary item usage so we don't double-count the same item
    var usedJunk = {};
    var usedInv  = {};

    for (var i = 0; i < recipe.ingredients.length; i++) {
      var ing  = recipe.ingredients[i];
      var spec = normaliseIngredient(ing);
      var satisfied = false;

      if (spec.type) {
        var tl = spec.type.toLowerCase();
        // Try junk stash first
        for (var j = 0; j < (playerJunk || []).length; j++) {
          var pj = playerJunk[j];
          var pjType = pj.type ? pj.type.toLowerCase() : null;
          // Match directly by type field, or via junk pool lookup
          var poolItem = junkPool && junkPool.find(function (pi) {
            return pi.name && pi.name.toLowerCase() === (pj.name || '').toLowerCase();
          });
          var effectiveType = pjType || (poolItem && poolItem.type ? poolItem.type.toLowerCase() : null);
          if (effectiveType === tl && !usedJunk[j]) {
            usedJunk[j] = true;
            satisfied = true;
            break;
          }
        }
        if (!satisfied) {
          // Try inventory
          for (var k = 0; k < (playerInventory || []).length; k++) {
            var pi = playerInventory[k];
            var piType = pi.type ? pi.type.toLowerCase() : null;
            if (piType === tl && !usedInv[k]) {
              usedInv[k] = true;
              satisfied = true;
              break;
            }
          }
        }
      } else {
        var nl = spec.name.toLowerCase();
        // Try junk stash
        for (var jj = 0; jj < (playerJunk || []).length; jj++) {
          if (playerJunk[jj].name && playerJunk[jj].name.toLowerCase() === nl && !usedJunk[jj]) {
            usedJunk[jj] = true;
            satisfied = true;
            break;
          }
        }
        if (!satisfied) {
          // Try inventory
          for (var kk = 0; kk < (playerInventory || []).length; kk++) {
            var pii = playerInventory[kk];
            var nameMatch = pii.name && pii.name.toLowerCase() === nl;
            var idMatch   = pii.id   && pii.id   === spec.name;
            if ((nameMatch || idMatch) && !usedInv[kk]) {
              usedInv[kk] = true;
              satisfied = true;
              break;
            }
          }
        }
      }

      if (!satisfied) return false;
    }
    return true;
  }

  /**
   * Consume one item per ingredient from the player's junk stash or inventory.
   * Junk is preferred over inventory for each ingredient.
   * Mutates the passed arrays in-place (quantity-aware) and returns a log of
   * what was consumed.
   *
   * @param {object} recipe
   * @param {Array}  playerInventory  - mutable
   * @param {Array}  playerJunk       - mutable
   * @param {Array}  junkPool
   * @param {Array}  itemPool
   * @returns {Array<{name:string, source:'junk'|'inventory'}>}
   */
  function consumeIngredients(recipe, playerInventory, playerJunk, junkPool, itemPool) {
    if (!recipe || !Array.isArray(recipe.ingredients)) return [];
    playerInventory = playerInventory || [];
    playerJunk      = playerJunk      || [];

    var consumed = [];

    for (var i = 0; i < recipe.ingredients.length; i++) {
      var ing  = recipe.ingredients[i];
      var spec = normaliseIngredient(ing);
      var done = false;

      if (spec.type) {
        var tl = spec.type.toLowerCase();
        // Try junk stash first
        for (var j = playerJunk.length - 1; j >= 0; j--) {
          var pj       = playerJunk[j];
          var pjType   = pj.type ? pj.type.toLowerCase() : null;
          var poolEntry = junkPool && junkPool.find(function (pi) {
            return pi.name && pi.name.toLowerCase() === (pj.name || '').toLowerCase();
          });
          var effectiveType = pjType || (poolEntry && poolEntry.type ? poolEntry.type.toLowerCase() : null);
          if (effectiveType === tl) {
            consumed.push({ name: pj.name, source: 'junk' });
            _decrementOrRemove(playerJunk, j);
            done = true;
            break;
          }
        }
        if (!done) {
          // Try inventory
          for (var k = playerInventory.length - 1; k >= 0; k--) {
            var pi = playerInventory[k];
            if (pi.type && pi.type.toLowerCase() === tl) {
              consumed.push({ name: pi.name, source: 'inventory' });
              _decrementOrRemove(playerInventory, k);
              done = true;
              break;
            }
          }
        }
      } else {
        var nl = spec.name.toLowerCase();
        // Try junk stash
        for (var jj = playerJunk.length - 1; jj >= 0; jj--) {
          if (playerJunk[jj].name && playerJunk[jj].name.toLowerCase() === nl) {
            consumed.push({ name: playerJunk[jj].name, source: 'junk' });
            _decrementOrRemove(playerJunk, jj);
            done = true;
            break;
          }
        }
        if (!done) {
          // Try inventory
          for (var kk = playerInventory.length - 1; kk >= 0; kk--) {
            var pii = playerInventory[kk];
            if ((pii.name && pii.name.toLowerCase() === nl) || (pii.id && pii.id === spec.name)) {
              consumed.push({ name: pii.name, source: 'inventory' });
              _decrementOrRemove(playerInventory, kk);
              done = true;
              break;
            }
          }
        }
      }
    }

    return consumed;
  }

  function _decrementOrRemove(arr, idx) {
    var item = arr[idx];
    var qty = item.quantity !== undefined ? item.quantity : 1;
    if (qty <= 1) {
      arr.splice(idx, 1);
    } else {
      item.quantity = qty - 1;
    }
  }

  // ─── Filtering helpers ──────────────────────────────────────────────────────

  /**
   * Filter recipes by search query and/or category.
   *
   * @param {Array}  recipes    - from recipesPool
   * @param {string} query      - free-text search (name, effect, ingredient)
   * @param {string} category   - exact category match, e.g. "Aid" (optional)
   * @returns {Array}
   */
  function filterRecipes(recipes, query, category) {
    if (!Array.isArray(recipes)) return [];
    var q  = (query    || '').toLowerCase().trim();
    var cat = (category || '').toLowerCase().trim();

    return recipes.filter(function (r) {
      if (cat && (!r.category || r.category.toLowerCase() !== cat)) return false;
      if (!q) return true;

      if (r.name        && r.name.toLowerCase().includes(q))        return true;
      if (r.effect      && r.effect.toLowerCase().includes(q))      return true;
      if (r.description && r.description.toLowerCase().includes(q)) return true;
      if (Array.isArray(r.ingredients)) {
        return r.ingredients.some(function (ing) {
          var spec = normaliseIngredient(ing);
          return spec.name.toLowerCase().includes(q);
        });
      }
      return false;
    });
  }

  /**
   * Filter an item list (junk or inventory) by search query and/or type.
   *
   * @param {Array}  items  - from junk.js or items.js
   * @param {string} query  - free-text search
   * @param {string} type   - exact type match (optional)
   * @returns {Array}
   */
  function filterItems(items, query, type) {
    if (!Array.isArray(items)) return [];
    var q = (query || '').toLowerCase().trim();
    var t = (type  || '').toLowerCase().trim();

    return items.filter(function (item) {
      if (t && (!item.type || item.type.toLowerCase() !== t)) return false;
      if (!q) return true;
      return (
        (item.name        && item.name.toLowerCase().includes(q))        ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.type        && item.type.toLowerCase().includes(q))
      );
    });
  }

  /**
   * Return the display label for a recipe ingredient.
   *
   * @param {string|object} ingredient
   * @returns {string}
   */
  function ingredientLabel(ingredient) {
    return normaliseIngredient(ingredient).name;
  }

  /**
   * Return true when the ingredient is a wildcard.
   * (Re-exported for convenience.)
   */
  function ingredientIsWildcard(ingredient) {
    return isWildcard(ingredient);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────
  return {
    isWildcard:           ingredientIsWildcard,
    normaliseIngredient:  normaliseIngredient,
    findItemInPools:      findItemInPools,
    checkIngredient:      checkIngredient,
    checkCanCraft:        checkCanCraft,
    consumeIngredients:   consumeIngredients,
    filterRecipes:        filterRecipes,
    filterItems:          filterItems,
    ingredientLabel:      ingredientLabel
  };
}));
