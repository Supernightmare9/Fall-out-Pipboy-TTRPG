class Inventory {
    constructor() {
        this.items = {};
    }

    addItem(item, quantity = 1) {
        if (this.items[item]) {
            this.items[item] += quantity;
        } else {
            this.items[item] = quantity;
        }
    }

    removeItem(item, quantity = 1) {
        if (this.items[item]) {
            this.items[item] -= quantity;
            if (this.items[item] <= 0) {
                delete this.items[item];
            }
        }
    }

    getQuantity(item) {
        return this.items[item] || 0;
    }

    listItems() {
        return this.items;
    }
}

// Usage Example
const inventory = new Inventory();
inventory.addItem('Health Potion', 3);
inventory.removeItem('Health Potion', 1);
console.log(inventory.getQuantity('Health Potion')); // Output: 2
console.log(inventory.listItems()); // Output: { 'Health Potion': 2 }
