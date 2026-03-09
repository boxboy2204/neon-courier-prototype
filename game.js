const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const hud = document.getElementById("hud");
const panel = document.getElementById("panel");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const keys = new Set();
const SAVE_KEY = "neon-courier-prototype-save-v1";
const UPGRADES_RESET_ONCE_KEY = "neon-courier-upgrades-reset-2026-03-09";

const state = {
  credits: 120,
  rep: 0,
  day: 1,
  cityHeat: 0,
  upgrades: {
    speed: 0,
    armor: 0,
    cargo: 0,
    speed_mk2: 0,
    armor_mk2: 0,
    cargo_mk2: 0,
    speed_mk3: 0,
    armor_mk3: 0,
    cargo_mk3: 0,
    speed_mk4: 0,
    armor_mk4: 0,
    cargo_mk4: 0,
    speed_mk5: 0,
    armor_mk5: 0,
    cargo_mk5: 0
  },
  mode: "contracts",
  contracts: [],
  selectedContractId: null,
  selectedPreview: null,
  selectedRoutePlan: null,
  currentContract: null,
  run: null,
  message: "",
  panelDirty: true,
  shake: 0,
  audioEnabled: true,
  bikeOwned: {
    bigger_wheels: false,
    flames: false,
    streamers: false,
    basket: false,
    neon_frame: false,
    exhaust_flames: false,
    smoke_plume: false,
    spark_shower: false,
    cash_trail: false,
    star_burst: false
  },
  bikeEquipped: {
    bigger_wheels: false,
    flames: false,
    streamers: false,
    basket: false,
    neon_frame: false,
    exhaust_flames: false,
    smoke_plume: false,
    spark_shower: false,
    cash_trail: false,
    star_burst: false
  },
  campaign: {
    chainProgress: 0,
    bossUnlocked: false,
    bossCompleted: 0,
    bikeCondition: 1
  },
  heatActionsUsed: {
    bribe: 0,
    cooldown: 0
  }
};

const audio = {
  ctx: null,
  unlocked: false,
  musicClock: 0,
  beatIndex: 0,
  sirenSample: null,
  lastSirenSampleAt: 0
};

const districts = [
  { name: "Harbor Neon", flood: 0.55, gangs: 0.7, patrol: 0.4 },
  { name: "Glass Market", flood: 0.25, gangs: 0.45, patrol: 0.7 },
  { name: "Rust Perimeter", flood: 0.75, gangs: 0.55, patrol: 0.25 }
];

const packageTraits = [
  { key: "fragile", label: "Fragile", risk: 1.25, reward: 1.4 },
  { key: "perishable", label: "Perishable", risk: 1.15, reward: 1.2 },
  { key: "illegal", label: "Illegal", risk: 1.35, reward: 1.6 },
  { key: "decoy", label: "Decoy", risk: 0.9, reward: 0.8 }
];

const objectivePool = [
  { key: "standard", label: "Standard Delivery", desc: "Hit all checkpoints and deliver.", rewardMult: 1, timeMult: 1, heatBonus: 0, completionBonus: 0 },
  { key: "no_damage", label: "No-Damage Run", desc: "Take no cargo damage for bonus payout.", rewardMult: 1.12, timeMult: 0.97, heatBonus: -0.22, completionBonus: 0.12 },
  { key: "stealth", label: "Stealth Route", desc: "Avoid all police collisions.", rewardMult: 1.1, timeMult: 0.98, heatBonus: -0.18, completionBonus: 0.11 },
  { key: "pickup", label: "Timed Pickup", desc: "Collect the pickup cache before final drop.", rewardMult: 1.16, timeMult: 0.95, heatBonus: -0.12, completionBonus: 0.14 },
  { key: "decoy_split", label: "Decoy Split", desc: "Collect decoy then real payload cache in order.", rewardMult: 1.24, timeMult: 0.93, heatBonus: -0.1, completionBonus: 0.16 }
];

const upgradeTracks = [
  {
    slot: "speed",
    stages: [
      { key: "speed", name: "Turbo Pedals", baseCost: 90, max: 4, effect: "+5% speed", stat: "speed", amount: 0.05 },
      { key: "speed_mk2", name: "Nitro Drivetrain", baseCost: 230, max: 3, effect: "+6% speed", stat: "speed", amount: 0.06 },
      { key: "speed_mk3", name: "Pulse Accelerator", baseCost: 560, max: 2, effect: "+7% speed", stat: "speed", amount: 0.07 },
      { key: "speed_mk4", name: "Flux Bearings", baseCost: 980, max: 2, effect: "+8% speed", stat: "speed", amount: 0.08 },
      { key: "speed_mk5", name: "Photon Sprint Kit", baseCost: 1580, max: 1, effect: "+9% speed", stat: "speed", amount: 0.09 }
    ]
  },
  {
    slot: "armor",
    stages: [
      { key: "armor", name: "Impact Frame", baseCost: 100, max: 4, effect: "-8% collision damage", stat: "armor", amount: 0.08 },
      { key: "armor_mk2", name: "Reactive Plating", baseCost: 250, max: 3, effect: "-9% collision damage", stat: "armor", amount: 0.09 },
      { key: "armor_mk3", name: "Aegis Composite", baseCost: 590, max: 2, effect: "-10% collision damage", stat: "armor", amount: 0.1 },
      { key: "armor_mk4", name: "Kinetic Mesh", baseCost: 1020, max: 2, effect: "-11% collision damage", stat: "armor", amount: 0.11 },
      { key: "armor_mk5", name: "Titan Lattice", baseCost: 1640, max: 1, effect: "-12% collision damage", stat: "armor", amount: 0.12 }
    ]
  },
  {
    slot: "cargo",
    stages: [
      { key: "cargo", name: "Cargo Seals", baseCost: 80, max: 4, effect: "+8 integrity", stat: "cargo", amount: 8 },
      { key: "cargo_mk2", name: "Reinforced Crate", baseCost: 210, max: 3, effect: "+9 integrity", stat: "cargo", amount: 9 },
      { key: "cargo_mk3", name: "Quantum Cradle", baseCost: 540, max: 2, effect: "+10 integrity", stat: "cargo", amount: 10 },
      { key: "cargo_mk4", name: "Adaptive Bay", baseCost: 940, max: 2, effect: "+11 integrity", stat: "cargo", amount: 11 },
      { key: "cargo_mk5", name: "Apex Carrier", baseCost: 1520, max: 1, effect: "+12 integrity", stat: "cargo", amount: 12 }
    ]
  }
];

const bikeCosmetics = [
  { key: "bigger_wheels", name: "Big Wheel Kit", cost: 140, effect: "Larger bicycle wheels" },
  { key: "flames", name: "Flame Decals", cost: 120, effect: "Flame paint on the frame" },
  { key: "streamers", name: "Bar Streamers", cost: 90, effect: "Handlebar streamers" },
  { key: "basket", name: "Front Basket", cost: 110, effect: "Cargo basket on the bike" },
  { key: "neon_frame", name: "Neon Frame Paint", cost: 160, effect: "Brighter frame color and glow" },
  { key: "exhaust_flames", name: "Afterburn Trail", cost: 190, effect: "Flames burst from rear while moving" },
  { key: "smoke_plume", name: "Smoke Jet", cost: 130, effect: "Stylized smoke plume from rear wheel" },
  { key: "spark_shower", name: "Spark Shower", cost: 150, effect: "Metal sparks stream behind the bike" },
  { key: "cash_trail", name: "Cash Rain", cost: 220, effect: "Bills fly out while riding" },
  { key: "star_burst", name: "Star Comet", cost: 170, effect: "Bright star particles trail behind" }
];
const rearTrailCosmeticKeys = ["exhaust_flames", "smoke_plume", "spark_shower", "cash_trail", "star_burst"];

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randi(min, max) {
  return Math.floor(rand(min, max + 1));
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function formatTime(seconds) {
  return `${Math.max(0, seconds).toFixed(1)}s`;
}

function getDangerBand(score) {
  if (score >= 1.55) return { label: "Extreme", cls: "danger-extreme" };
  if (score >= 1.15) return { label: "High", cls: "danger-high" };
  if (score >= 0.82) return { label: "Medium", cls: "danger-medium" };
  return { label: "Low", cls: "danger-low" };
}

function getChainNight(contract = null) {
  if (contract && contract.isBoss) return 6;
  return state.campaign.chainProgress + 1;
}

function contractDangerScore(contract) {
  const chainNight = getChainNight(contract);
  const gangsEnabled = chainNight >= 2 || contract.isBoss;
  const patrolEnabled = chainNight >= 3 || contract.isBoss;
  const visibilityPenalty = contract.forecast ? (1 - contract.forecast.visibility) * 0.45 : 0;
  const rainPenalty = contract.forecast ? contract.forecast.rain * 0.22 : 0;

  let score = contract.risk + visibilityPenalty + rainPenalty;
  if (gangsEnabled) score += contract.district.gangs * 0.38;
  if (patrolEnabled) score += contract.district.patrol * 0.46;
  if (contract.trait.key === "illegal") score += 0.18;
  if (contract.isBoss) score += 0.2;
  return score;
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ctr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function saveProgress() {
  try {
    const payload = {
      credits: state.credits,
      rep: state.rep,
      day: state.day,
      cityHeat: state.cityHeat,
      upgrades: state.upgrades,
      audioEnabled: state.audioEnabled,
      bikeOwned: state.bikeOwned,
      bikeEquipped: state.bikeEquipped,
      campaign: state.campaign,
      heatActionsUsed: state.heatActionsUsed
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
  } catch (_err) {
    // Ignore storage failures (private mode/restricted contexts).
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object") return;

    state.credits = Number.isFinite(data.credits) ? data.credits : state.credits;
    state.rep = Number.isFinite(data.rep) ? data.rep : state.rep;
    state.day = Number.isFinite(data.day) ? data.day : state.day;
    state.cityHeat = Number.isFinite(data.cityHeat) ? clamp(data.cityHeat, 0, 10) : state.cityHeat;

    if (data.upgrades && typeof data.upgrades === "object") {
      state.upgrades.speed = clamp(Number(data.upgrades.speed) || 0, 0, 4);
      state.upgrades.armor = clamp(Number(data.upgrades.armor) || 0, 0, 4);
      state.upgrades.cargo = clamp(Number(data.upgrades.cargo) || 0, 0, 4);
      state.upgrades.speed_mk2 = clamp(Number(data.upgrades.speed_mk2) || 0, 0, 3);
      state.upgrades.armor_mk2 = clamp(Number(data.upgrades.armor_mk2) || 0, 0, 3);
      state.upgrades.cargo_mk2 = clamp(Number(data.upgrades.cargo_mk2) || 0, 0, 3);
      state.upgrades.speed_mk3 = clamp(Number(data.upgrades.speed_mk3) || 0, 0, 2);
      state.upgrades.armor_mk3 = clamp(Number(data.upgrades.armor_mk3) || 0, 0, 2);
      state.upgrades.cargo_mk3 = clamp(Number(data.upgrades.cargo_mk3) || 0, 0, 2);
      state.upgrades.speed_mk4 = clamp(Number(data.upgrades.speed_mk4) || 0, 0, 2);
      state.upgrades.armor_mk4 = clamp(Number(data.upgrades.armor_mk4) || 0, 0, 2);
      state.upgrades.cargo_mk4 = clamp(Number(data.upgrades.cargo_mk4) || 0, 0, 2);
      state.upgrades.speed_mk5 = clamp(Number(data.upgrades.speed_mk5) || 0, 0, 1);
      state.upgrades.armor_mk5 = clamp(Number(data.upgrades.armor_mk5) || 0, 0, 1);
      state.upgrades.cargo_mk5 = clamp(Number(data.upgrades.cargo_mk5) || 0, 0, 1);
    }

    if (typeof data.audioEnabled === "boolean") {
      state.audioEnabled = data.audioEnabled;
    }

    if (data.bikeOwned && typeof data.bikeOwned === "object") {
      for (const item of bikeCosmetics) {
        if (typeof data.bikeOwned[item.key] === "boolean") state.bikeOwned[item.key] = data.bikeOwned[item.key];
      }
    }

    if (data.bikeEquipped && typeof data.bikeEquipped === "object") {
      for (const item of bikeCosmetics) {
        if (typeof data.bikeEquipped[item.key] === "boolean") state.bikeEquipped[item.key] = data.bikeEquipped[item.key];
      }
      normalizeRearTrailEquip();
    }

    if (data.campaign && typeof data.campaign === "object") {
      state.campaign.chainProgress = clamp(Number(data.campaign.chainProgress) || 0, 0, 5);
      state.campaign.bossUnlocked = Boolean(data.campaign.bossUnlocked);
      state.campaign.bossCompleted = Math.max(0, Number(data.campaign.bossCompleted) || 0);
      state.campaign.bikeCondition = clamp(Number(data.campaign.bikeCondition) || 1, 0.35, 1);
    }
    if (data.heatActionsUsed && typeof data.heatActionsUsed === "object") {
      state.heatActionsUsed.bribe = Math.max(0, Number(data.heatActionsUsed.bribe) || 0);
      state.heatActionsUsed.cooldown = Math.max(0, Number(data.heatActionsUsed.cooldown) || 0);
    }
  } catch (_err) {
    // Ignore malformed/blocked storage.
  }
}

function resetUpgradeProgressOnce() {
  try {
    if (localStorage.getItem(UPGRADES_RESET_ONCE_KEY) === "1") return;
    for (const key of Object.keys(state.upgrades)) {
      state.upgrades[key] = 0;
    }
    localStorage.setItem(UPGRADES_RESET_ONCE_KEY, "1");
    saveProgress();
    state.message = "Upgrade progress has been reset.";
    state.panelDirty = true;
  } catch (_err) {
    // Ignore storage failures.
  }
}

function normalizeRearTrailEquip() {
  let found = null;
  for (const key of rearTrailCosmeticKeys) {
    if (state.bikeEquipped[key]) {
      if (found === null) found = key;
      else state.bikeEquipped[key] = false;
    }
  }
}

function equipRearTrailExclusive(activeKey) {
  for (const key of rearTrailCosmeticKeys) {
    state.bikeEquipped[key] = key === activeKey;
  }
}

function getPlayerBikeStyle() {
  return {
    wheelScale: state.bikeEquipped.bigger_wheels ? 1.35 : 1,
    flames: state.bikeEquipped.flames,
    streamers: state.bikeEquipped.streamers,
    basket: state.bikeEquipped.basket,
    neon_frame: state.bikeEquipped.neon_frame,
    exhaust_flames: state.bikeEquipped.exhaust_flames,
    smoke_plume: state.bikeEquipped.smoke_plume,
    spark_shower: state.bikeEquipped.spark_shower,
    cash_trail: state.bikeEquipped.cash_trail,
    star_burst: state.bikeEquipped.star_burst,
    bodyColor: state.bikeEquipped.neon_frame ? "#4bf6d6" : "#39c4e8",
    glowColor: state.bikeEquipped.neon_frame ? "#d3fff8" : "#b8f5ff"
  };
}

function getSpeedBoost() {
  let bonus = 0;
  const track = upgradeTracks.find((t) => t.slot === "speed");
  if (track) {
    for (const stage of track.stages) {
      bonus += (state.upgrades[stage.key] || 0) * (stage.amount || 0);
    }
  }
  return 1 + bonus;
}

function getArmorScale() {
  let mitigation = 0;
  const track = upgradeTracks.find((t) => t.slot === "armor");
  if (track) {
    for (const stage of track.stages) {
      mitigation += (state.upgrades[stage.key] || 0) * (stage.amount || 0);
    }
  }
  return clamp(1 - mitigation, 0.12, 1);
}

function getCargoBonus() {
  let bonus = 0;
  const track = upgradeTracks.find((t) => t.slot === "cargo");
  if (track) {
    for (const stage of track.stages) {
      bonus += (state.upgrades[stage.key] || 0) * (stage.amount || 0);
    }
  }
  return bonus;
}

function getActiveUpgradeStage(track) {
  for (let i = 0; i < track.stages.length; i += 1) {
    const stage = track.stages[i];
    if ((state.upgrades[stage.key] || 0) < stage.max) return { stage, index: i, isFinal: false };
  }
  const last = track.stages[track.stages.length - 1];
  return { stage: last, index: track.stages.length - 1, isFinal: true };
}

function getUpgradeCost(stage, level, stageIndex) {
  const tierMultiplier = 1 + stageIndex * 0.85;
  return Math.round((stage.baseCost + level * 65) * tierMultiplier);
}

function getUpgradeTrackTotals(track) {
  return track.stages.reduce((sum, stage) => sum + (state.upgrades[stage.key] || 0) * (stage.amount || 0), 0);
}

function formatTrackTotal(track, value) {
  if (track.slot === "speed") return `+${Math.round(value * 100)}% speed`;
  if (track.slot === "armor") return `-${Math.round(value * 100)}% collision damage`;
  return `+${Math.round(value)} integrity`;
}

function describeContractObjective(contract) {
  return contract.objective ? contract.objective.desc : "Hit all checkpoints and deliver.";
}

function pickObjective(contract) {
  if (contract.isBoss) {
    return {
      key: "boss_gauntlet",
      label: "Boss Gauntlet",
      desc: "Survive ambush checkpoints, then reach the final escape beacon.",
      rewardMult: 1.35,
      timeMult: 0.92,
      heatBonus: 0.3,
      completionBonus: 0.22
    };
  }
  const illegal = contract.trait.key === "illegal";
  const roll = Math.random();
  if (illegal && roll < 0.28) return objectivePool.find((o) => o.key === "stealth") || objectivePool[0];
  if (roll < 0.23) return objectivePool.find((o) => o.key === "pickup") || objectivePool[0];
  if (roll < 0.41) return objectivePool.find((o) => o.key === "decoy_split") || objectivePool[0];
  if (roll < 0.63) return objectivePool.find((o) => o.key === "no_damage") || objectivePool[0];
  if (roll < 0.77) return objectivePool.find((o) => o.key === "stealth") || objectivePool[0];
  return objectivePool[0];
}

function buyBikeCosmetic(key) {
  const cosmetic = bikeCosmetics.find((c) => c.key === key);
  if (!cosmetic) return;
  if (state.bikeOwned[key]) return;
  if (state.credits < cosmetic.cost) return;

  state.credits -= cosmetic.cost;
  state.bikeOwned[key] = true;
  if (rearTrailCosmeticKeys.includes(key)) equipRearTrailExclusive(key);
  else state.bikeEquipped[key] = true;
  state.message = `${cosmetic.name} purchased and equipped.`;
  state.panelDirty = true;
  playSfx("buy");
  saveProgress();
}

function toggleBikeCosmetic(key) {
  const cosmetic = bikeCosmetics.find((c) => c.key === key);
  if (!cosmetic || !state.bikeOwned[key]) return;
  const next = !state.bikeEquipped[key];
  if (rearTrailCosmeticKeys.includes(key) && next) {
    equipRearTrailExclusive(key);
  } else {
    state.bikeEquipped[key] = next;
  }
  state.message = `${cosmetic.name} ${state.bikeEquipped[key] ? "equipped" : "unequipped"}.`;
  state.panelDirty = true;
  saveProgress();
}

function ensureAudio() {
  if (!state.audioEnabled) return null;
  if (!audio.ctx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    audio.ctx = new Ctx();
  }
  if (audio.ctx.state === "suspended") audio.ctx.resume();
  audio.unlocked = true;
  if (!audio.sirenSample) {
    const sample = new Audio("assets/11325622-police-siren-sound-effect-240674.mp3");
    sample.preload = "auto";
    sample.loop = false;
    sample.volume = 0.36;
    audio.sirenSample = sample;
  }
  return audio.ctx;
}

function playPoliceSirenSample() {
  if (!state.audioEnabled || !audio.unlocked) return;
  if (!audio.sirenSample) ensureAudio();
  if (!audio.sirenSample) return;
  const now = performance.now();
  if (now - audio.lastSirenSampleAt < 3200) return;
  audio.lastSirenSampleAt = now;
  try {
    audio.sirenSample.currentTime = 0;
    audio.sirenSample.play();
  } catch (_err) {
    // Ignore blocked media playback edge cases.
  }
}

function stopPoliceSirenSample() {
  if (!audio.sirenSample) return;
  audio.sirenSample.pause();
  audio.sirenSample.currentTime = 0;
}

function playTone({
  freq = 440,
  type = "sine",
  duration = 0.1,
  gain = 0.05,
  slideTo = null,
  attack = 0.008,
  release = 0.03
}) {
  const ctxAudio = ensureAudio();
  if (!ctxAudio) return;

  const t0 = ctxAudio.currentTime;
  const t1 = t0 + duration;
  const osc = ctxAudio.createOscillator();
  const g = ctxAudio.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t1);

  const safeAttack = clamp(attack, 0.002, duration * 0.6);
  const safeRelease = clamp(release, 0.01, duration * 0.9);
  const holdEnd = Math.max(t0 + safeAttack, t1 - safeRelease);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + safeAttack);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * 0.75), holdEnd);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);

  osc.connect(g);
  g.connect(ctxAudio.destination);
  osc.start(t0);
  osc.stop(t1 + 0.01);
}

function playSfx(name) {
  if (!state.audioEnabled) return;
  if (!audio.unlocked) return;

  if (name === "start") {
    playTone({ freq: 250, duration: 0.11, type: "triangle", gain: 0.03, slideTo: 335, attack: 0.004, release: 0.04 });
    playTone({ freq: 500, duration: 0.13, type: "sine", gain: 0.024, slideTo: 640, attack: 0.006, release: 0.05 });
    playTone({ freq: 760, duration: 0.08, type: "triangle", gain: 0.014, attack: 0.005, release: 0.03 });
  } else if (name === "hit") {
    playTone({ freq: 190, duration: 0.14, type: "sawtooth", gain: 0.036, slideTo: 118, attack: 0.003, release: 0.06 });
    playTone({ freq: 110, duration: 0.1, type: "triangle", gain: 0.02, slideTo: 80, attack: 0.002, release: 0.05 });
  } else if (name === "deliver") {
    playTone({ freq: 440, duration: 0.1, type: "triangle", gain: 0.028, attack: 0.005, release: 0.04 });
    playTone({ freq: 660, duration: 0.14, type: "sine", gain: 0.024, attack: 0.007, release: 0.05 });
    playTone({ freq: 880, duration: 0.16, type: "triangle", gain: 0.016, attack: 0.01, release: 0.05 });
  } else if (name === "fail") {
    playTone({ freq: 240, duration: 0.2, type: "sawtooth", gain: 0.03, slideTo: 95, attack: 0.003, release: 0.07 });
    playTone({ freq: 150, duration: 0.18, type: "triangle", gain: 0.02, slideTo: 85, attack: 0.004, release: 0.06 });
  } else if (name === "buy") {
    playTone({ freq: 680, duration: 0.07, type: "triangle", gain: 0.018, attack: 0.004, release: 0.03 });
    playTone({ freq: 920, duration: 0.06, type: "sine", gain: 0.013, attack: 0.004, release: 0.03 });
  } else if (name === "police") {
    playTone({ freq: 820, duration: 0.08, type: "triangle", gain: 0.02, slideTo: 620, attack: 0.003, release: 0.04 });
    playTone({ freq: 640, duration: 0.08, type: "triangle", gain: 0.02, slideTo: 860, attack: 0.003, release: 0.04 });
  }
}

function updateMusic(dt) {
  if (!state.audioEnabled || !audio.unlocked || state.mode !== "run") return;
  audio.musicClock += dt;

  const beatDuration = 0.32;
  while (audio.musicClock >= beatDuration) {
    audio.musicClock -= beatDuration;
    audio.beatIndex += 1;

    const illegal = state.currentContract && state.currentContract.trait.key === "illegal";
    const step = audio.beatIndex % 8;
    const bassPattern = illegal ? [94, 94, 105, 94, 116, 105, 94, 84] : [102, 102, 114, 102, 128, 114, 102, 96];
    const leadPattern = illegal ? [282, 315, 336, 315, 356, 336, 315, 282] : [322, 360, 384, 360, 432, 384, 360, 322];
    const bassFreq = bassPattern[step];
    const leadFreq = leadPattern[step];
    const accent = step === 0 || step === 4;

    playTone({
      freq: bassFreq,
      duration: 0.18,
      type: "triangle",
      gain: illegal ? 0.018 : 0.02,
      slideTo: bassFreq * 0.96,
      attack: 0.004,
      release: 0.08
    });
    playTone({
      freq: leadFreq,
      duration: accent ? 0.12 : 0.09,
      type: illegal ? "sawtooth" : "sine",
      gain: accent ? 0.013 : 0.01,
      slideTo: leadFreq * (illegal ? 1.03 : 1.01),
      attack: 0.006,
      release: 0.05
    });

    if (step % 2 === 1) {
      playTone({ freq: illegal ? 780 : 860, duration: 0.03, type: "square", gain: 0.004, attack: 0.002, release: 0.015 });
    }
    if (accent) {
      playTone({ freq: illegal ? 198 : 218, duration: 0.06, type: "triangle", gain: 0.01, attack: 0.003, release: 0.03 });
    }
  }
}

function addShake(amount) {
  state.shake = Math.max(state.shake, amount);
}

function polylineLength(points) {
  let len = 0;
  for (let i = 1; i < points.length; i += 1) {
    len += distance(points[i - 1], points[i]);
  }
  return len;
}

function getPlannedPoints(preview) {
  if (!preview) return [];
  if (!preview.waypoints.length) return preview.basePoints;
  return [preview.start, ...preview.waypoints, preview.end];
}

function sampleExposure(preview, points) {
  if (!preview || points.length < 2) return { flood: 0, patrol: 0, gang: 0 };

  let floodHits = 0;
  let patrolHits = 0;
  let gangHits = 0;
  let totalSamples = 0;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const steps = 12;
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      totalSamples += 1;

      for (const z of preview.floodZones) {
        if (Math.hypot(x - z.x, y - z.y) < z.r) {
          floodHits += 1;
          break;
        }
      }

      for (const r of preview.patrolRects) {
        if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) {
          patrolHits += 1;
          break;
        }
      }

      for (const g of preview.gangNodes) {
        if (Math.hypot(x - g.x, y - g.y) < g.r + 3) {
          gangHits += 1;
          break;
        }
      }
    }
  }

  const norm = Math.max(1, totalSamples);
  return {
    flood: floodHits / norm,
    patrol: patrolHits / norm,
    gang: gangHits / norm
  };
}

function computeRoutePlan(preview, contract) {
  const plannedPoints = getPlannedPoints(preview);
  const baseLength = polylineLength(preview.basePoints);
  const plannedLength = polylineLength(plannedPoints);
  const exposure = sampleExposure(preview, plannedPoints);

  const lengthRatio = clamp(baseLength / Math.max(1, plannedLength), 0.72, 1.22);
  const exposureScore = exposure.flood * 0.85 + exposure.patrol * 1.1 + exposure.gang * 0.95;
  const riskShift = clamp((lengthRatio - 1) * 1.1 + exposureScore * 1.6, -0.3, 1.4);

  const gangPressure = clamp(1 + riskShift * 0.8 + exposure.gang * 0.9, 0.65, 2.1);
  const patrolPressure = clamp(1 + riskShift * 0.75 + exposure.patrol * 1.0, 0.65, 2.2);
  const floodPressure = clamp(1 + riskShift * 0.45 + exposure.flood * 1.0, 0.7, 1.8);
  const policePressure = clamp(1 + riskShift * 0.9 + exposure.patrol * 0.5, 0.8, 2.4);

  const eta = clamp(plannedLength / (24 * getSpeedBoost()) + contract.district.flood * 2.5, 10, 60);
  const safety = clamp(1 - (riskShift + 0.25) / 1.65, 0, 1);

  return {
    points: plannedPoints,
    waypoints: preview.waypoints.slice(),
    baseLength,
    plannedLength,
    lengthRatio,
    exposure,
    riskShift,
    gangPressure,
    patrolPressure,
    floodPressure,
    policePressure,
    eta,
    safety
  };
}

function mapPreviewPointToWorld(point, preview) {
  const nx = clamp((point.x - 20) / Math.max(1, preview.width - 40), 0, 1);
  const ny = clamp((point.y - 10) / Math.max(1, preview.height - 20), 0, 1);
  return {
    x: 90 + nx * (WIDTH - 180),
    y: 60 + ny * (HEIGHT - 120)
  };
}

function mapWorldYToPreviewY(worldY, preview) {
  const ny = clamp((worldY - 60) / Math.max(1, HEIGHT - 120), 0, 1);
  return 10 + ny * (preview.height - 20);
}

function buildRoutePath(routePlan, preview) {
  if (!routePlan || !routePlan.points || !preview) {
    return [
      { x: 90, y: HEIGHT / 2 },
      { x: WIDTH - 90, y: HEIGHT / 2 }
    ];
  }
  return routePlan.points.map((pt) => mapPreviewPointToWorld(pt, preview));
}

function generateRoutePreview(contract) {
  const width = 250;
  const height = 145;
  const chainNight = getChainNight(contract);
  const gangsEnabled = chainNight >= 2 || contract.isBoss;
  const patrolEnabled = chainNight >= 3 || contract.isBoss;
  const start = { x: 20, y: height * 0.5 };
  const end = { x: width - 20, y: rand(20, height - 20) };

  const points = [start];
  const segments = 4;
  for (let i = 1; i < segments; i += 1) {
    points.push({
      x: (width / segments) * i + rand(-12, 12),
      y: rand(18, height - 18)
    });
  }
  points.push(end);

  const floodZones = Array.from({ length: 2 + Math.floor(contract.district.flood * 3) }, () => ({
    x: rand(50, width - 45),
    y: rand(20, height - 20),
    r: rand(9, 20)
  }));

  const patrolRects = patrolEnabled
    ? Array.from({ length: 1 + Math.floor(contract.district.patrol * 3) + (contract.trait.key === "illegal" ? 1 : 0) }, () => ({
      x: rand(50, width - 60),
      y: rand(12, height - 26),
      w: rand(20, 36),
      h: rand(12, 28)
    }))
    : [];

  const gangNodes = gangsEnabled
    ? Array.from({ length: 2 + Math.floor(contract.district.gangs * 3) }, () => ({
      x: rand(45, width - 35),
      y: rand(15, height - 15),
      r: rand(4, 7)
    }))
    : [];

  const preview = {
    contractId: contract.id,
    width,
    height,
    start,
    end,
    basePoints: points,
    waypoints: [],
    floodZones,
    patrolRects,
    gangNodes,
    trafficLaneYs: []
  };
  const laneYs = [Math.round(HEIGHT * 0.26), Math.round(HEIGHT * 0.5), Math.round(HEIGHT * 0.74)];
  preview.trafficLaneYs = laneYs.map((ly) => mapWorldYToPreviewY(ly, preview));

  state.selectedRoutePlan = computeRoutePlan(preview, contract);
  return preview;
}

function drawRoutePreview() {
  const preview = state.selectedPreview;
  const mini = document.getElementById("routePreview");
  if (!mini || !preview) return;

  const mctx = mini.getContext("2d");
  mctx.clearRect(0, 0, preview.width, preview.height);

  const bg = mctx.createLinearGradient(0, 0, preview.width, preview.height);
  bg.addColorStop(0, "#081a2f");
  bg.addColorStop(1, "#16345b");
  mctx.fillStyle = bg;
  mctx.fillRect(0, 0, preview.width, preview.height);

  // Show traffic corridors in mapped lane positions so road traffic is predictable.
  for (const laneY of preview.trafficLaneYs || []) {
    mctx.fillStyle = "rgba(184, 214, 247, 0.11)";
    mctx.fillRect(14, laneY - 7, preview.width - 28, 14);
    mctx.strokeStyle = "rgba(220, 238, 255, 0.24)";
    mctx.lineWidth = 1;
    for (let x = 16; x < preview.width - 24; x += 18) {
      mctx.beginPath();
      mctx.moveTo(x, laneY);
      mctx.lineTo(x + 10, laneY);
      mctx.stroke();
    }
  }

  preview.floodZones.forEach((z) => {
    mctx.beginPath();
    mctx.arc(z.x, z.y, z.r, 0, Math.PI * 2);
    mctx.fillStyle = "rgba(80, 132, 186, 0.45)";
    mctx.fill();
  });

  preview.patrolRects.forEach((r) => {
    mctx.fillStyle = "rgba(255, 169, 48, 0.45)";
    mctx.fillRect(r.x, r.y, r.w, r.h);
  });

  preview.gangNodes.forEach((g) => {
    mctx.beginPath();
    mctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
    mctx.fillStyle = "rgba(255, 95, 127, 0.8)";
    mctx.fill();
  });

  mctx.beginPath();
  mctx.moveTo(preview.basePoints[0].x, preview.basePoints[0].y);
  for (let i = 1; i < preview.basePoints.length; i += 1) {
    mctx.lineTo(preview.basePoints[i].x, preview.basePoints[i].y);
  }
  mctx.strokeStyle = "rgba(125, 176, 235, 0.6)";
  mctx.lineWidth = 2;
  mctx.stroke();

  const planned = getPlannedPoints(preview);
  mctx.beginPath();
  mctx.moveTo(planned[0].x, planned[0].y);
  for (let i = 1; i < planned.length; i += 1) {
    mctx.lineTo(planned[i].x, planned[i].y);
  }
  mctx.strokeStyle = "#1de0ff";
  mctx.lineWidth = 3;
  mctx.stroke();

  preview.waypoints.forEach((wp, i) => {
    mctx.beginPath();
    mctx.arc(wp.x, wp.y, 4.5, 0, Math.PI * 2);
    mctx.fillStyle = "#ffcf58";
    mctx.fill();
    mctx.fillStyle = "#0b1323";
    mctx.font = "10px Trebuchet MS";
    mctx.fillText(String(i + 1), wp.x - 2.6, wp.y + 3.4);
  });

  mctx.beginPath();
  mctx.arc(preview.start.x, preview.start.y, 4, 0, Math.PI * 2);
  mctx.fillStyle = "#1de0ff";
  mctx.fill();

  mctx.beginPath();
  mctx.arc(preview.end.x, preview.end.y, 5, 0, Math.PI * 2);
  mctx.fillStyle = "#6cff9a";
  mctx.fill();
}

function addWaypointFromPreviewClick(event) {
  const mini = event.currentTarget;
  if (!(mini instanceof HTMLCanvasElement)) return;
  const preview = state.selectedPreview;
  if (!preview) return;

  if (preview.waypoints.length >= 3) {
    state.message = "Route planner max: 3 waypoints.";
    state.panelDirty = true;
    return;
  }

  const rect = mini.getBoundingClientRect();
  const scaleX = preview.width / rect.width;
  const scaleY = preview.height / rect.height;
  const x = clamp((event.clientX - rect.left) * scaleX, 8, preview.width - 8);
  const y = clamp((event.clientY - rect.top) * scaleY, 8, preview.height - 8);

  preview.waypoints.push({ x, y });
  const contract = state.contracts.find((c) => c.id === state.selectedContractId);
  if (contract) state.selectedRoutePlan = computeRoutePlan(preview, contract);
  state.panelDirty = true;
}

function bindPreviewCanvas() {
  const mini = document.getElementById("routePreview");
  if (!mini || mini.dataset.bound === "1") return;
  mini.addEventListener("click", addWaypointFromPreviewClick);
  mini.dataset.bound = "1";
}

function drawBikePreviewPanel() {
  const preview = document.getElementById("bikePreview");
  if (!(preview instanceof HTMLCanvasElement)) return;
  const pctx = preview.getContext("2d");
  const w = preview.width;
  const h = preview.height;

  pctx.clearRect(0, 0, w, h);
  const bg = pctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "#091a2f");
  bg.addColorStop(1, "#12395b");
  pctx.fillStyle = bg;
  pctx.fillRect(0, 0, w, h);

  pctx.fillStyle = "rgba(255,255,255,0.08)";
  pctx.fillRect(0, h * 0.72, w, 3);

  pctx.save();
  pctx.translate(w * 0.5, h * 0.62);
  const style = getPlayerBikeStyle();
  drawBikeOnContext(pctx, 0, 0, 0, style.bodyColor, style.glowColor, 2.6, {
    ...style,
    flipX: true,
    trailIntensity: 0.92,
    elapsed: Date.now() / 1000
  });
  pctx.restore();
}

function generateWeather(contract, routePlan) {
  const floodPressure = routePlan?.floodPressure || 1;
  const rain = clamp(0.2 + contract.district.flood * 0.7 + (floodPressure - 1) * 0.35 + rand(-0.1, 0.1), 0.05, 0.95);
  const fog = clamp(0.12 + contract.district.flood * 0.35 + contract.district.patrol * 0.2 + rand(-0.08, 0.1), 0.02, 0.85);
  const visibility = clamp(1 - fog * 0.45 - rain * 0.16, 0.5, 1);
  const traction = clamp(1 - rain * 0.28 - contract.district.flood * 0.1, 0.65, 1);
  const drizzle = rain < 0.38;
  const storm = rain > 0.7 || fog > 0.58;

  const dropCount = Math.round(45 + rain * 140);
  const raindrops = Array.from({ length: dropCount }, () => ({
    x: rand(0, WIDTH),
    y: rand(-HEIGHT, HEIGHT),
    len: rand(8, 20),
    speed: rand(340, 620),
    drift: rand(-45, -22)
  }));

  const fogBanks = Array.from({ length: Math.round(2 + fog * 5) }, () => ({
    x: rand(0, WIDTH),
    y: rand(10, HEIGHT - 10),
    r: rand(90, 220),
    speed: rand(4, 12),
    alpha: rand(0.04, 0.11)
  }));

  const occluders = Array.from({ length: Math.round(2 + fog * 6) }, () => ({
    x: rand(0, WIDTH),
    y: rand(20, HEIGHT - 20),
    r: rand(80, 190),
    speed: rand(8, 22),
    alpha: rand(0.12, 0.24)
  }));

  let label = "Clear";
  if (storm) label = "Stormfront";
  else if (rain > 0.56) label = "Heavy Rain";
  else if (drizzle) label = fog > 0.45 ? "Mist + Drizzle" : "Drizzle";
  else if (fog > 0.5) label = "Dense Fog";

  return { rain, fog, visibility, traction, raindrops, fogBanks, occluders, label };
}

function forecastWeather(contract) {
  const rain = clamp(0.18 + contract.district.flood * 0.65, 0.05, 0.9);
  const fog = clamp(0.08 + contract.district.flood * 0.35 + contract.district.patrol * 0.2, 0.02, 0.82);
  const visibility = clamp(1 - fog * 0.42 - rain * 0.14, 0.52, 1);
  const traction = clamp(1 - rain * 0.2 - contract.district.flood * 0.08, 0.7, 1);

  let label = "Clear";
  if (rain > 0.7 || fog > 0.58) label = "Stormfront";
  else if (rain > 0.56) label = "Heavy Rain";
  else if (fog > 0.48) label = "Dense Fog";
  else if (rain > 0.34) label = "Light Rain";
  else if (fog > 0.3) label = "Mist";

  return { label, visibility, traction, rain, fog };
}

function makeBossContract() {
  const district = districts[randi(0, districts.length - 1)];
  const baseReward = randi(520, 700);
  return {
    id: createId(),
    district,
    trait: { key: "illegal", label: "Boss: Black Box" },
    reward: baseReward,
    timeLimit: 38,
    risk: 1.95,
    objective: pickObjective({ isBoss: true }),
    forecast: null,
    isBoss: true
  };
}

function generateContracts() {
  state.heatActionsUsed = { bribe: 0, cooldown: 0 };
  const progression = 1 + clamp((state.day - 1) * 0.03 + state.campaign.chainProgress * 0.04, 0, 1.1);
  const normalContracts = Array.from({ length: 3 }, () => {
    const district = districts[randi(0, districts.length - 1)];
    const trait = packageTraits[randi(0, packageTraits.length - 1)];
    const objective = pickObjective({ trait, isBoss: false });
    const baseReward = randi(72, 128) * progression;
    const risk = ((district.flood + district.gangs + district.patrol) / 3) * trait.risk * (0.92 + progression * 0.25);
    const timeLimit = clamp((43 - risk * 8.5 - state.cityHeat * 1.15) * objective.timeMult, 24, 46);
    const reward = Math.round(baseReward * (1 + risk * 0.65) * trait.reward * objective.rewardMult);
    return {
      id: createId(),
      district,
      trait,
      reward,
      timeLimit,
      risk: clamp(risk, 0.2, 1.8),
      objective,
      forecast: null,
      isBoss: false
    };
  });

  const illegalTrait = packageTraits.find((t) => t.key === "illegal");
  let illegalContracts = normalContracts.filter((c) => c.trait.key === "illegal");
  if (!illegalContracts.length && illegalTrait) {
    const idx = randi(0, normalContracts.length - 1);
    const contract = normalContracts[idx];
    contract.trait = illegalTrait;
    contract.objective = pickObjective(contract);
    const illegalRisk = (contract.district.flood + contract.district.gangs + contract.district.patrol) / 3 * illegalTrait.risk;
    contract.risk = clamp(illegalRisk, 0.2, 1.8);
    contract.timeLimit = clamp((42 - illegalRisk * 8.8 - state.cityHeat * 1.15) * contract.objective.timeMult, 24, 44);
    contract.reward = Math.round(contract.reward * 1.28);
    illegalContracts = [contract];
  }

  const nonIllegalMax = normalContracts
    .filter((c) => c.trait.key !== "illegal")
    .reduce((max, c) => Math.max(max, c.reward), 0);
  for (const contract of illegalContracts) {
    const minimumIllegal = nonIllegalMax + 35;
    if (contract.reward < minimumIllegal) {
      contract.reward = minimumIllegal;
    }
  }

  if (state.campaign.bossUnlocked) {
    normalContracts[0] = makeBossContract();
  }

  state.contracts = normalContracts;
  state.contracts.forEach((contract) => {
    contract.forecast = forecastWeather(contract);
  });

  const first = state.contracts[0] || null;
  state.selectedContractId = first ? first.id : null;
  state.selectedPreview = first ? generateRoutePreview(first) : null;
  state.selectedRoutePlan = first && state.selectedPreview ? computeRoutePlan(state.selectedPreview, first) : null;
  state.panelDirty = true;
}

function makeRun(contract, routePlan) {
  const speedBoost = getSpeedBoost();
  const armorScale = getArmorScale();
  const cargoBonus = getCargoBonus();

  const player = {
    x: 90,
    y: HEIGHT / 2,
    radius: 11,
    vx: 0,
    vy: 0,
    accel: 380 * speedBoost,
    maxSpeed: 230 * speedBoost,
    drag: 0.9,
    hitCooldown: 0
  };

  const destination = {
    x: WIDTH - 90,
    y: rand(90, HEIGHT - 90),
    radius: 16
  };
  const selectedPreview = state.selectedPreview && state.selectedPreview.contractId === contract.id
    ? state.selectedPreview
    : null;
  let routePath = buildRoutePath(routePlan, selectedPreview || state.selectedPreview);
  const worldWidth = contract.isBoss ? WIDTH * 3.2 : WIDTH;
  if (contract.isBoss) {
    const checkpoints = 8;
    routePath = [];
    for (let i = 0; i <= checkpoints; i += 1) {
      const x = 90 + ((worldWidth - 180) * (i / checkpoints));
      const y = i === 0 ? HEIGHT * 0.5 : rand(70, HEIGHT - 70);
      routePath.push({ x, y });
    }
  }
  const routeEnd = routePath[routePath.length - 1];
  const objectiveKey = contract.objective?.key || "standard";
  const midNodeIndex = clamp(Math.floor((routePath.length - 1) * 0.5), 1, routePath.length - 2);
  const nearEndNodeIndex = clamp(routePath.length - 2, 1, routePath.length - 2);
  const markerAt = (idx, tag) => ({
    x: clamp(routePath[idx].x + rand(-42, 42), 60, worldWidth - 60),
    y: clamp(routePath[idx].y + rand(-36, 36), 50, HEIGHT - 50),
    r: 14,
    tag
  });
  const objectiveMarkers = objectiveKey === "pickup"
    ? [markerAt(midNodeIndex, "pickup")]
    : objectiveKey === "decoy_split"
      ? [markerAt(midNodeIndex, "decoy"), markerAt(nearEndNodeIndex, "real")]
      : [];
  destination.y = clamp(routeEnd.y, 70, HEIGHT - 70);
  const weather = generateWeather(contract, routePlan);
  const chainNight = getChainNight(contract);
  const gangsEnabled = chainNight >= 2 || contract.isBoss;
  const patrolEnabled = chainNight >= 3 || contract.isBoss;
  const laneYs = [Math.round(HEIGHT * 0.26), Math.round(HEIGHT * 0.5), Math.round(HEIGHT * 0.74)];
  const progression = 1 + clamp((state.day - 1) * 0.015, 0, 0.45);
  const trafficCount = Math.max(4, Math.round((4 + contract.district.patrol * 4) * progression));
  const traffic = Array.from({ length: trafficCount }, (_, i) => {
    const laneY = laneYs[i % laneYs.length] + rand(-14, 14);
    const dir = i % 2 === 0 ? 1 : -1;
    const width = rand(28, 44);
    let x = dir > 0 ? rand(-WIDTH, worldWidth) : rand(0, worldWidth + WIDTH);
    if (Math.abs(x - 90) < 220 && Math.abs(laneY - HEIGHT * 0.5) < 86) {
      x += dir > 0 ? 280 : -280;
      x = clamp(x, -WIDTH, worldWidth + WIDTH);
    }
    return {
      x,
      y: laneY,
      dir,
      speed: rand(120, 210),
      w: width,
      h: rand(14, 19),
      color: Math.random() > 0.5 ? "#7c95b9" : "#8a6ea8"
    };
  });

  const chainPressure = 1 + state.campaign.chainProgress * 0.035 + (contract.isBoss ? 0.18 : 0) + (state.day > 6 ? (state.day - 6) * 0.01 : 0);
  const gangPoses = ["arms_crossed", "hands_hips", "pointing", "lean_back", "one_arm_cross"];
  const previewGangNodes = selectedPreview && gangsEnabled
    ? selectedPreview.gangNodes.map((node) => mapPreviewPointToWorld(node, selectedPreview))
    : null;
  const gangSeed = previewGangNodes || Array.from({
    length: gangsEnabled
      ? Math.max(2, Math.round((randi(3, 5) + Math.floor(contract.district.gangs * 2)) * (routePlan?.gangPressure || 1) * chainPressure))
      : 0
  }, () => ({
      x: rand(220, worldWidth - 120),
    y: rand(70, HEIGHT - 70)
  }));
  const gangs = gangSeed.map((seed) => {
    const memberCount = randi(2, 4);
    const members = Array.from({ length: memberCount }, (_, i) => ({
      ox: -8 + i * 6 + rand(-2, 2),
      oy: rand(-2, 6),
      pose: gangPoses[randi(0, gangPoses.length - 1)],
      phase: rand(0, Math.PI * 2),
      tint: Math.random() > 0.5 ? "#7a2a3f" : "#2a587a"
    }));
    return {
      x: seed.x,
      y: seed.y,
      vx: rand(-58, 58),
      vy: rand(-58, 58),
      radius: rand(14, 20),
      phase: rand(0, Math.PI * 2),
      members,
      hasBike: Math.random() > 0.45
    };
  });

  const patrolCountBase = randi(1, 2) + Math.floor(contract.district.patrol * 2.5) + (contract.trait.key === "illegal" ? 1 : 0);
  const patrolCount = patrolEnabled ? Math.max(1, Math.round(patrolCountBase * (routePlan?.patrolPressure || 1) * chainPressure)) : 0;
  const patrols = selectedPreview && patrolEnabled
    ? selectedPreview.patrolRects.map((r) => {
      const p0 = mapPreviewPointToWorld({ x: r.x, y: r.y }, selectedPreview);
      const p1 = mapPreviewPointToWorld({ x: r.x + r.w, y: r.y + r.h }, selectedPreview);
      const w = Math.max(16, p1.x - p0.x);
      const h = Math.max(16, p1.y - p0.y);
      return {
        horizontal: w >= h,
        progress: rand(0, 1),
        speed: rand(0.1, 0.22) * (routePlan?.patrolPressure || 1),
        y: p0.y,
        x: p0.x,
        w,
        h
      };
    })
    : Array.from({ length: patrolCount }, () => {
      const horizontal = Math.random() > 0.5;
      return {
        horizontal,
        progress: rand(0, 1),
        speed: rand(0.12, 0.24),
        y: rand(90, HEIGHT - 90),
        x: rand(200, worldWidth - 160),
        w: horizontal ? rand(130, 190) : 28,
        h: horizontal ? 28 : rand(130, 190)
      };
    });

  const floodCount = Math.max(1, Math.round((randi(2, 3) + Math.floor(contract.district.flood * 2.5)) * (routePlan?.floodPressure || 1) * (1 + state.campaign.chainProgress * 0.022)));
  const floodZones = selectedPreview
    ? selectedPreview.floodZones.map((zone) => {
      const center = mapPreviewPointToWorld(zone, selectedPreview);
      const rx = (WIDTH - 180) / Math.max(1, selectedPreview.width - 40);
      const ry = (HEIGHT - 120) / Math.max(1, selectedPreview.height - 20);
      return {
        x: center.x,
        y: center.y,
        r: Math.max(18, zone.r * ((rx + ry) * 0.5) * (routePlan?.floodPressure || 1))
      };
    })
    : Array.from({ length: floodCount }, () => ({
      x: rand(220, worldWidth - 140),
      y: rand(80, HEIGHT - 80),
      r: rand(34, 58)
    }));

  const policeBase = 1 + Math.floor(state.cityHeat / 4);
  const policeCount = contract.trait.key === "illegal"
    ? Math.max(1, Math.round(policeBase * (routePlan?.policePressure || 1) * (contract.isBoss ? 1.2 : 1)))
    : 0;
  const police = Array.from({ length: policeCount }, (_, idx) => ({
    x: 40,
    y: HEIGHT * (0.25 + idx * 0.4),
    vx: rand(20, 50),
    vy: rand(-20, 20),
    radius: 12,
    flash: 0
  }));

  return {
    player,
    destination,
    gangs,
    patrols,
    floodZones,
    police,
    routePlan,
    worldWidth,
    scrollX: 0,
    sideScrollActive: false,
    sideScrollTriggered: false,
    routePath,
    routeNodeIndex: 1,
    objectiveMarkers,
    objectiveIndex: 0,
    tookDamage: false,
    policeHits: 0,
    bossPhaseIndex: 0,
    bossPhaseNodes: contract.isBoss ? [2, 4] : [],
    bossEscapeActive: false,
    bossEscapePoint: { x: 70, y: rand(80, HEIGHT - 80), radius: 18 },
    bossEscapeTimer: 10,
    weather,
    traffic,
    wheelSpin: 0,
    elapsed: 0,
    chaseStart: contract.trait.key === "illegal" ? 3.2 : Infinity,
    nextSiren: 1.3,
    time: contract.timeLimit + (contract.isBoss ? 26 : 0),
    maxIntegrity: clamp(100 + cargoBonus, 80, 170),
    integrity: Math.round(clamp(100 + cargoBonus, 80, 170) * state.campaign.bikeCondition),
    done: false,
    hitFlash: 0,
    decoySaved: false,
    armorScale,
    spinoutTimer: 0,
    spinCooldown: 0,
    inFloodLastFrame: false,
    spinVisualAngle: 0,
    spinVisualVel: 0,
    trafficSpawnGrace: 1.5
  };
}

function getBribeCost() {
  return Math.round(140 + state.cityHeat * 45 + state.day * 4);
}

function getCooldownCost() {
  return Math.round(90 + state.day * 6);
}

function useHeatBribe() {
  const cost = getBribeCost();
  if (state.heatActionsUsed.bribe >= 1) return;
  if (state.credits < cost) return;
  state.credits -= cost;
  state.cityHeat = clamp(state.cityHeat - 2.2, 0, 10);
  state.heatActionsUsed.bribe += 1;
  state.message = `Bribe paid. Heat reduced by 2.2.`;
  state.panelDirty = true;
  saveProgress();
}

function runCooldownOperation() {
  const cost = getCooldownCost();
  if (state.heatActionsUsed.cooldown >= 1) return;
  if (state.credits < cost) return;
  state.credits -= cost;
  state.day += 1;
  state.cityHeat = clamp(state.cityHeat - 1.6, 0, 10);
  state.heatActionsUsed.cooldown += 1;
  state.message = "Cooldown operation complete. Night advanced; heat dropped.";
  generateContracts();
  state.panelDirty = true;
  saveProgress();
}

function evaluateObjective(run, contract) {
  const objective = contract.objective || objectivePool[0];
  if (objective.key === "no_damage" && run.tookDamage) {
    return { ok: false, reason: "Objective failed: no-damage requirement broken." };
  }
  if (objective.key === "stealth" && run.policeHits > 0) {
    return { ok: false, reason: "Objective failed: police contact detected." };
  }
  if ((objective.key === "pickup" || objective.key === "decoy_split") && run.objectiveIndex < run.objectiveMarkers.length) {
    return { ok: false, reason: "Objective failed: required cache not collected." };
  }
  return { ok: true, heatBonus: objective.heatBonus || 0 };
}

function triggerBossAmbush(run) {
  run.time -= 0.8;
  for (let i = 0; i < 2; i += 1) {
    run.gangs.push({
      x: rand(180, WIDTH - 120),
      y: rand(60, HEIGHT - 60),
      vx: rand(-68, 68),
      vy: rand(-68, 68),
      radius: rand(14, 18),
      phase: rand(0, Math.PI * 2),
      members: [{ ox: -4, oy: 1, pose: "arms_crossed", phase: rand(0, Math.PI * 2), tint: "#7a2a3f" }, { ox: 2, oy: 1, pose: "hands_hips", phase: rand(0, Math.PI * 2), tint: "#2a587a" }],
      hasBike: true
    });
  }
  run.police.push({
    x: 30,
    y: rand(80, HEIGHT - 80),
    vx: rand(30, 60),
    vy: rand(-25, 25),
    radius: 12,
    flash: 0
  });
  state.message = `Boss ambush phase ${run.bossPhaseIndex + 1} triggered.`;
  state.panelDirty = true;
}

function grantBossRewards() {
  const bonusCredits = 240 + state.campaign.bossCompleted * 40;
  state.credits += bonusCredits;
  const unowned = bikeCosmetics.filter((c) => !state.bikeOwned[c.key]);
  if (unowned.length) {
    const reward = unowned[randi(0, unowned.length - 1)];
    state.bikeOwned[reward.key] = true;
    state.bikeEquipped[reward.key] = true;
    state.message += ` Boss cache unlocked cosmetic: ${reward.name}.`;
  }
  return bonusCredits;
}

function startContract(contractId) {
  const contract = state.contracts.find((c) => c.id === contractId);
  if (!contract) return;

  const routePlan = state.selectedRoutePlan || (state.selectedPreview ? computeRoutePlan(state.selectedPreview, contract) : null);
  state.currentContract = contract;
  state.mode = "run";
  const objectiveLabel = contract.objective ? ` Objective: ${contract.objective.label}.` : "";
  state.message = (contract.isBoss
    ? "Boss delivery active. Long-route gauntlet with 8 checkpoints."
    : contract.trait.key === "illegal"
      ? "Illegal package detected. Keep moving if sirens arrive."
      : "Route locked. Stay clean and deliver fast.") + objectiveLabel;
  state.run = makeRun(contract, routePlan);
  state.panelDirty = true;
  audio.musicClock = 0;
  playSfx("start");
}

function collisionWithRectCircle(circle, rect) {
  return circle.x + circle.radius > rect.x && circle.x - circle.radius < rect.x + rect.w && circle.y + circle.radius > rect.y && circle.y - circle.radius < rect.y + rect.h;
}

function applyDamage(base, source) {
  const run = state.run;
  const contract = state.currentContract;
  if (!run || !contract) return;

  if (run.player.hitCooldown > 0) return;

  let damage = base * run.armorScale;
  if (contract.trait.key === "fragile") damage *= 1.55;

  if (contract.trait.key === "decoy" && !run.decoySaved) {
    run.decoySaved = true;
    damage = 0;
    state.message = "Decoy package absorbed a hit.";
  } else {
    state.message = source === "police"
      ? "Police clipped your cargo."
      : source === "traffic"
        ? "Traffic collision. Cargo integrity lost."
        : "Package took impact damage.";
  }

  run.integrity -= damage;
  if (damage > 0.1) run.tookDamage = true;
  if (source === "police") run.policeHits += 1;
  run.player.hitCooldown = 0.35;
  run.hitFlash = 0.16;
  addShake(source === "police" ? 8 : 5);
  playSfx("hit");
  state.panelDirty = true;
}

function finishRun(success, reason) {
  const run = state.run;
  const c = state.currentContract;
  if (!run || !c || run.done) return;

  run.done = true;
  state.mode = "result";
  stopPoliceSirenSample();

  if (success) {
    const objectiveCheck = evaluateObjective(run, c);
    if (!objectiveCheck.ok) {
      success = false;
      reason = objectiveCheck.reason;
    }
  }

  if (success) {
    const integrityBonus = Math.round(Math.max(0, run.integrity) * 0.6);
    const objectiveBonus = Math.round(c.reward * (c.objective?.completionBonus || 0));
    const payout = c.reward + integrityBonus + objectiveBonus;
    const integrityRatio = clamp(run.integrity / Math.max(1, run.maxIntegrity), 0, 1);
    const wasIllegal = c.trait.key === "illegal";
    let heatDelta = wasIllegal ? 1 : 0.4;
    if (!wasIllegal) {
      const cleanDeliveryBonus = 0.5 + integrityRatio * 0.6;
      heatDelta -= cleanDeliveryBonus;
      if (c.trait.key === "decoy") heatDelta -= 0.2;
    }
    heatDelta += c.objective?.heatBonus || 0;
    state.cityHeat = clamp(state.cityHeat + heatDelta, 0, 10);
    const heatPrefix = heatDelta <= 0 ? "" : "+";
    const heatText = `${heatPrefix}${heatDelta.toFixed(1)}`;

    state.credits += payout;
    state.rep += Math.round(5 + c.risk * 6);
    if (c.isBoss) {
      state.campaign.chainProgress = 0;
      state.campaign.bossUnlocked = false;
      state.campaign.bossCompleted += 1;
      state.campaign.bikeCondition = 1;
      const bossBonus = grantBossRewards();
      state.message = `Boss delivery complete. +${payout + bossBonus} credits (${c.reward} base + ${integrityBonus} integrity + ${objectiveBonus} objective + ${bossBonus} boss cache). Heat ${heatText}.`;
    } else {
      state.campaign.bikeCondition = clamp(run.integrity / Math.max(1, run.maxIntegrity), 0.35, 1);
      state.campaign.chainProgress = clamp(state.campaign.chainProgress + 1, 0, 5);
      if (state.campaign.chainProgress >= 5 && !state.campaign.bossUnlocked) {
        state.campaign.bossUnlocked = true;
        state.message = `Delivered. +${payout} credits. Heat ${heatText}. 5-night chain complete, boss delivery unlocked.`;
      } else {
        state.message = `Delivered. +${payout} credits (${c.reward} base + ${integrityBonus} integrity + ${objectiveBonus} objective). Heat ${heatText}.`;
      }
    }
    playSfx("deliver");
  } else {
    const salvage = Math.round(c.reward * 0.25);
    state.credits += salvage;
    state.cityHeat = clamp(state.cityHeat + 0.55, 0, 10);
    if (!c.isBoss) {
      state.campaign.chainProgress = Math.max(0, state.campaign.chainProgress - 1);
      state.campaign.bossUnlocked = false;
      state.campaign.bikeCondition = 1;
    } else {
      state.campaign.bikeCondition = 1;
    }
    state.message = `${reason} Salvage recovered: +${salvage} credits. Chain ${c.isBoss ? "reset" : "reduced by 1"}.`;
    playSfx("fail");
  }

  state.day += 1;
  generateContracts();
  state.panelDirty = true;
  saveProgress();
}

function buyUpgrade(key) {
  let item = null;
  let track = null;
  for (const t of upgradeTracks) {
    const found = t.stages.find((stage) => stage.key === key);
    if (found) {
      item = found;
      track = t;
      break;
    }
  }
  if (!item || !track) return;

  const level = state.upgrades[key] || 0;
  if (level >= item.max) return;

  const stageIndex = track.stages.findIndex((s) => s.key === key);
  const cost = getUpgradeCost(item, level, stageIndex);
  if (state.credits < cost) return;

  state.credits -= cost;
  state.upgrades[key] = level + 1;

  const justMaxed = state.upgrades[key] >= item.max;
  if (justMaxed) {
    const nextStage = track.stages[stageIndex + 1];
    state.message = nextStage
      ? `${item.name} maxed. ${nextStage.name} unlocked in Garage.`
      : `${item.name} mastered.`;
  } else {
    state.message = `${item.name} upgraded to level ${state.upgrades[key]}.`;
  }
  state.panelDirty = true;
  playSfx("buy");
  saveProgress();
}

function renderHud() {
  const run = state.run;
  const illegal = state.currentContract && state.currentContract.trait.key === "illegal";
  const healthRatio = run ? clamp(run.integrity / Math.max(1, run.maxIntegrity || 100), 0, 1) : 1;
  const handlingPct = Math.round(45 + healthRatio * 55);
  hud.innerHTML = `
    <div class="stat"><div class="label">Credits</div><div class="value">${state.credits}</div></div>
    <div class="stat"><div class="label">Reputation</div><div class="value">${state.rep}</div></div>
    <div class="stat"><div class="label">Night</div><div class="value">${state.day}</div></div>
    <div class="stat"><div class="label">Chain</div><div class="value ${state.campaign.bossUnlocked ? "good" : "muted"}">${state.campaign.bossUnlocked ? "Boss Ready" : `${state.campaign.chainProgress}/5`}</div></div>
    <div class="stat"><div class="label">City Heat</div><div class="value ${state.cityHeat > 6 ? "bad" : "warn"}">${state.cityHeat.toFixed(1)}</div></div>
    <div class="stat"><div class="label">Run</div><div class="value">${run ? `${formatTime(run.time)} / ${Math.max(0, run.integrity).toFixed(0)}%` : "Idle"}</div></div>
    <div class="stat"><div class="label">Handling</div><div class="value ${handlingPct < 72 ? "warn" : "good"}">${run ? `${handlingPct}%` : "--"}</div></div>
    <div class="stat"><div class="label">Weather</div><div class="value">${run ? `${run.weather.label}` : "Forecast"}</div></div>
    <div class="stat"><div class="label">Audio</div><div class="value">${state.audioEnabled ? "On" : "Off"}${illegal && state.mode === "run" ? " | Wanted" : ""}</div></div>
  `;
}

function renderPanel() {
  if (state.mode === "contracts") {
    const progressLabel = state.campaign.bossUnlocked
      ? "Boss delivery available this night."
      : `Complete ${5 - state.campaign.chainProgress} more successful deliveries to unlock boss.`;
    const selectedContract = state.contracts.find((c) => c.id === state.selectedContractId) || null;
    const selectedIsBoss = Boolean(selectedContract && selectedContract.isBoss);
    const bribeCost = getBribeCost();
    const cooldownCost = getCooldownCost();
    panel.innerHTML = `
      <h2>Contract Board</h2>
      <p class="muted">Campaign: ${state.campaign.chainProgress}/5 chain | Boss completions: ${state.campaign.bossCompleted}</p>
      <p class="${state.campaign.bossUnlocked ? "good" : "muted"}">${progressLabel}</p>
      <div class="control-row">
        <button data-heat-bribe="1" ${state.heatActionsUsed.bribe >= 1 || state.credits < bribeCost ? "disabled" : ""}>Bribe Network (${bribeCost})</button>
        <button data-heat-cooldown="1" ${state.heatActionsUsed.cooldown >= 1 || state.credits < cooldownCost ? "disabled" : ""}>Cooldown Op (${cooldownCost})</button>
      </div>
      <p class="muted">Heat tools refresh each night. Bribe: -2.2 heat. Cooldown Op: advance night, -1.6 heat.</p>
      <div class="cards">
        ${state.contracts
          .map((c) => {
            const selected = c.id === state.selectedContractId;
            const danger = getDangerBand(contractDangerScore(c));
            const chainNight = getChainNight(c);
            const gangsOn = chainNight >= 2 || c.isBoss;
            const patrolOn = chainNight >= 3 || c.isBoss;
            return `
            <article class="card ${selected ? "selected" : ""}">
              <strong>${c.district.name}</strong>
              <p>Package: <span class="${c.isBoss ? "bad" : "warn"}">${c.trait.label}</span></p>
              <p><span class="danger-chip ${danger.cls}">${danger.label} Danger</span>${c.isBoss ? ` <span class="danger-chip danger-extreme">Boss Contract</span>` : ""}</p>
              <p class="muted">Chain Night ${chainNight}: ${gangsOn ? "Gangs On" : "Gangs Off"} | ${patrolOn ? "Patrols On" : "Patrols Off"}</p>
              <p>Forecast: <span class="${c.forecast && c.forecast.fog > 0.46 ? "warn" : "muted"}">${c.forecast ? c.forecast.label : "Unknown"}</span></p>
              <p>Visibility: ${c.forecast ? `${Math.round(c.forecast.visibility * 100)}%` : "--"} | Traction: ${c.forecast ? `${Math.round(c.forecast.traction * 100)}%` : "--"}</p>
              <p>Objective: <span class="warn">${c.objective ? c.objective.label : "Standard Delivery"}</span></p>
              <p class="muted">${describeContractObjective(c)}</p>
              <p>Time Limit: ${c.timeLimit.toFixed(1)}s</p>
              <p>Risk: ${(c.risk * 10).toFixed(0)} / 18</p>
              <p>Base Reward: <span class="good">${c.reward}</span> credits</p>
              <button data-preview="${c.id}">${selected ? "Previewing" : "Preview Route"}</button>
            </article>`;
          })
          .join("")}
      </div>

      ${state.selectedContractId
        ? `
        <h2 style="margin-top: 14px;">Route Preview</h2>
        <div class="preview-wrap">
          ${selectedIsBoss
            ? `<div class="card" style="min-width: 250px; min-height: 145px; display:flex; align-items:center; justify-content:center; text-align:center;">
                <p class="warn" style="font-size: 18px; margin: 0;">Side-scrolling mode, no minimap.</p>
              </div>`
            : `<canvas id="routePreview" width="250" height="145"></canvas>`}
          <div>
            <p class="muted">${selectedIsBoss ? "Boss route is fixed for long-form side-scrolling combat." : "Click minimap to place up to 3 waypoints. Your plan changes hazard pressure."}</p>
            <p>Estimated Travel Time: <span class="warn">${state.selectedRoutePlan ? state.selectedRoutePlan.eta.toFixed(1) : "--"}s</span></p>
            <p>Contract Limit: <span class="good">${selectedContract?.timeLimit.toFixed(1) || "--"}s</span></p>
            <p>Route Safety: <span class="${state.selectedRoutePlan && state.selectedRoutePlan.safety > 0.6 ? "good" : state.selectedRoutePlan && state.selectedRoutePlan.safety > 0.35 ? "warn" : "bad"}">${state.selectedRoutePlan ? `${Math.round(state.selectedRoutePlan.safety * 100)}%` : "--"}</span></p>
            <p>Route Readout: ${
              state.selectedRoutePlan
                ? `<span class="danger-chip ${getDangerBand(1.8 - state.selectedRoutePlan.safety).cls}">${getDangerBand(1.8 - state.selectedRoutePlan.safety).label}</span>`
                : "--"
            }</p>
            <p class="muted">Pressure: Gang x${state.selectedRoutePlan ? state.selectedRoutePlan.gangPressure.toFixed(2) : "--"}, Patrol x${state.selectedRoutePlan ? state.selectedRoutePlan.patrolPressure.toFixed(2) : "--"}, Flood x${state.selectedRoutePlan ? state.selectedRoutePlan.floodPressure.toFixed(2) : "--"}</p>
            ${selectedIsBoss ? "" : `<div class="control-row">
              <button data-waypoint-undo="1" ${state.selectedPreview && state.selectedPreview.waypoints.length ? "" : "disabled"}>Undo Waypoint</button>
              <button data-waypoint-clear="1" ${state.selectedPreview && state.selectedPreview.waypoints.length ? "" : "disabled"}>Clear Route</button>
            </div>`}
            <button data-contract="${state.selectedContractId}">Accept Contract</button>
          </div>
        </div>
      `
        : ""}

      <h2 style="margin-top: 14px;">Garage Upgrades</h2>
      <div class="cards">
        ${upgradeTracks
          .map((track) => {
            const active = getActiveUpgradeStage(track);
            const u = active.stage;
            const lvl = state.upgrades[u.key] || 0;
            const cost = getUpgradeCost(u, lvl, active.index);
            const maxed = lvl >= u.max;
            const tierLabel = `Tier ${active.index + 1}`;
            const totalNow = getUpgradeTrackTotals(track);
            const totalNext = totalNow + (maxed ? 0 : (u.amount || 0));
            return `
              <article class="card">
                <strong>${u.name}</strong>
                <p>${u.effect}</p>
                <p>${tierLabel} | Level: ${lvl}/${u.max}</p>
                <p class="muted">Current: ${formatTrackTotal(track, totalNow)}</p>
                <p class="muted">After Next Buy: ${formatTrackTotal(track, totalNext)}</p>
                <button data-upgrade="${u.key}" ${maxed || state.credits < cost ? "disabled" : ""}>${maxed ? "Maxed" : `Buy (${cost})`}</button>
              </article>
            `;
          })
          .join("")}
      </div>

      <h2 style="margin-top: 14px;">Bike Garage</h2>
      <div class="preview-wrap">
        <canvas id="bikePreview" width="250" height="145"></canvas>
        <div>
          <p class="muted">Your courier bicycle setup appears during gameplay.</p>
          <p>Owned cosmetics: ${bikeCosmetics.filter((item) => state.bikeOwned[item.key]).length}/${bikeCosmetics.length}</p>
          <button data-open-customize="1">Customize Bike</button>
        </div>
      </div>

      <div class="control-row">
        <button data-audio-toggle="1">${state.audioEnabled ? "Mute Audio" : "Enable Audio"}</button>
      </div>

      ${state.message ? `<p class="muted" style="margin-top: 12px;">${state.message}</p>` : ""}
    `;

    drawRoutePreview();
    bindPreviewCanvas();
    drawBikePreviewPanel();
  } else if (state.mode === "customize") {
    panel.innerHTML = `
      <h2>Bike Customization</h2>
      <div class="preview-wrap">
        <canvas id="bikePreview" width="250" height="145"></canvas>
        <div>
          <p class="muted">Buy cosmetics with credits, then equip/unequip them.</p>
          <p class="muted">Rear trail effects share one slot: only one can be equipped at a time.</p>
          <p>Credits: <span class="good">${state.credits}</span></p>
          <button data-close-customize="1">Back to Contract Board</button>
        </div>
      </div>
      <div class="cards" style="margin-top: 12px;">
        ${bikeCosmetics
          .map((item) => {
            const owned = state.bikeOwned[item.key];
            const equipped = state.bikeEquipped[item.key];
            return `
              <article class="card">
                <strong>${item.name}</strong>
                <p>${item.effect}</p>
                <p>${owned ? `<span class="good">Owned</span> ${equipped ? "(Equipped)" : ""}` : `Cost: ${item.cost} credits`}</p>
                <button ${owned ? `data-bike-toggle="${item.key}"` : `data-bike-buy="${item.key}"`} ${!owned && state.credits < item.cost ? "disabled" : ""}>
                  ${owned ? (equipped ? "Unequip" : "Equip") : `Buy (${item.cost})`}
                </button>
              </article>
            `;
          })
          .join("")}
      </div>
      ${state.message ? `<p class="muted" style="margin-top: 12px;">${state.message}</p>` : ""}
    `;
    drawBikePreviewPanel();
  } else if (state.mode === "run") {
    const c = state.currentContract;
    const run = state.run;
    const illegal = c && c.trait.key === "illegal";
    const healthRatio = run ? clamp(run.integrity / Math.max(1, run.maxIntegrity || 100), 0, 1) : 1;
    const handlingPct = Math.round(45 + healthRatio * 55);
    const objectiveProgress = run && run.objectiveMarkers.length
      ? `${run.objectiveIndex}/${run.objectiveMarkers.length} caches`
      : "N/A";
    const bossEscapeInfo = run && run.bossEscapeActive ? ` | Escape Timer: ${Math.max(0, run.bossEscapeTimer).toFixed(1)}s` : "";
    panel.innerHTML = `
      <h2>Active Run: ${c.district.name}</h2>
      <p class="muted">Package: ${c.trait.label} | Reward: ${c.reward} | Reach beacon before timer ends.</p>
      ${run ? `<p>Objective: <span class="warn">${c.objective ? c.objective.label : "Standard Delivery"}</span> | ${c.objective ? c.objective.desc : "Hit checkpoints and deliver."}</p>` : ""}
      ${run ? `<p class="muted">Objective Progress: ${objectiveProgress}${c.objective && c.objective.key === "stealth" ? ` | Police contacts: ${run.policeHits}` : ""}${c.objective && c.objective.key === "no_damage" ? ` | Damage taken: ${run.tookDamage ? "Yes" : "No"}` : ""}${bossEscapeInfo}</p>` : ""}
      ${run ? `<p class="muted">Weather: ${run.weather.label} | Visibility ${Math.round(run.weather.visibility * 100)}% | Traction ${Math.round(run.weather.traction * 100)}%</p>` : ""}
      ${run ? `<p class="${handlingPct < 72 ? "warn" : "muted"}">Bike condition is affecting control. Current handling: ${handlingPct}%</p>` : ""}
      ${illegal ? `<p class="bad">Wanted cargo: police interception risk is active.</p>` : ""}
      ${state.message ? `<p class="warn">${state.message}</p>` : ""}
      ${run && run.routePlan ? `<p class="muted">Route pressure active: Gang x${run.routePlan.gangPressure.toFixed(2)}, Patrol x${run.routePlan.patrolPressure.toFixed(2)}${c.trait.key === "illegal" ? `, Police x${run.routePlan.policePressure.toFixed(2)}` : ""}</p>` : ""}
      <div class="control-row">
        <button data-audio-toggle="1">${state.audioEnabled ? "Mute Audio" : "Enable Audio"}</button>
      </div>
    `;
  } else {
    panel.innerHTML = `
      <h2>Run Complete</h2>
      <p>${state.message}</p>
      <button id="backToBoard">Back to Contract Board</button>
    `;
  }

  state.panelDirty = false;
}

function drawBackdrop(run) {
  const backdropScroll = run.sideScrollActive ? run.scrollX * 0.35 : 0;
  const wetBoost = run.weather.rain * 0.3;
  const road = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  road.addColorStop(0, "#101724");
  road.addColorStop(0.5, wetBoost > 0.1 ? "#1f2d40" : "#1a2433");
  road.addColorStop(1, "#121d2c");
  ctx.fillStyle = road;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 13; i += 1) {
    const bx = 40 + i * 78 - (backdropScroll % 78);
    const bw = 44 + (i % 4) * 8;
    const bh = 120 + (i % 5) * 35;
    const by = 5 + ((i * 17) % 28);
    ctx.fillStyle = "#0a1320";
    ctx.fillRect(bx, by, bw, bh);
    for (let w = 0; w < 3; w += 1) {
      ctx.fillStyle = `rgba(92, 155, 220, ${0.06 + (w % 2) * 0.04})`;
      ctx.fillRect(bx + 8 + w * 10, by + 14, 5, bh - 26);
    }
  }

  const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  g.addColorStop(0, "rgba(8, 20, 35, 0.5)");
  g.addColorStop(1, `rgba(21, 43, 78, ${0.24 + run.weather.rain * 0.2})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 9; i += 1) {
    const y = 48 + i * 58;
    ctx.fillStyle = i % 2 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.02)";
    ctx.fillRect(0, y, WIDTH, 26);
  }

  const laneOffset = (run.elapsed * 170 + backdropScroll * 0.9) % 54;
  for (let x = -80; x < WIDTH + 80; x += 54) {
    ctx.fillStyle = "rgba(228, 236, 252, 0.2)";
    ctx.fillRect(x + laneOffset, HEIGHT * 0.5 - 3, 24, 6);
    ctx.fillRect(x + laneOffset, HEIGHT * 0.26 - 2, 18, 4);
    ctx.fillRect(x + laneOffset, HEIGHT * 0.74 - 2, 18, 4);
  }

  if (run.weather.rain > 0.35) {
    ctx.fillStyle = `rgba(165, 193, 235, ${0.05 + run.weather.rain * 0.08})`;
    for (let i = 0; i < 7; i += 1) {
      const rx = (((run.elapsed * 60 + i * 130 + backdropScroll * 0.5) % (WIDTH + 120)) - 60);
      ctx.fillRect(rx, HEIGHT * 0.5 - 8, 90, 16);
      ctx.fillRect(rx * 0.8, HEIGHT * 0.26 - 6, 66, 12);
      ctx.fillRect(rx * 0.95, HEIGHT * 0.74 - 6, 66, 12);
    }
  }

  run.floodZones.forEach((f) => {
    const sx = f.x - run.scrollX;
    const ripple = 1 + Math.sin(run.elapsed * 3 + f.x * 0.01) * 0.06;
    ctx.beginPath();
    ctx.arc(sx, f.y, f.r * ripple, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(52, 98, 148, 0.55)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx, f.y, f.r * 0.65 * ripple, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(117, 174, 230, 0.22)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sx, f.y, f.r * 0.98 * ripple, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(173, 211, 247, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    for (let i = 0; i < 3; i += 1) {
      const a = run.elapsed * (1.1 + i * 0.22) + f.x * 0.002;
      const px = sx + Math.cos(a) * f.r * 0.35;
      const py = f.y + Math.sin(a * 1.3) * f.r * 0.2;
      ctx.fillStyle = "rgba(220, 239, 255, 0.16)";
      ctx.fillRect(px - 10, py - 1, 20, 2);
    }
  });

  const vignette = ctx.createRadialGradient(WIDTH * 0.5, HEIGHT * 0.5, 120, WIDTH * 0.5, HEIGHT * 0.5, WIDTH * 0.7);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, `rgba(0,0,0,${0.26 + (1 - run.weather.visibility) * 0.55})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawWeather(run, dt) {
  const weather = run.weather;

  if (weather.rain > 0.08) {
    ctx.strokeStyle = `rgba(170, 210, 255, ${0.12 + weather.rain * 0.22})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    for (const drop of weather.raindrops) {
      drop.x += drop.drift * dt;
      drop.y += drop.speed * dt;
      if (drop.y > HEIGHT + 10) {
        drop.y = -20;
        drop.x = rand(0, WIDTH);
      }
      if (drop.x < -10) drop.x = WIDTH + 10;
      const x2 = drop.x + drop.drift * 0.02;
      const y2 = drop.y - drop.len;
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }

  if (weather.fog > 0.06) {
    for (const bank of weather.fogBanks) {
      bank.x += bank.speed * dt;
      if (bank.x > WIDTH + bank.r) bank.x = -bank.r;
      const mist = ctx.createRadialGradient(bank.x, bank.y, bank.r * 0.2, bank.x, bank.y, bank.r);
      mist.addColorStop(0, `rgba(205, 219, 240, ${bank.alpha + weather.fog * 0.05})`);
      mist.addColorStop(1, "rgba(205, 219, 240, 0)");
      ctx.fillStyle = mist;
      ctx.fillRect(bank.x - bank.r, bank.y - bank.r, bank.r * 2, bank.r * 2);
    }
  }

  if (weather.fog > 0.3) {
    for (const cloud of weather.occluders) {
      cloud.x += cloud.speed * dt;
      if (cloud.x > WIDTH + cloud.r) {
        cloud.x = -cloud.r;
        cloud.y = rand(30, HEIGHT - 30);
      }
      const d = Math.hypot(run.player.x - cloud.x, run.player.y - cloud.y);
      const aroundPlayer = d < cloud.r * 0.85 ? 0.55 : 1;
      const smoke = ctx.createRadialGradient(cloud.x, cloud.y, cloud.r * 0.2, cloud.x, cloud.y, cloud.r);
      smoke.addColorStop(0, `rgba(214, 225, 242, ${(cloud.alpha + weather.fog * 0.2) * aroundPlayer})`);
      smoke.addColorStop(1, "rgba(214, 225, 242, 0)");
      ctx.fillStyle = smoke;
      ctx.fillRect(cloud.x - cloud.r, cloud.y - cloud.r, cloud.r * 2, cloud.r * 2);
    }
  }

  const haze = clamp((1 - weather.visibility) * 0.45 + weather.fog * 0.18, 0, 0.55);
  if (haze > 0.02) {
    ctx.fillStyle = `rgba(184, 202, 224, ${haze})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
}

function drawRouteGuidance(run, scrollX = 0) {
  if (!run.routePath || run.routePath.length < 2) return;

  const pulse = 0.6 + Math.sin(run.elapsed * 4) * 0.22;
  const revealTo = clamp(run.routeNodeIndex, 1, run.routePath.length - 1);
  ctx.beginPath();
  ctx.moveTo(run.routePath[0].x - scrollX, run.routePath[0].y);
  for (let i = 1; i <= revealTo; i += 1) {
    ctx.lineTo(run.routePath[i].x - scrollX, run.routePath[i].y);
  }
  ctx.strokeStyle = `rgba(56, 164, 255, ${0.22 + pulse * 0.2})`;
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  ctx.strokeStyle = `rgba(148, 228, 255, ${0.35 + pulse * 0.2})`;
  ctx.lineWidth = 3;
  ctx.stroke();

  if (run.routeNodeIndex < run.routePath.length) {
    const node = run.routePath[run.routeNodeIndex];
    ctx.beginPath();
    ctx.arc(node.x - scrollX, node.y, 9, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 207, 88, 0.9)";
    ctx.fill();
  }
}

function drawBeacon(destination, elapsed, scrollX = 0) {
  const sx = destination.x - scrollX;
  const glow = 22 + Math.sin(elapsed * 5) * 4;
  const radial = ctx.createRadialGradient(sx, destination.y, 3, sx, destination.y, glow);
  radial.addColorStop(0, "rgba(108, 255, 154, 1)");
  radial.addColorStop(1, "rgba(108, 255, 154, 0)");
  ctx.fillStyle = radial;
  ctx.fillRect(sx - glow, destination.y - glow, glow * 2, glow * 2);

  ctx.fillStyle = "#b9ffd0";
  ctx.fillRect(sx - 2, destination.y - 22, 4, 22);
  ctx.beginPath();
  ctx.arc(sx, destination.y - 24, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#6cff9a";
  ctx.fill();
}

function drawBikeOnContext(targetCtx, x, y, angle, bodyColor, glowColor, scale = 1, options = {}) {
  const wheelScale = options.wheelScale || 1;
  const wheelR = 4.8 * wheelScale;
  const rearX = -9.5;
  const frontX = 11.5;
  const axleY = 4.5;
  const isBicycle = options.isBicycle !== false;
  const wheelSpin = options.wheelSpin || 0;
  const elapsed = options.elapsed || 0;
  const trailIntensity = clamp(options.trailIntensity || 0, 0, 1);
  const flipX = Boolean(options.flipX);

  targetCtx.save();
  targetCtx.translate(x, y);
  targetCtx.rotate(angle);
  targetCtx.scale(scale * (flipX ? -1 : 1), scale);

  targetCtx.fillStyle = "rgba(0, 0, 0, 0.26)";
  targetCtx.fillRect(-16, 9 + (wheelScale - 1) * 1.8, 32, 4);

  if (trailIntensity > 0.04 && isBicycle) {
    const rearWheelX = flipX ? frontX : rearX;
    const dir = flipX ? 1 : -1;
    const rearTx = rearWheelX + dir * (wheelR - 0.35);
    const baseY = axleY - 0.5;
    const t = elapsed * 20;
    const trailSize = 1.6;

    if (options.exhaust_flames) {
      const thrust = 0.65 + trailIntensity * 1.4;
      const corePulse = 0.8 + Math.sin(t * 0.75) * 0.2;
      for (let i = 0; i < 8; i += 1) {
        const phase = t * 0.58 + i * 1.08;
        const flick = 0.65 + (Math.sin(phase) * 0.5 + 0.5) * 0.85;
        const len = (7 + i * 2.4) * trailSize * thrust * flick;
        const width = (0.95 + i * 0.2) * (0.8 + trailIntensity * 0.95);
        const yOff = (i - 3.5) * 1.18 + Math.sin(phase * 1.4) * 0.9;

        const flameGrad = targetCtx.createLinearGradient(rearTx, baseY + yOff, rearTx + dir * len, baseY + yOff);
        flameGrad.addColorStop(0, `rgba(255, 248, 194, ${0.88 * corePulse})`);
        flameGrad.addColorStop(0.23, "rgba(255, 184, 78, 0.9)");
        flameGrad.addColorStop(0.62, "rgba(255, 106, 36, 0.72)");
        flameGrad.addColorStop(1, "rgba(255, 64, 26, 0)");
        targetCtx.fillStyle = flameGrad;
        targetCtx.beginPath();
        targetCtx.moveTo(rearTx, baseY + yOff - width);
        targetCtx.lineTo(rearTx + dir * (len * 0.55), baseY + yOff - width * 0.75);
        targetCtx.lineTo(rearTx + dir * len, baseY + yOff);
        targetCtx.lineTo(rearTx + dir * (len * 0.55), baseY + yOff + width * 0.75);
        targetCtx.lineTo(rearTx, baseY + yOff + width);
        targetCtx.closePath();
        targetCtx.fill();

        // Hot inner core so the flame looks pressurized.
        const coreLen = len * (0.42 + Math.sin(phase * 1.1) * 0.05);
        targetCtx.strokeStyle = "rgba(255, 249, 220, 0.92)";
        targetCtx.lineWidth = 0.42 + width * 0.42;
        targetCtx.beginPath();
        targetCtx.moveTo(rearTx + dir * 0.8, baseY + yOff);
        targetCtx.lineTo(rearTx + dir * coreLen, baseY + yOff + Math.sin(phase * 1.8) * 0.25);
        targetCtx.stroke();
      }

      // Small embers to add speed and motion clarity.
      for (let e = 0; e < 6; e += 1) {
        const emberPhase = t * 0.5 + e * 2.2;
        const ex = rearTx + dir * (10 + e * 4.4) * thrust;
        const ey = baseY + Math.sin(emberPhase) * (3 + e * 0.24);
        const er = 0.55 + (6 - e) * 0.18;
        targetCtx.beginPath();
        targetCtx.arc(ex, ey, er, 0, Math.PI * 2);
        targetCtx.fillStyle = `rgba(255, ${160 + e * 10}, 84, ${0.42 - e * 0.05})`;
        targetCtx.fill();
      }
    }

    if (options.smoke_plume) {
      for (let i = 0; i < 9; i += 1) {
        const px = rearTx + dir * (i * 3.4 + ((t * 0.8 + i) % 2.2));
        const py = baseY - 1.2 - i * 0.62 + Math.sin(t * 0.25 + i) * 0.95;
        const r = (1.35 + i * 0.48) * (0.5 + trailIntensity * 0.95);
        targetCtx.beginPath();
        targetCtx.arc(px, py, r, 0, Math.PI * 2);
        targetCtx.fillStyle = `rgba(188, 201, 219, ${0.08 + (9 - i) * 0.045})`;
        targetCtx.fill();
      }
    }

    if (options.spark_shower) {
      targetCtx.strokeStyle = "rgba(255, 219, 125, 0.86)";
      targetCtx.lineWidth = 1.2;
      for (let i = 0; i < 18; i += 1) {
        const phase = t * 0.42 + i * 1.7;
        const sx = rearTx + dir * (i * 1.8 + (phase % 3.2)) * trailIntensity * 1.8;
        const sy = baseY + Math.sin(phase) * 3.1;
        targetCtx.beginPath();
        targetCtx.moveTo(sx, sy);
        targetCtx.lineTo(sx + dir * 3.5, sy + Math.sin(phase * 0.7) * 1.9);
        targetCtx.stroke();
      }
    }

    if (options.cash_trail) {
      for (let i = 0; i < 8; i += 1) {
        const phase = elapsed * 2.6 + i * 0.8;
        const cx = rearTx + dir * (7 + i * 4.5) * trailIntensity * 1.35;
        const cy = baseY - 6 + Math.sin(phase * 2.7) * 5.8;
        targetCtx.save();
        targetCtx.translate(cx, cy);
        targetCtx.rotate(Math.sin(phase) * 0.58);
        targetCtx.fillStyle = "rgba(149, 255, 171, 0.82)";
        targetCtx.fillRect(-2.4, -1.5, 4.8, 3);
        targetCtx.fillStyle = "rgba(37, 122, 56, 0.8)";
        targetCtx.fillRect(-0.6, -0.6, 1.2, 1.2);
        targetCtx.restore();
      }
    }

    if (options.star_burst) {
      for (let i = 0; i < 11; i += 1) {
        const phase = t * 0.5 + i * 1.9;
        const sx = rearTx + dir * (4 + i * 3.3) * trailIntensity * 1.3;
        const sy = baseY - 2 + Math.cos(phase) * 3.8;
        const alpha = clamp(0.2 + (11 - i) * 0.065, 0.2, 0.95);
        const outer = 2.4 + Math.sin(phase * 1.3) * 0.5;
        const inner = outer * 0.45;
        targetCtx.save();
        targetCtx.translate(sx, sy);
        targetCtx.rotate(phase * 0.35);
        targetCtx.shadowBlur = 8;
        targetCtx.shadowColor = `rgba(140, 216, 255, ${alpha})`;
        targetCtx.fillStyle = `rgba(225, 246, 255, ${alpha})`;
        targetCtx.beginPath();
        for (let p = 0; p < 10; p += 1) {
          const a = -Math.PI * 0.5 + p * (Math.PI / 5);
          const r = p % 2 === 0 ? outer : inner;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (p === 0) targetCtx.moveTo(px, py);
          else targetCtx.lineTo(px, py);
        }
        targetCtx.closePath();
        targetCtx.fill();

        targetCtx.shadowBlur = 0;
        targetCtx.strokeStyle = `rgba(121, 196, 235, ${alpha * 0.8})`;
        targetCtx.lineWidth = 0.7;
        targetCtx.stroke();
        targetCtx.restore();
      }
    }
  }

  // Wheels + rotating spokes.
  targetCtx.strokeStyle = "#7c8ea8";
  targetCtx.lineWidth = 1.2;
  for (const cx of [rearX, frontX]) {
    targetCtx.beginPath();
    targetCtx.arc(cx, axleY, wheelR, 0, Math.PI * 2);
    targetCtx.stroke();

    targetCtx.beginPath();
    targetCtx.arc(cx, axleY, wheelR - 1.2, 0, Math.PI * 2);
    targetCtx.strokeStyle = "#101827";
    targetCtx.lineWidth = 1.8;
    targetCtx.stroke();

    targetCtx.save();
    targetCtx.translate(cx, axleY);
    targetCtx.rotate(wheelSpin);
    targetCtx.strokeStyle = "rgba(198, 214, 235, 0.85)";
    targetCtx.lineWidth = 0.85;
    for (let i = 0; i < 10; i += 1) {
      const a = (Math.PI * 2 * i) / 10;
      targetCtx.beginPath();
      targetCtx.moveTo(Math.cos(a) * 1.2, Math.sin(a) * 1.2);
      targetCtx.lineTo(Math.cos(a) * (wheelR - 1.5), Math.sin(a) * (wheelR - 1.5));
      targetCtx.stroke();
    }
    targetCtx.restore();
  }

  targetCtx.beginPath();
  targetCtx.arc(rearX, axleY, 1.9, 0, Math.PI * 2);
  targetCtx.arc(frontX, axleY, 1.9, 0, Math.PI * 2);
  targetCtx.fillStyle = "#6f829b";
  targetCtx.fill();

  if (isBicycle) {
    // Bicycle frame.
    targetCtx.strokeStyle = bodyColor;
    targetCtx.lineWidth = 2.25;
    targetCtx.lineCap = "round";
    targetCtx.lineJoin = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(rearX, axleY);
    targetCtx.lineTo(-1.2, -1.8);
    targetCtx.lineTo(4.8, axleY);
    targetCtx.lineTo(rearX, axleY);
    targetCtx.moveTo(-1.2, -1.8);
    targetCtx.lineTo(frontX, axleY);
    targetCtx.moveTo(4.8, axleY);
    targetCtx.lineTo(7.4, -2.5);
    targetCtx.lineTo(10.2, -2.5);
    targetCtx.moveTo(-1.2, -1.8);
    targetCtx.lineTo(-2.7, -4.2);
    targetCtx.lineTo(-5.2, -4.2);
    targetCtx.stroke();

    // Subtle tube shading to keep frame clean and dimensional.
    targetCtx.strokeStyle = "rgba(8, 18, 28, 0.28)";
    targetCtx.lineWidth = 0.9;
    targetCtx.beginPath();
    targetCtx.moveTo(rearX + 0.4, axleY + 0.2);
    targetCtx.lineTo(-1.0, -1.6);
    targetCtx.lineTo(frontX - 0.2, axleY + 0.2);
    targetCtx.stroke();

    // Chainring/pedals.
    targetCtx.beginPath();
    targetCtx.arc(4.8, axleY, 1.6, 0, Math.PI * 2);
    targetCtx.strokeStyle = "#6b7f99";
    targetCtx.lineWidth = 1.1;
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.moveTo(4.8, axleY);
    targetCtx.lineTo(6.8, axleY + 0.9);
    targetCtx.moveTo(4.8, axleY);
    targetCtx.lineTo(3.1, axleY - 1.1);
    targetCtx.stroke();

    // Seat and bars for a clearer bicycle silhouette.
    targetCtx.strokeStyle = "#263448";
    targetCtx.lineWidth = 1.4;
    targetCtx.beginPath();
    targetCtx.moveTo(-5.2, -4.2);
    targetCtx.lineTo(-6.6, -4.35);
    targetCtx.moveTo(10.2, -2.5);
    targetCtx.lineTo(11.3, -3.6);
    targetCtx.lineTo(12.4, -3.2);
    targetCtx.stroke();
  } else {
    targetCtx.fillStyle = bodyColor;
    targetCtx.beginPath();
    targetCtx.moveTo(12, -0.2);
    targetCtx.lineTo(1.5, -4.5);
    targetCtx.lineTo(-3.5, -1.5);
    targetCtx.lineTo(3.5, 2.8);
    targetCtx.lineTo(11, 2.2);
    targetCtx.closePath();
    targetCtx.fill();
  }

  // Cosmetics.
  if (options.flames) {
    // Painted flame livery on top/down tube rather than floating decal.
    const topFlame = targetCtx.createLinearGradient(-0.6, -2.2, 8.6, -2.2);
    topFlame.addColorStop(0, "rgba(255, 246, 176, 0.92)");
    topFlame.addColorStop(0.45, "rgba(255, 174, 80, 0.95)");
    topFlame.addColorStop(1, "rgba(246, 87, 58, 0.92)");
    targetCtx.strokeStyle = topFlame;
    targetCtx.lineWidth = 1.15;
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(-1.0, -1.95);
    targetCtx.lineTo(1.2, -2.55);
    targetCtx.lineTo(3.0, -1.75);
    targetCtx.lineTo(5.1, -2.45);
    targetCtx.lineTo(7.6, -1.82);
    targetCtx.stroke();

    const downFlame = targetCtx.createLinearGradient(-0.8, 0.9, 4.8, 3.8);
    downFlame.addColorStop(0, "rgba(255, 232, 160, 0.82)");
    downFlame.addColorStop(0.55, "rgba(255, 161, 76, 0.86)");
    downFlame.addColorStop(1, "rgba(244, 79, 51, 0.82)");
    targetCtx.strokeStyle = downFlame;
    targetCtx.lineWidth = 1.05;
    targetCtx.beginPath();
    targetCtx.moveTo(-0.7, -1.0);
    targetCtx.lineTo(1.0, 0.05);
    targetCtx.lineTo(2.8, 1.4);
    targetCtx.lineTo(4.55, 3.45);
    targetCtx.stroke();

    targetCtx.strokeStyle = "rgba(255, 245, 204, 0.52)";
    targetCtx.lineWidth = 0.45;
    targetCtx.beginPath();
    targetCtx.moveTo(0.3, -2.35);
    targetCtx.lineTo(2.3, -2.08);
    targetCtx.lineTo(4.2, -2.2);
    targetCtx.lineTo(6.0, -1.98);
    targetCtx.stroke();
  }

  if (options.streamers) {
    const s1 = Math.sin(elapsed * 9.2 + 0.8) * 1.2;
    const s2 = Math.sin(elapsed * 8.4 + 2.1) * 1.2;
    targetCtx.strokeStyle = "#ff6ec8";
    targetCtx.lineWidth = 1.4;
    targetCtx.beginPath();
    targetCtx.moveTo(10.2, -2.5);
    targetCtx.bezierCurveTo(12.4, -2.1 + s1 * 0.2, 14.5, -0.8 + s1, 16.1, 1.5 + s1 * 0.5);
    targetCtx.moveTo(10.2, -2.5);
    targetCtx.bezierCurveTo(12.1, -3.6 + s2 * 0.2, 14.3, -4.8 + s2, 15.5, -6.4 + s2 * 0.5);
    targetCtx.stroke();

    targetCtx.strokeStyle = "#7dd9ff";
    targetCtx.lineWidth = 1;
    targetCtx.beginPath();
    targetCtx.moveTo(10.1, -2.1);
    targetCtx.bezierCurveTo(12.4, -1.7 + s2 * 0.2, 14.1, -0.4 + s2 * 0.7, 15.6, 1.2 + s2 * 0.4);
    targetCtx.stroke();
  }

  if (options.basket) {
    targetCtx.fillStyle = "rgba(171, 141, 95, 0.35)";
    targetCtx.fillRect(11.5, -5.2, 4.2, 3.3);
    targetCtx.strokeStyle = "#c4ac7a";
    targetCtx.lineWidth = 0.9;
    targetCtx.strokeRect(11.5, -5.2, 4.2, 3.3);
    targetCtx.strokeStyle = "rgba(225, 207, 168, 0.55)";
    targetCtx.lineWidth = 0.55;
    for (let i = 1; i < 4; i += 1) {
      targetCtx.beginPath();
      targetCtx.moveTo(11.5 + i, -5.1);
      targetCtx.lineTo(11.5 + i, -1.95);
      targetCtx.stroke();
    }
    for (let j = 1; j < 3; j += 1) {
      targetCtx.beginPath();
      targetCtx.moveTo(11.6, -5.2 + j * 1.1);
      targetCtx.lineTo(15.6, -5.2 + j * 1.1);
      targetCtx.stroke();
    }
  }

  if (options.neon_frame) {
    targetCtx.strokeStyle = "rgba(172, 255, 241, 0.55)";
    targetCtx.lineWidth = 0.9;
    targetCtx.beginPath();
    targetCtx.moveTo(rearX + 0.3, axleY - 0.2);
    targetCtx.lineTo(-1.2, -1.8);
    targetCtx.lineTo(frontX - 0.3, axleY - 0.2);
    targetCtx.stroke();
  }

  // Rider.
  if (!options.hideRider) {
    // Actual rider silhouette with posture on the bike.
    const pedal = Math.sin(wheelSpin) * 0.5;

    // Back leg.
    targetCtx.strokeStyle = "#1f2a3a";
    targetCtx.lineWidth = 1.2;
    targetCtx.lineCap = "round";
    targetCtx.beginPath();
    targetCtx.moveTo(2.0, -3.0);
    targetCtx.lineTo(3.9, 0.2 + pedal);
    targetCtx.lineTo(5.2, 3.5);
    targetCtx.stroke();

    // Front leg.
    targetCtx.beginPath();
    targetCtx.moveTo(1.8, -3.0);
    targetCtx.lineTo(3.1, 0.4 - pedal);
    targetCtx.lineTo(4.5, 3.5);
    targetCtx.stroke();

    // Torso and jersey.
    targetCtx.fillStyle = "#26364c";
    targetCtx.beginPath();
    targetCtx.moveTo(0.6, -8.3);
    targetCtx.lineTo(3.2, -7.8);
    targetCtx.lineTo(4.4, -4.6);
    targetCtx.lineTo(1.6, -3.0);
    targetCtx.lineTo(-0.6, -4.7);
    targetCtx.closePath();
    targetCtx.fill();

    // Arms toward handlebar.
    targetCtx.strokeStyle = "#213247";
    targetCtx.lineWidth = 1.1;
    targetCtx.beginPath();
    targetCtx.moveTo(2.8, -7.4);
    targetCtx.lineTo(6.3, -5.8);
    targetCtx.lineTo(9.6, -3.4);
    targetCtx.stroke();
    targetCtx.beginPath();
    targetCtx.moveTo(1.4, -7.6);
    targetCtx.lineTo(5.8, -6.2);
    targetCtx.lineTo(9.0, -3.8);
    targetCtx.stroke();

    // Head + helmet.
    targetCtx.beginPath();
    targetCtx.arc(0.6, -9.4, 1.55, 0, Math.PI * 2);
    targetCtx.fillStyle = "#e5bb98";
    targetCtx.fill();
    targetCtx.beginPath();
    targetCtx.arc(0.35, -9.7, 1.85, Math.PI, Math.PI * 2);
    targetCtx.fillStyle = "#f2f6ff";
    targetCtx.fill();
    targetCtx.fillStyle = "rgba(70, 95, 128, 0.7)";
    targetCtx.fillRect(-1.0, -9.3, 2.3, 0.7);
  }

  // Lights.
  targetCtx.fillStyle = glowColor;
  targetCtx.fillRect(11.6, -0.8, 3.6, 2.9);
  targetCtx.fillStyle = "rgba(255, 92, 98, 0.9)";
  targetCtx.fillRect(-11.6, -0.8, 2.3, 2.6);
  targetCtx.restore();
}

function drawBike(x, y, angle, bodyColor, glowColor, scale = 1, options = {}) {
  drawBikeOnContext(ctx, x, y, angle, bodyColor, glowColor, scale, options);
}

function drawTrafficCar(car) {
  ctx.save();
  ctx.translate(car.x, car.y);
  if (car.dir < 0) ctx.scale(-1, 1);

  const w = car.w;
  const h = car.h;

  // Shadow.
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.roundRect(-w * 0.52, -h * 0.34, w * 1.04, h * 0.78, 4);
  ctx.fill();

  // Main body shell.
  ctx.fillStyle = car.color;
  ctx.beginPath();
  ctx.roundRect(-w * 0.5, -h * 0.5, w, h, 5);
  ctx.fill();

  // Hood and trunk panels.
  ctx.fillStyle = "rgba(255,255,255,0.13)";
  ctx.beginPath();
  ctx.roundRect(-w * 0.44, -h * 0.42, w * 0.3, h * 0.84, 3);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.beginPath();
  ctx.roundRect(w * 0.16, -h * 0.42, w * 0.28, h * 0.84, 3);
  ctx.fill();

  // Cabin glass.
  ctx.fillStyle = "#c4dcf9";
  ctx.beginPath();
  ctx.roundRect(-w * 0.07, -h * 0.36, w * 0.28, h * 0.72, 3);
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 86, 120, 0.45)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Door seam.
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.beginPath();
  ctx.moveTo(-w * 0.14, -h * 0.45);
  ctx.lineTo(-w * 0.14, h * 0.45);
  ctx.stroke();

  // Wheel wells + tires.
  ctx.fillStyle = "#151e2a";
  ctx.beginPath();
  ctx.roundRect(-w * 0.38, -h * 0.6, w * 0.18, h * 0.24, 2);
  ctx.roundRect(-w * 0.38, h * 0.36, w * 0.18, h * 0.24, 2);
  ctx.roundRect(w * 0.2, -h * 0.6, w * 0.18, h * 0.24, 2);
  ctx.roundRect(w * 0.2, h * 0.36, w * 0.18, h * 0.24, 2);
  ctx.fill();

  // Headlights + taillights.
  ctx.fillStyle = "#ffe8b5";
  ctx.fillRect(w * 0.48, -h * 0.28, 4, 3);
  ctx.fillRect(w * 0.48, h * 0.05, 4, 3);
  ctx.fillStyle = "#ff8d8d";
  ctx.fillRect(-w * 0.52, -h * 0.28, 3, 3);
  ctx.fillRect(-w * 0.52, h * 0.05, 3, 3);

  ctx.restore();
}

function drawStickPerson(member, elapsed) {
  const walk = Math.sin(elapsed * 8.4 + member.phase);
  const counter = Math.sin(elapsed * 8.4 + member.phase + Math.PI);
  const bob = Math.sin(elapsed * 8.4 + member.phase) * 1.5;
  const step = walk * 2.6;
  const armSwing = walk * 2.2;
  const torsoLean = walk * 0.08;

  ctx.save();
  ctx.translate(member.ox, member.oy + bob);
  ctx.rotate(torsoLean);

  ctx.beginPath();
  ctx.arc(0, -8.5, 2.7, 0, Math.PI * 2);
  ctx.fillStyle = "#f2c7a3";
  ctx.fill();

  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 1.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(0, 2.8);
  ctx.stroke();

  ctx.strokeStyle = member.tint;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  if (member.pose === "arms_crossed") {
    ctx.moveTo(-4.8, -2.3 + armSwing * 0.15); ctx.lineTo(2.9, -0.9 + armSwing * 0.2);
    ctx.moveTo(4.8, -2.3 - armSwing * 0.15); ctx.lineTo(-2.9, -0.9 - armSwing * 0.2);
  } else if (member.pose === "hands_hips") {
    ctx.moveTo(-4.1, -2.2 + armSwing * 0.35); ctx.lineTo(-1.8, 0.8 + armSwing * 0.2);
    ctx.moveTo(4.1, -2.2 - armSwing * 0.35); ctx.lineTo(1.8, 0.8 - armSwing * 0.2);
  } else if (member.pose === "pointing") {
    ctx.moveTo(-4.8, -1.8 + armSwing * 0.15); ctx.lineTo(3.8, -3.6 + armSwing * 0.1);
    ctx.moveTo(4.4, -1.2 - armSwing * 0.5); ctx.lineTo(1.5, -0.5 - armSwing * 0.28);
  } else if (member.pose === "lean_back") {
    ctx.moveTo(-4.5, -2.5 + armSwing * 0.45); ctx.lineTo(-0.4, -0.8 + armSwing * 0.2);
    ctx.moveTo(4.2, -2.3 - armSwing * 0.45); ctx.lineTo(1.2, -1.1 - armSwing * 0.2);
  } else {
    ctx.moveTo(-4.5, -2.3 + armSwing * 0.35); ctx.lineTo(2.2, -1.0 + armSwing * 0.1);
    ctx.moveTo(3.8, -2.3 - armSwing * 0.35); ctx.lineTo(2.4, 0.2 - armSwing * 0.18);
  }
  ctx.stroke();

  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, 2.8);
  ctx.lineTo(-2.9, 8.7 + step);
  ctx.moveTo(0, 2.8);
  ctx.lineTo(2.9, 8.7 + counter * 2.6);
  ctx.stroke();

  ctx.restore();
}

function drawParkedBike(offsetX, offsetY, elapsed) {
  const wobble = Math.sin(elapsed * 2.6) * 0.3;
  ctx.save();
  ctx.translate(offsetX, offsetY + wobble);
  ctx.rotate(-0.14);

  ctx.strokeStyle = "#1a2331";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(-5, 4, 3.2, 0, Math.PI * 2);
  ctx.arc(7, 4, 3.2, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#5f89b6";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(-3.8, 3.2);
  ctx.lineTo(1.4, -1.5);
  ctx.lineTo(5.8, 3.3);
  ctx.lineTo(-0.9, 3.4);
  ctx.lineTo(-3.8, 3.2);
  ctx.stroke();

  ctx.restore();
}

function drawGangFigure(gang, elapsed) {
  const dir = Math.atan2(gang.vy || 0.01, gang.vx || 1);
  const gangBob = Math.sin(elapsed * 2.4 + gang.phase) * 0.9;

  ctx.save();
  ctx.translate(gang.x, gang.y + gangBob);
  ctx.rotate(dir * 0.12);

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(0, 9, 13.5, 4.3, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const member of gang.members) {
    drawStickPerson(member, elapsed);
  }

  if (gang.hasBike) {
    drawParkedBike(-11, 5.5, elapsed + gang.phase);
  }

  ctx.restore();
}

function drawPolice(run, dt) {
  if (run.elapsed < run.chaseStart || run.police.length === 0) return;

  const p = run.player;
  run.nextSiren -= dt;
  if (run.nextSiren <= 0) {
    run.nextSiren = 1.5;
    playSfx("police");
    playPoliceSirenSample();
  }

  run.police.forEach((unit, idx) => {
    const accel = 200 + state.cityHeat * 9 + idx * 10;
    const maxSpeed = 200 + state.cityHeat * 8 + idx * 12;

    const targetX = p.x + run.scrollX;
    const dx = targetX - unit.x;
    const dy = p.y - unit.y;
    const len = Math.hypot(dx, dy) || 1;
    unit.vx += (dx / len) * accel * dt;
    unit.vy += (dy / len) * accel * dt;

    unit.vx *= 0.96;
    unit.vy *= 0.96;

    const speed = Math.hypot(unit.vx, unit.vy);
    if (speed > maxSpeed) {
      unit.vx = (unit.vx / speed) * maxSpeed;
      unit.vy = (unit.vy / speed) * maxSpeed;
    }

    unit.x = clamp(unit.x + unit.vx * dt, 10, run.worldWidth - 10);
    unit.y = clamp(unit.y + unit.vy * dt, 10, HEIGHT - 10);

    const blink = Math.sin(run.elapsed * 12 + idx * 2) > 0 ? "#70a8ff" : "#ff6363";
    const drawX = unit.x - run.scrollX;
    drawBike(drawX, unit.y, Math.atan2(unit.vy || 0.01, unit.vx || 1), "#3f4c66", blink, 1.05, { isBicycle: false });
    ctx.fillStyle = blink;
    ctx.fillRect(drawX - 5, unit.y - 9, 10, 2);

    if (Math.hypot(p.x - drawX, p.y - unit.y) < p.radius + unit.radius) {
      applyDamage(22, "police");
      run.time -= 0.35;
      p.vx *= -0.55;
      p.vy *= -0.55;
    }
  });
}

function drawRun(dt) {
  const run = state.run;
  if (!run) return;

  run.elapsed += dt;
  run.player.hitCooldown = Math.max(0, run.player.hitCooldown - dt);
  run.hitFlash = Math.max(0, run.hitFlash - dt);
  run.trafficSpawnGrace = Math.max(0, run.trafficSpawnGrace - dt);

  const shakeX = state.shake > 0 ? rand(-state.shake, state.shake) : 0;
  const shakeY = state.shake > 0 ? rand(-state.shake, state.shake) : 0;
  ctx.save();
  ctx.translate(shakeX, shakeY);

  drawBackdrop(run);
  drawRouteGuidance(run, run.scrollX);
  if (run.objectiveMarkers.length) {
    for (let i = run.objectiveIndex; i < run.objectiveMarkers.length; i += 1) {
      const marker = run.objectiveMarkers[i];
      const mx = marker.x - run.scrollX;
      const pulse = 0.75 + Math.sin(run.elapsed * 5 + i) * 0.25;
      ctx.beginPath();
      ctx.arc(mx, marker.y, marker.r + pulse * 2, 0, Math.PI * 2);
      ctx.fillStyle = i === run.objectiveIndex ? "rgba(255, 210, 98, 0.5)" : "rgba(141, 186, 255, 0.28)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mx, marker.y, marker.r * 0.46, 0, Math.PI * 2);
      ctx.fillStyle = i === run.objectiveIndex ? "#ffd46e" : "#8dbafd";
      ctx.fill();
    }
  }

  run.traffic.forEach((car) => {
    car.x += car.dir * car.speed * dt;
    if (car.dir > 0 && car.x > run.worldWidth + car.w + 20) {
      car.x = -car.w - rand(30, 240);
      car.y += rand(-8, 8);
    } else if (car.dir < 0 && car.x < -car.w - 20) {
      car.x = run.worldWidth + car.w + rand(30, 240);
      car.y += rand(-8, 8);
    }
    car.y = clamp(car.y, 38, HEIGHT - 38);
    if (run.sideScrollActive) {
      const dx = car.x - run.scrollX;
      if (car.dir > 0 && dx > WIDTH + car.w + 20) {
        car.x = run.scrollX - car.w - rand(30, 240);
      } else if (car.dir < 0 && dx < -car.w - 20) {
        car.x = run.scrollX + WIDTH + car.w + rand(30, 240);
      }
    }
    drawTrafficCar({ ...car, x: car.x - run.scrollX });
  });

  run.patrols.forEach((patrol) => {
    patrol.progress += patrol.speed * dt;
    const x = patrol.horizontal ? patrol.x + Math.sin(patrol.progress * Math.PI * 2) * 180 : patrol.x;
    const y = patrol.horizontal ? patrol.y : patrol.y + Math.cos(patrol.progress * Math.PI * 2) * 170;
    patrol.renderX = x;
    patrol.renderY = y;
    const drawX = x - run.scrollX;
    const pulse = 0.28 + Math.sin(run.elapsed * 4 + patrol.renderX * 0.01) * 0.08;
    ctx.fillStyle = `rgba(255, 169, 48, ${pulse})`;
    ctx.fillRect(drawX, y, patrol.w, patrol.h);
    ctx.strokeStyle = "rgba(255, 200, 120, 0.58)";
    ctx.strokeRect(drawX, y, patrol.w, patrol.h);

    // Hazard striping for a more physical roadblock feel.
    ctx.save();
    ctx.beginPath();
    ctx.rect(drawX, y, patrol.w, patrol.h);
    ctx.clip();
    ctx.strokeStyle = "rgba(255, 220, 140, 0.35)";
    for (let s = -patrol.h; s < patrol.w + patrol.h; s += 14) {
      ctx.beginPath();
      ctx.moveTo(drawX + s, y + patrol.h);
      ctx.lineTo(drawX + s + patrol.h, y);
      ctx.stroke();
    }
    ctx.restore();
  });

  run.gangs.forEach((gang) => {
    gang.x += gang.vx * dt;
    gang.y += gang.vy * dt;
    if (gang.x < 120 || gang.x > run.worldWidth - 80) gang.vx *= -1;
    if (gang.y < 40 || gang.y > HEIGHT - 40) gang.vy *= -1;
    drawGangFigure({ ...gang, x: gang.x - run.scrollX }, run.elapsed);
  });

  const player = run.player;
  const inputX = (keys.has("ArrowRight") || keys.has("d") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("a") ? 1 : 0);
  const inputY = (keys.has("ArrowDown") || keys.has("s") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("w") ? 1 : 0);

  let floodSlow = 1;
  for (const zone of run.floodZones) {
    if (Math.hypot(player.x - (zone.x - run.scrollX), player.y - zone.y) < zone.r + player.radius) {
      floodSlow = Math.min(floodSlow, 0.65);
      break;
    }
  }

  const handlingDrag = clamp(player.drag + (1 - run.weather.traction) * 0.08, 0.89, 0.985);
  const damageHandling = clamp(run.integrity / Math.max(1, run.maxIntegrity || 100), 0.45, 1);
  const accelScale = 0.6 + damageHandling * 0.4;
  run.spinCooldown = Math.max(0, run.spinCooldown - dt);
  run.spinoutTimer = Math.max(0, run.spinoutTimer - dt);

  // Entering flood triggers a brief spinout.
  if (floodSlow < 1 && !run.inFloodLastFrame && run.spinCooldown <= 0) {
    run.spinoutTimer = 0.7;
    run.spinCooldown = 1.4;
    run.spinVisualVel = (Math.random() > 0.5 ? 1 : -1) * rand(14, 18);
    state.message = "Flooded lane spinout!";
    state.panelDirty = true;
  }
  run.inFloodLastFrame = floodSlow < 1;

  if (run.spinoutTimer > 0) {
    const spinDir = run.spinVisualVel >= 0 ? 1 : -1;
    const rotate = spinDir * dt * 5.8;
    const newVx = player.vx * Math.cos(rotate) - player.vy * Math.sin(rotate);
    const newVy = player.vx * Math.sin(rotate) + player.vy * Math.cos(rotate);
    player.vx = newVx + spinDir * 24 * dt;
    player.vy = newVy + Math.cos(run.elapsed * 26) * 22 * dt;
    player.vx *= 0.985;
    player.vy *= 0.985;
    run.spinVisualAngle += run.spinVisualVel * dt;
    run.spinVisualVel *= 0.985;
  } else {
    player.vx += inputX * player.accel * accelScale * dt;
    player.vy += inputY * player.accel * accelScale * dt;
    run.spinVisualVel *= Math.max(0, 1 - dt * 10);
    run.spinVisualAngle *= Math.max(0, 1 - dt * 8);
  }
  player.vx *= handlingDrag;
  player.vy *= handlingDrag;

  if (run.integrity < 45) {
    const wobble = Math.sin(run.elapsed * 18) * (1 - damageHandling) * 18;
    player.vx += wobble * dt;
  }

  const speed = Math.hypot(player.vx, player.vy);
  const cap = player.maxSpeed * floodSlow * clamp(1 - run.weather.rain * 0.06, 0.93, 1) * (0.68 + damageHandling * 0.32);
  if (speed > cap) {
    player.vx = (player.vx / speed) * cap;
    player.vy = (player.vy / speed) * cap;
  }

  if (speed > 8) {
    run.wheelSpin += speed * dt * 0.24;
  } else {
    run.wheelSpin *= Math.max(0, 1 - dt * 8.5);
  }

  player.x = clamp(player.x + player.vx * dt, 16, WIDTH - 16);
  player.y = clamp(player.y + player.vy * dt, 16, HEIGHT - 16);

  if (state.currentContract && state.currentContract.isBoss) {
    const activeNode = run.routePath[Math.min(run.routeNodeIndex, run.routePath.length - 1)];
    const activeNodeScreenX = activeNode ? activeNode.x - run.scrollX : 0;
    if (!run.sideScrollTriggered && activeNodeScreenX > WIDTH - 80) {
      run.sideScrollActive = true;
      run.sideScrollTriggered = true;
      state.message = "Boss route extending. Side-scroll mode engaged.";
      state.panelDirty = true;
    }
    if (run.sideScrollActive) {
      const throttle = clamp((player.x - WIDTH * 0.58) / (WIDTH * 0.32), 0, 1);
      const scrollVel = 42 + throttle * (92 + Math.max(0, player.vx) * 0.5);
      run.scrollX = clamp(run.scrollX + scrollVel * dt, 0, Math.max(0, run.worldWidth - WIDTH));
    }
  }

  run.time -= dt * (state.currentContract.trait.key === "perishable" ? 1.2 : 1);

  const finalNodeIndex = run.routePath.length - 1;
  if (run.bossEscapeActive) {
    drawBeacon(run.bossEscapePoint, run.elapsed, run.scrollX);
    run.bossEscapeTimer -= dt;
  } else if (run.routeNodeIndex >= finalNodeIndex) {
    drawBeacon(run.destination, run.elapsed, run.scrollX);
  }

  drawPolice(run, dt);

  const angle = Math.atan2(player.vy || 0.001, player.vx || 1) + run.spinVisualAngle;
  const bikeStyle = getPlayerBikeStyle();
  const trailIntensity = clamp(speed / Math.max(1, cap), 0, 1);
  drawBike(player.x, player.y, angle, bikeStyle.bodyColor, bikeStyle.glowColor, 1.08, {
    ...bikeStyle,
    flipX: true,
    wheelSpin: run.wheelSpin,
    elapsed: run.elapsed,
    trailIntensity
  });

  for (const gang of run.gangs) {
    if (Math.hypot(player.x - (gang.x - run.scrollX), player.y - gang.y) < player.radius + gang.radius) {
      applyDamage(18, "gang");
      player.vx *= -0.45;
      player.vy *= -0.45;
    }
  }

  for (const car of run.traffic) {
    const screenCar = { x: car.x - run.scrollX, y: car.y, w: car.w, h: car.h };
    if (run.trafficSpawnGrace <= 0 && collisionWithRectCircle(player, { x: screenCar.x - screenCar.w * 0.5, y: screenCar.y - screenCar.h * 0.5, w: screenCar.w, h: screenCar.h })) {
      applyDamage(15, "traffic");
      player.vx = car.dir * Math.max(90, Math.abs(player.vx) * 0.35);
      player.vy += rand(-70, 70);
      addShake(7);
    }
  }

  if (run.objectiveIndex < run.objectiveMarkers.length) {
    const marker = run.objectiveMarkers[run.objectiveIndex];
    if (Math.hypot(player.x - (marker.x - run.scrollX), player.y - marker.y) < player.radius + marker.r) {
      run.objectiveIndex += 1;
      state.message = marker.tag === "decoy"
        ? "Decoy cache collected. Grab the real payload cache."
        : marker.tag === "real"
          ? "Real payload cache secured."
          : "Pickup cache secured.";
      state.panelDirty = true;
    }
  }

  if (run.routePath && run.routeNodeIndex < run.routePath.length) {
    const activeNode = run.routePath[run.routeNodeIndex];
    if (Math.hypot(player.x - (activeNode.x - run.scrollX), player.y - activeNode.y) < 26) {
      if (run.routeNodeIndex >= run.routePath.length - 1) {
        if (state.currentContract && state.currentContract.isBoss && !run.bossEscapeActive && !run.sideScrollTriggered) {
          run.bossEscapeActive = true;
          state.message = "Boss convoy closing in. Reach the escape beacon!";
          state.panelDirty = true;
        } else {
          finishRun(true, "");
          return;
        }
      } else {
        run.routeNodeIndex += 1;
        if (state.currentContract && state.currentContract.isBoss && run.bossPhaseIndex < run.bossPhaseNodes.length && run.routeNodeIndex >= run.bossPhaseNodes[run.bossPhaseIndex]) {
          triggerBossAmbush(run);
          run.bossPhaseIndex += 1;
        }
        state.message = `Checkpoint ${run.routeNodeIndex}/${run.routePath.length - 1} reached`;
        state.panelDirty = true;
      }
    }
  }

  if (run.bossEscapeActive && distance(player, run.bossEscapePoint) < player.radius + run.bossEscapePoint.radius) {
    finishRun(true, "");
    return;
  }

  for (const patrol of run.patrols) {
    if (collisionWithRectCircle(player, { x: patrol.renderX - run.scrollX, y: patrol.renderY, w: patrol.w, h: patrol.h })) {
      applyDamage(13, "patrol");
      run.time -= 0.45;
    }
  }

  drawWeather(run, dt);

  if (run.hitFlash > 0) {
    ctx.fillStyle = `rgba(255, 70, 110, ${run.hitFlash * 0.9})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }

  ctx.restore();

  if (run.time <= 0) {
    finishRun(false, "Deadline missed.");
    return;
  }

  if (run.bossEscapeActive && run.bossEscapeTimer <= 0) {
    finishRun(false, "Boss escape window closed.");
    return;
  }

  if (run.integrity <= 0) {
    finishRun(false, "Package destroyed.");
  }
}

function drawIdle() {
  const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  g.addColorStop(0, "#091523");
  g.addColorStop(1, "#142742");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = "rgba(255,255,255,0.06)";
  for (let i = 0; i < 10; i += 1) {
    ctx.fillRect(70 + i * 90, 58 + (i % 2) * 150, 48, 180);
  }

  const bikeStyle = getPlayerBikeStyle();
  ctx.save();
  ctx.translate(WIDTH * 0.5, HEIGHT * 0.56);
  drawBikeOnContext(ctx, 0, 0, -0.05, bikeStyle.bodyColor, bikeStyle.glowColor, 6.3, { ...bikeStyle, hideRider: false, flipX: true });
  ctx.restore();

  ctx.fillStyle = "#9cc8ff";
  ctx.font = "24px Trebuchet MS";
  ctx.fillText("Bike Garage Ready", 390, 112);
  ctx.font = "16px Trebuchet MS";
  ctx.fillStyle = "#89aacd";
  ctx.fillText("Use the Customize Bike button in the panel to buy and equip parts.", 235, 142);
}

function frame(ts) {
  if (!frame.last) frame.last = ts;
  const dt = Math.min((ts - frame.last) / 1000, 0.033);
  frame.last = ts;

  state.shake = Math.max(0, state.shake - dt * 24);

  if (state.mode === "run") drawRun(dt);
  else drawIdle();

  updateMusic(dt);
  renderHud();
  if (state.panelDirty) renderPanel();
  requestAnimationFrame(frame);
}

panel.addEventListener("click", (e) => {
  ensureAudio();

  const target = e.target;
  if (!(target instanceof HTMLElement)) return;

  if (target.dataset.preview) {
    const contract = state.contracts.find((c) => c.id === target.dataset.preview);
    if (contract) {
      state.selectedContractId = contract.id;
      state.selectedPreview = generateRoutePreview(contract);
      state.selectedRoutePlan = computeRoutePlan(state.selectedPreview, contract);
      state.panelDirty = true;
    }
  }

  if (target.dataset.contract) startContract(target.dataset.contract);
  if (target.dataset.upgrade) buyUpgrade(target.dataset.upgrade);
  if (target.dataset.bikeBuy) buyBikeCosmetic(target.dataset.bikeBuy);
  if (target.dataset.bikeToggle) toggleBikeCosmetic(target.dataset.bikeToggle);

  if (target.dataset.openCustomize) {
    state.mode = "customize";
    state.panelDirty = true;
  }

  if (target.dataset.closeCustomize) {
    state.mode = "contracts";
    state.panelDirty = true;
  }

  if (target.dataset.waypointUndo) {
    if (state.selectedPreview && state.selectedPreview.waypoints.length) {
      state.selectedPreview.waypoints.pop();
      const contract = state.contracts.find((c) => c.id === state.selectedContractId);
      if (contract) state.selectedRoutePlan = computeRoutePlan(state.selectedPreview, contract);
      state.panelDirty = true;
    }
  }

  if (target.dataset.waypointClear) {
    if (state.selectedPreview && state.selectedPreview.waypoints.length) {
      state.selectedPreview.waypoints = [];
      const contract = state.contracts.find((c) => c.id === state.selectedContractId);
      if (contract) state.selectedRoutePlan = computeRoutePlan(state.selectedPreview, contract);
      state.panelDirty = true;
    }
  }

  if (target.dataset.audioToggle) {
    state.audioEnabled = !state.audioEnabled;
    state.panelDirty = true;
    if (state.audioEnabled) {
      ensureAudio();
    } else if (audio.sirenSample) {
      audio.sirenSample.pause();
      audio.sirenSample.currentTime = 0;
    }
    saveProgress();
  }

  if (target.dataset.heatBribe) {
    useHeatBribe();
  }

  if (target.dataset.heatCooldown) {
    runCooldownOperation();
  }

  if (target.id === "backToBoard") {
    state.mode = "contracts";
    state.run = null;
    state.currentContract = null;
    state.message = "";

    const first = state.contracts[0] || null;
    state.selectedContractId = first ? first.id : null;
    state.selectedPreview = first ? generateRoutePreview(first) : null;
    state.selectedRoutePlan = first && state.selectedPreview ? computeRoutePlan(state.selectedPreview, first) : null;
    state.panelDirty = true;
  }
});

window.addEventListener("keydown", (e) => {
  ensureAudio();

  const k = e.key.toLowerCase();
  keys.add(k);
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
});

loadProgress();
resetUpgradeProgressOnce();
generateContracts();
requestAnimationFrame(frame);
