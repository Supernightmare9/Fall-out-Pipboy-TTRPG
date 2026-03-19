// npcs.js
// NPC Template System for Fall-out Pipboy TTRPG
// Used by the Overseer to populate the world with characters.
// attitude: "friendly" | "neutral" | "hostile"

const NPCS = [
  // ── TRADERS ───────────────────────────────────────────────────────────────
  {
    id: "npc_trader_1",
    name: "Carla Dunn",
    role: "Wandering Trader",
    faction: "independent",
    description: "A weathered caravan merchant who has traveled every major trade route between the settlements. She always has a cigarette dangling from her lip and a shotgun within arm's reach.",
    attitude: "neutral",
    location: "Wandering Trade Routes",
    quests: []
  },
  {
    id: "npc_trader_2",
    name: "Old Silas",
    role: "Settlement Shopkeeper",
    faction: "settlers",
    description: "A grizzled old man running a cluttered general store out of a converted pre-war garage. Knows everyone in the region and keeps meticulous records of every transaction.",
    attitude: "friendly",
    location: "Crossroads Settlement",
    quests: ["quest_supply_run_1"]
  },
  // ── QUEST GIVERS ──────────────────────────────────────────────────────────
  {
    id: "npc_questgiver_1",
    name: "Dr. Evelyn Cross",
    role: "Wasteland Scientist",
    faction: "independent",
    description: "A sharp, determined scientist searching for a pre-war research facility rumored to hold a cure for radiation sickness. She offers caps and medical supplies to anyone willing to help her locate it.",
    attitude: "friendly",
    location: "Wasteland Research Camp",
    quests: ["quest_lost_lab_1", "quest_medical_supplies_1"]
  },
  {
    id: "npc_questgiver_2",
    name: "Sheriff Ray Hollis",
    role: "Settlement Sheriff",
    faction: "settlers",
    description: "The no-nonsense law keeper of a small but growing settlement. Overwhelmed by threats from both Raiders and local wildlife, he quietly recruits capable outsiders to handle jobs his own people cannot.",
    attitude: "friendly",
    location: "Hollis Settlement",
    quests: ["quest_raider_camp_1", "quest_missing_settler_1"]
  },
  // ── FACTION LEADERS ───────────────────────────────────────────────────────
  {
    id: "npc_faction_leader_1",
    name: "Commander Vera Stone",
    role: "Faction Commander",
    faction: "wasteland_militia",
    description: "A former military officer who founded the Wasteland Militia after the collapse of local government. Disciplined, pragmatic, and fiercely protective of her people. Judges others by actions, not words.",
    attitude: "neutral",
    location: "Militia Headquarters — Fort Resolve",
    quests: ["quest_militia_trial_1", "quest_supply_convoy_1"]
  },
  {
    id: "npc_faction_leader_2",
    name: "The Broker",
    role: "Black Market Leader",
    faction: "shadow_market",
    description: "Known only by their title, The Broker runs a vast underground trading network dealing in information, rare goods, and off-the-books services. Their identity is a carefully guarded secret.",
    attitude: "neutral",
    location: "Unknown — Contact via dead drop",
    quests: ["quest_broker_job_1"]
  },
  // ── NEUTRAL ───────────────────────────────────────────────────────────────
  {
    id: "npc_neutral_1",
    name: "Pilgrim",
    role: "Wandering Hermit",
    faction: "none",
    description: "A solitary figure encountered on the road, clothed in rags and carrying a battered satchel. Rarely speaks more than a few words but has an uncanny knowledge of the roads and hidden caches ahead.",
    attitude: "neutral",
    location: "Wandering",
    quests: []
  },
  // ── HOSTILE ───────────────────────────────────────────────────────────────
  {
    id: "npc_hostile_1",
    name: "Gutter",
    role: "Raider Lieutenant",
    faction: "red_scar_raiders",
    description: "The violent second-in-command of the Red Scar raider gang. Takes pleasure in intimidating travelers and has a habit of collecting trophies from those who cross his path.",
    attitude: "hostile",
    location: "Red Scar Camp",
    quests: ["quest_raider_camp_1"]
  }
];
