// assets/logic/customitem.js
// Approved Custom Items - Player-created items that have been approved by overseer

const approvedCustomItems = [
  // Structure:
  // {
  //   id: 'custom_001',
  //   name: 'Baseball Grenade',
  //   description: 'A baseball stuffed with explosive material',
  //   itemType: 'weapon',
  //   components: [
  //     { itemId: 'baseball', quantity: 1 },
  //     { itemId: 'ductTape', quantity: 1 },
  //     { itemId: 'grenade', quantity: 1 }
  //   ],
  //   rarity: 'uncommon',
  //   createdBy: 'playerName',
  //   approvedBy: 'overseer',
  //   approvalDate: '2026-03-23',
  //   craftingXP: 65
  // }
];

// Function to get all approved custom items
function getApprovedCustomItems() {
  return approvedCustomItems;
}

// Function to add approved custom item
function addApprovedCustomItem(customItem) {
  const newItem = {
    id: `custom_${Date.now()}`,
    ...customItem,
    approvalDate: new Date().toISOString().split('T')[0]
  };
  approvedCustomItems.push(newItem);
  return newItem;
}

// Function to remove custom item
function removeApprovedCustomItem(itemId) {
  const index = approvedCustomItems.findIndex(item => item.id === itemId);
  if (index !== -1) {
    approvedCustomItems.splice(index, 1);
    return true;
  }
  return false;
}

// Function to get custom item by ID
function getCustomItemById(itemId) {
  return approvedCustomItems.find(item => item.id === itemId);
}

// Function to get custom items by player
function getCustomItemsByPlayer(playerName) {
  return approvedCustomItems.filter(item => item.createdBy === playerName);
}

// Example usage:
// const customItems = getApprovedCustomItems();
// const newCustom = addApprovedCustomItem({ name: 'Plasma Rifle', itemType: 'weapon', components: [...], rarity: 'rare', createdBy: 'playerName', approvedBy: 'overseer' });
