function validateForm() {
    const accounts = {
        'Dillon': 'test',
        'Vault Dweller': 'vault111',
        'Survivor': '2077',
        'Agent': 'minutemen',
        'Overseer': 'vault101'
    };
    const usernameInput = document.getElementById('username').value;
    const passwordInput = document.getElementById('password').value;

    if (accounts[usernameInput] && accounts[usernameInput] === passwordInput) {
        return true;
    } else {
        alert('Invalid username or password.');
        return false;
    }
}

function storePlayerData(characterName, vault, level, health, xp) {
    const playerData = {
        characterName: characterName,
        vault: vault,
        level: level,
        health: health,
        xp: xp
    };
    localStorage.setItem('playerData', JSON.stringify(playerData));
}
