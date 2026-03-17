// ===== ITEM STORAGE =====
let inventory = {
    weapons: [],
    apparel: [],
    misc: [],
    aid: [],
    ammo: []
};

let editingItem = null;
let editingCategory = null;

// ===== LOAD DATA ON PAGE LOAD =====
window.addEventListener('DOMContentLoaded', function() {
    loadInventory();
    renderAllTabs();
});

// ===== LOAD FROM LOCAL STORAGE =====
function loadInventory() {
    const saved = localStorage.getItem('pipboyInventory');
    if (saved) {
        inventory = JSON.parse(saved);
    }
}

// ===== SAVE TO LOCAL STORAGE =====
function saveInventory() {
    localStorage.setItem('pipboyInventory', JSON.stringify(inventory));
}

// ===== SWITCH TABS =====
function switchTab(tabName, tabElement) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const tabs = document.querySelectorAll('.vault-tab');
    tabs.forEach(tab => tab.classList.remove('active'));

    document.getElementById(tabName).classList.add('active');
    tabElement.classList.add('active');

    filterAndSort();
}

// ===== ADD ITEM =====
function addItem(category) {
    let item = {};
    let messageEl = document.getElementById(category + 'Message');

    if (category === 'weapons') {
        if (!document.getElementById('weaponName').value) {
            showMessage(messageEl, '⚠ Please enter weapon name!', 'error');
            return;
        }
        item = {
            id: 'item-' + Date.now(),
            name: document.getElementById('weaponName').value,
            damage: document.getElementById('weaponDamage').value || 'N/A',
            damageType: document.getElementById('weaponDamageType').value || 'Unknown',
            value: parseFloat(document.getElementById('weaponValue').value) || 0,
            description: document.getElementById('weaponDesc').value,
            favorite: false
        };
        document.getElementById('weaponName').value = '';
        document.getElementById('weaponDamage').value = '';
        document.getElementById('weaponDamageType').value = '';
        document.getElementById('weaponValue').value = '';
        document.getElementById('weaponDesc').value = '';
    } else if (category === 'apparel') {
        if (!document.getElementById('apparelName').value) {
            showMessage(messageEl, '⚠ Please enter apparel name!', 'error');
            return;
        }
        item = {
            id: 'item-' + Date.now(),
            name: document.getElementById('apparelName').value,
            dr: document.getElementById('apparelDR').value || 'N/A',
            value: parseFloat(document.getElementById('apparelValue').value) || 0,
            description: document.getElementById('apparelDesc').value,
            favorite: false
        };
        document.getElementById('apparelName').value = '';
        document.getElementById('apparelDR').value = '';
        document.getElementById('apparelValue').value = '';
        document.getElementById('apparelDesc').value = '';
    } else if (category === 'misc') {
        if (!document.getElementById('miscName').value) {
            showMessage(messageEl, '⚠ Please enter item name!', 'error');
            return;
        }
        item = {
            id: 'item-' + Date.now(),
            name: document.getElementById('miscName').value,
            quantity: parseInt(document.getElementById('miscQuantity').value) || 1,
            value: parseFloat(document.getElementById('miscValue').value) || 0,
            rarity: document.getElementById('miscRarity').value || 'Common',
            description: document.getElementById('miscDesc').value,
            favorite: false
        };
        document.getElementById('miscName').value = '';
        document.getElementById('miscQuantity').value = '1';
        document.getElementById('miscValue').value = '';
        document.getElementById('miscRarity').value = '';
        document.getElementById('miscDesc').value = '';
    } else if (category === 'aid') {
        if (!document.getElementById('aidName').value) {
            showMessage(messageEl, '⚠ Please enter aid item name!', 'error');
            return;
        }
        item = {
            id: 'item-' + Date.now(),
            name: document.getElementById('aidName').value,
            quantity: parseInt(document.getElementById('aidQuantity').value) || 1,
            effect: document.getElementById('aidEffect').value || 'Unknown',
            amount: document.getElementById('aidAmount').value || 'N/A',
            value: parseFloat(document.getElementById('aidValue').value) || 0,
            description: document.getElementById('aidDesc').value,
            favorite: false
        };
        document.getElementById('aidName').value = '';
        document.getElementById('aidQuantity').value = '1';
        document.getElementById('aidEffect').value = '';
        document.getElementById('aidAmount').value = '';
        document.getElementById('aidValue').value = '';
        document.getElementById('aidDesc').value = '';
    } else if (category === 'ammo') {
        if (!document.getElementById('ammoName').value) {
            showMessage(messageEl, '⚠ Please enter ammo type!', 'error');
            return;
        }
        item = {
            id: 'item-' + Date.now(),
            name: document.getElementById('ammoName').value,
            quantity: parseInt(document.getElementById('ammoQuantity').value) || 1,
            value: parseFloat(document.getElementById('ammoValue').value) || 0,
            weapon: document.getElementById('ammoWeapon').value || 'General',
            description: document.getElementById('ammoDesc').value,
            favorite: false
        };
        document.getElementById('ammoName').value = '';
        document.getElementById('ammoQuantity').value = '';
        document.getElementById('ammoValue').value = '';
        document.getElementById('ammoWeapon').value = '';
        document.getElementById('ammoDesc').value = '';
    }

    inventory[category].push(item);
    saveInventory();
    renderCategory(category);
    showMessage(messageEl, `✓ ${item.name} added to Vault 215!`, 'success');
}

// ===== OPEN EDIT MODAL =====
function openEditModal(category, itemId) {
    editingCategory = category;
    const item = inventory[category].find(i => i.id === itemId);
    if (!item) return;

    editingItem = { ...item };
    const formFields = document.getElementById('editFormFields');
    let html = '';

    if (category === 'weapons') {
        html = `
            <div class="vault-form-group">
                <label class="vault-form-label">Item Name</label>
                <input type="text" class="vault-form-input" id="editName" value="${item.name}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Damage</label>
                <input type="text" class="vault-form-input" id="editDamage" value="${item.damage}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Damage Type</label>
                <input type="text" class="vault-form-input" id="editDamageType" value="${item.damageType}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Value (Caps)</label>
                <input type="number" class="vault-form-input" id="editValue" value="${item.value}">
            </div>
            <div class="vault-form-group" style="grid-column: 1 / -1;">
                <label class="vault-form-label">Description</label>
                <input type="text" class="vault-form-input" id="editDesc" value="${item.description}">
            </div>
        `;
    } else if (category === 'apparel') {
        html = `
            <div class="vault-form-group">
                <label class="vault-form-label">Item Name</label>
                <input type="text" class="vault-form-input" id="editName" value="${item.name}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Defense Rating (DR)</label>
                <input type="text" class="vault-form-input" id="editDR" value="${item.dr}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Value (Caps)</label>
                <input type="number" class="vault-form-input" id="editValue" value="${item.value}">
            </div>
            <div class="vault-form-group" style="grid-column: 1 / -1;">
                <label class="vault-form-label">Description</label>
                <input type="text" class="vault-form-input" id="editDesc" value="${item.description}">
            </div>
        `;
    } else if (category === 'misc') {
        html = `
            <div class="vault-form-group">
                <label class="vault-form-label">Item Name</label>
                <input type="text" class="vault-form-input" id="editName" value="${item.name}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Quantity</label>
                <input type="number" class="vault-form-input" id="editQuantity" value="${item.quantity}" min="1">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Value per Item (Caps)</label>
                <input type="number" class="vault-form-input" id="editValue" value="${item.value}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Rarity</label>
                <input type="text" class="vault-form-input" id="editRarity" value="${item.rarity}">
            </div>
            <div class="vault-form-group" style="grid-column: 1 / -1;">
                <label class="vault-form-label">Description</label>
                <input type="text" class="vault-form-input" id="editDesc" value="${item.description}">
            </div>
        `;
    } else if (category === 'aid') {
        html = `
            <div class="vault-form-group">
                <label class="vault-form-label">Item Name</label>
                <input type="text" class="vault-form-input" id="editName" value="${item.name}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Quantity</label>
                <input type="number" class="vault-form-input" id="editQuantity" value="${item.quantity}" min="1">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Effect Type</label>
                <input type="text" class="vault-form-input" id="editEffect" value="${item.effect}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Effect Amount</label>
                <input type="text" class="vault-form-input" id="editAmount" value="${item.amount}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Value (Caps)</label>
                <input type="number" class="vault-form-input" id="editValue" value="${item.value}">
            </div>
            <div class="vault-form-group" style="grid-column: 1 / -1;">
                <label class="vault-form-label">Description</label>
                <input type="text" class="vault-form-input" id="editDesc" value="${item.description}">
            </div>
        `;
    } else if (category === 'ammo') {
        html = `
            <div class="vault-form-group">
                <label class="vault-form-label">Ammo Type</label>
                <input type="text" class="vault-form-input" id="editName" value="${item.name}">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Quantity</label>
                <input type="number" class="vault-form-input" id="editQuantity" value="${item.quantity}" min="1">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Value per Round (Caps)</label>
                <input type="number" class="vault-form-input" id="editValue" value="${item.value}" step="0.1">
            </div>
            <div class="vault-form-group">
                <label class="vault-form-label">Weapon Type</label>
                <input type="text" class="vault-form-input" id="editWeapon" value="${item.weapon}">
            </div>
            <div class="vault-form-group" style="grid-column: 1 / -1;">
                <label class="vault-form-label">Description</label>
                <input type="text" class="vault-form-input" id="editDesc" value="${item.description}">
            </div>
        `;
    }

    formFields.innerHTML = html;
    document.getElementById('editModal').classList.add('active');
}

// ===== CLOSE EDIT MODAL =====
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    editingItem = null;
    editingCategory = null;
}

// ===== SAVE EDITED ITEM =====
function saveEditItem() {
    if (!editingItem || !editingCategory) return;

    const itemIndex = inventory[editingCategory].findIndex(i => i.id === editingItem.id);
    if (itemIndex === -1) return;

    const updatedItem = { ...editingItem };

    if (editingCategory === 'weapons') {
        updatedItem.name = document.getElementById('editName').value;
        updatedItem.damage = document.getElementById('editDamage').value;
        updatedItem.damageType = document.getElementById('editDamageType').value;
        updatedItem.value = parseFloat(document.getElementById('editValue').value) || 0;
        updatedItem.description = document.getElementById('editDesc').value;
    } else if (editingCategory === 'apparel') {
        updatedItem.name = document.getElementById('editName').value;
        updatedItem.dr = document.getElementById('editDR').value;
        updatedItem.value = parseFloat(document.getElementById('editValue').value) || 0;
        updatedItem.description = document.getElementById('editDesc').value;
    } else if (editingCategory === 'misc') {
        updatedItem.name = document.getElementById('editName').value;
        updatedItem.quantity = parseInt(document.getElementById('editQuantity').value) || 1;
        updatedItem.value = parseFloat(document.getElementById('editValue').value) || 0;
        updatedItem.rarity = document.getElementById('editRarity').value;
        updatedItem.description = document.getElementById('editDesc').value;
    } else if (editingCategory === 'aid') {
        updatedItem.name = document.getElementById('editName').value;
        updatedItem.quantity = parseInt(document.getElementById('editQuantity').value) || 1;
        updatedItem.effect = document.getElementById('editEffect').value;
        updatedItem.amount = document.getElementById('editAmount').value;
        updatedItem.value = parseFloat(document.getElementById('editValue').value) || 0;
        updatedItem.description = document.getElementById('editDesc').value;
    } else if (editingCategory === 'ammo') {
        updatedItem.name = document.getElementById('editName').value;
        updatedItem.quantity = parseInt(document.getElementById('editQuantity').value) || 1;
        updatedItem.value = parseFloat(document.getElementById('editValue').value) || 0;
        updatedItem.weapon = document.getElementById('editWeapon').value;
        updatedItem.description = document.getElementById('editDesc').value;
    }

    inventory[editingCategory][itemIndex] = updatedItem;
    saveInventory();
    renderCategory(editingCategory);
    closeEditModal();
}

// ===== DELETE ITEM =====
function deleteItem(category, itemId) {
    inventory[category] = inventory[category].filter(item => item.id !== itemId);
    saveInventory();
    renderCategory(category);
}

// ===== TOGGLE FAVORITE =====
function toggleFavorite(category, itemId) {
    const item = inventory[category].find(i => i.id === itemId);
    if (item) {
        item.favorite = !item.favorite;
        saveInventory();
        renderCategory(category);
    }
}

// ===== ADJUST QUANTITY =====
function adjustQuantity(category, itemId, delta) {
    const item = inventory[category].find(i => i.id === itemId);
    if (item && item.quantity !== undefined) {
        item.quantity = Math.max(1, item.quantity + delta);
        saveInventory();
        renderCategory(category);
    }
}

// ===== FILTER AND SORT =====
function filterAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortOption = document.getElementById('sortSelect').value;

    Object.keys(inventory).forEach(category => {
        let items = [...inventory[category]];

        items = items.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );

        items.sort((a, b) => {
            if (sortOption === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortOption === 'name-desc') {
                return b.name.localeCompare(a.name);
            } else if (sortOption === 'quantity') {
                return (a.quantity || 0) - (b.quantity || 0);
            } else if (sortOption === 'quantity-desc') {
                return (b.quantity || 0) - (a.quantity || 0);
            } else if (sortOption === 'value') {
                return (a.value || 0) - (b.value || 0);
            } else if (sortOption === 'value-desc') {
                return (b.value || 0) - (a.value || 0);
            } else if (sortOption === 'favorites') {
                return (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
            }
            return 0;
        });

        renderItems(category, items);
    });
}

// ===== RENDER ITEMS =====
function renderItems(category, items) {
    const listEl = document.getElementById(category + 'List');
    
    if (items.length === 0) {
        listEl.innerHTML = '<div class="empty-message">No items in this category. Add one above!</div>';
        return;
    }

    let html = '';
    items.forEach(item => {
        html += `
            <li class="item-card">
                <div class="item-header">
                    <div class="item-name">${item.name}</div>
                    <div class="item-actions">
                        <button class="favorite-btn ${item.favorite ? 'favorited' : ''}" onclick="toggleFavorite('${category}', '${item.id}')">★</button>
                        <button class="edit-btn" onclick="openEditModal('${category}', '${item.id}')">EDIT</button>
                        <button class="delete-btn" onclick="deleteItem('${category}', '${item.id}')">DELETE</button>
                    </div>
                </div>
                ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                <div class="item-body">
                    ${getItemDetails(item, category)}
                </div>
                ${getItemFooter(item, category)}
            </li>
        `;
    });

    listEl.innerHTML = html;
}

// ===== GET ITEM DETAILS =====
function getItemDetails(item, category) {
    let html = '';

    if (category === 'weapons') {
        html += `<div class="item-detail"><span class="detail-label">Damage:</span> ${item.damage}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Type:</span> ${item.damageType}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Value:</span> ${item.value} caps</div>`;
    } else if (category === 'apparel') {
        html += `<div class="item-detail"><span class="detail-label">DR:</span> ${item.dr}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Value:</span> ${item.value} caps</div>`;
    } else if (category === 'misc') {
        html += `<div class="item-detail"><span class="detail-label">Qty:</span> ${item.quantity}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Rarity:</span> ${item.rarity}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Value:</span> ${item.value * item.quantity} caps</div>`;
    } else if (category === 'aid') {
        html += `<div class="item-detail"><span class="detail-label">Effect:</span> ${item.effect}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Amount:</span> ${item.amount}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Qty:</span> ${item.quantity}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Value:</span> ${item.value * item.quantity} caps</div>`;
    } else if (category === 'ammo') {
        html += `<div class="item-detail"><span class="detail-label">Qty:</span> ${item.quantity}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Weapon:</span> ${item.weapon}</div>`;
        html += `<div class="item-detail"><span class="detail-label">Value:</span> ${(item.value * item.quantity).toFixed(2)} caps</div>`;
    }

    return html;
}

// ===== GET ITEM FOOTER =====
function getItemFooter(item, category) {
    if (category === 'weapons' || category === 'apparel') {
        return '';
    }

    return `
        <div class="item-footer">
            <div class="quantity-control">
                <button onclick="adjustQuantity('${category}', '${item.id}', -1)">-</button>
                <div class="quantity-display">${item.quantity}</div>
                <button onclick="adjustQuantity('${category}', '${item.id}', 1)">+</button>
            </div>
        </div>
    `;
}

// ===== RENDER CATEGORY =====
function renderCategory(category) {
    renderItems(category, inventory[category]);
}

// ===== RENDER ALL TABS =====
function renderAllTabs() {
    Object.keys(inventory).forEach(category => {
        renderItems(category, inventory[category]);
    });
}

// ===== SHOW MESSAGE =====
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = 'vault-message ' + type;
    setTimeout(() => {
        element.textContent = '';
        element.className = 'vault-message';
    }, 3000);
}

// ===
