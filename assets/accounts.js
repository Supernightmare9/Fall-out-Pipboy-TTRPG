// accounts.js
// User Account System for Fall-out Pipboy TTRPG
// Each player account links to one or more characters and a campaign.
// No passwords are stored here — authentication is handled separately.

const ACCOUNTS = [
  {
    username: "Jade",
    role: "player",
    characters: [
      {
        id: "char_jade_1",
        name: "Jade",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100
      }
    ]
  },
  {
    username: "Katie",
    role: "player",
    characters: [
      {
        id: "char_katie_1",
        name: "Katie",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100
      }
    ]
  },
  {
    username: "Moe",
    role: "player",
    characters: [
      {
        id: "char_moe_1",
        name: "Moe",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100
      }
    ]
  },
  {
    username: "Nikki",
    role: "player",
    characters: [
      {
        id: "char_nikki_1",
        name: "Nikki",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100
      }
    ]
  },
  {
    username: "Zach",
    role: "player",
    characters: [
      {
        id: "char_zach_1",
        name: "Zach",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100
      }
    ]
  },
  {
    username: "David",
    role: "player",
    characters: [
      {
        id: "char_david_1",
        name: "David",
        campaignId: "campaign_001",
        currentHp: 100,
        maxHp: 100
      }
    ]
  },
  {
    username: "Overseer",
    role: "admin",
    // Admin manages campaigns rather than playing characters
    characters: []
  }
];
