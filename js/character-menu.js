// character-menu.js

// Example character menu functionality

class CharacterMenu {
    constructor() {
        this.characters = [];
    }

    addCharacter(character) {
        this.characters.push(character);
    }

    displayMenu() {
        console.log("Character Menu:");
        this.characters.forEach((char, index) => {
            console.log(`${index + 1}: ${char.name}`);
        });
    }
}

// Example usage
const menu = new CharacterMenu();
menu.addCharacter({ name: 'Warrior' });
menu.addCharacter({ name: 'Mage' });
menu.displayMenu();