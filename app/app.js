// Leonida Trophy Guide — tracker logic (no libraries, no network at run time).
// Loads app/data/trophies.json, renders the checklist, and keeps progress in localStorage.

const STORE_KEY = 'leonida-trophy-guide-progress-v1';
const SETTINGS_KEY = 'leonida-trophy-guide-settings-v1';
const DATA_URL = 'data/trophies.json';

const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

// The road to the platinum, built from the official descriptions: which story chapters
// and missions come first, which collectibles and counts follow, and what to mop up last.
const ROADMAP = [
  {
    title: 'Play the story',
    text: 'Chapters 1 to 5 and the named story missions carry 12 trophies between them. There is no mission replay, so keep a save at the start of each chapter.',
    trophies: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    title: 'Meet Leonida’s people',
    text: 'Finish the last missions for Andy, Kenton, Billy, Randy and Tyrone, and complete 8 stranger mission strands across the state.',
    trophies: [22, 23, 24, 26, 27, 25],
  },
  {
    title: 'Try everything once',
    text: 'Sample all 9 activity types, then work through the ranges, the stunts and the races — the biggest counters in the game.',
    trophies: [16, 17, 15, 18, 19],
  },
  {
    title: 'Collect the state',
    text: 'Meditation spots, card sets, WAiNK spots, vehicles, every area of Leonida and every garage property. Do the meditation spots as you find them — they are the one set the guides flag as potentially missable.',
    trophies: [28, 30, 31, 35, 42, 54],
  },
  {
    title: 'Money and mayhem',
    text: 'Launder marked bills, spend big in the shops, and work the robberies: shops with your partner, the jewelry store, bank vaults, armored trucks and one illegal operation per gang.',
    trophies: [52, 53, 34, 39, 40, 41, 43],
  },
  {
    title: 'Odd jobs and loose ends',
    text: 'Fishing with Cal, the arcade, hunting for Bret, the challenge list, and the one-off moments — a cocktail on Ocean Beach, the bowling alley, the showroom, and the strange things Leonida throws at you.',
    trophies: [20, 21, 29, 32, 44, 45, 46, 47, 48, 49, 50, 51, 55],
  },
  {
    title: 'The platinum',
    text: 'Attain 100% Completion for the gold, then the platinum pops on its own once the other 54 are earned.',
    trophies: [14, 1],
  },
];

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const searchEl = $('search');
const gradeEl = $('gradeFilter');
const earnedEl = $('earnedFilter');
const spoilerEl = $('spoiler');
const noteEl = $('filterNote');

let allTrophies = [];
let byId = new Map();
let earned = new Set();
let activeKind = 'all';

function loadStored() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]');
    if (Array.isArray(saved)) earned = new Set(saved.filter((n) => typeof n === 'string'));
  } catch { earned = new Set(); }
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    if (settings.spoiler === true) spoilerEl.checked = true;
  } catch { /* keep the default: spoilers shown */ }
}

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort()));
}

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ spoiler: spoilerEl.checked }));
}

function gradePill(grade) {
  const pill = document.createElement('span');
  pill.className = `grade-pill grade-${grade}`;
  pill.textContent = GRADE_LABEL[grade] ?? grade;
  return pill;
}

function kindTag(trophy) {
  const tag = document.createElement('span');
  tag.className = 'tag';
  tag.textContent = trophy.kind === 'completion' ? 'Completion' : trophy.kind[0].toUpperCase() + trophy.kind.slice(1);
  return tag;
}

function missableTag() {
  const tag = document.createElement('span');
  tag.className = 'tag missable-tag';
  tag.textContent = 'Missable';
  return tag;
}

function sourceList(trophy) {
  const list = document.createElement('ul');
  list.className = 'sources';
  for (const source of trophy.sources ?? []) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    list.append(item);
  }
  return list;
}

function guideBlock(trophy) {
  const details = document.createElement('details');
  details.className = 'guide';
  const summary = document.createElement('summary');
  summary.textContent = 'How to earn it';
  const body = document.createElement('div');
  body.className = 'guide-body';
  for (const paragraph of trophy.guide.split('\n\n')) {
    const p = document.createElement('p');
    p.textContent = paragraph;
    body.append(p);
  }
  body.append(sourceList(trophy));
  details.append(summary, body);
  return details;
}

function spoilerMask(trophy) {
  const mask = document.createElement('p');
  mask.className = 'spoiler-mask';
  mask.textContent = 'Story trophy — its name, description and guide stay hidden until you earn it. Tick the box when it pops and the card opens up.';
  return mask;
}

function trophyCard(trophy) {
  const isEarned = earned.has(trophy.name);
  const hiddenBySpoiler = spoilerEl.checked && trophy.kind === 'story' && !isEarned;

  const card = document.createElement('article');
  card.className = 'card' + (isEarned ? ' earned' : '');
  card.id = `t-${trophy.id}`;

  const tick = document.createElement('label');
  tick.className = 'tick';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = isEarned;
  box.setAttribute('aria-label', hiddenBySpoiler ? 'Mark story trophy as earned' : `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveProgress();
    renderAll();
  });
  tick.append(box);

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const name = document.createElement('h3');
  name.className = 'trophy-name';
  name.textContent = hiddenBySpoiler ? 'Hidden story trophy' : trophy.name;
  head.append(name, gradePill(trophy.grade), kindTag(trophy));
  if (trophy.missable) head.append(missableTag());

  card.append(tick, head);
  if (hiddenBySpoiler) {
    card.append(spoilerMask(trophy));
  } else {
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = trophy.description;
    card.append(official, guideBlock(trophy));
  }
  return card;
}

function trophyMatches(trophy) {
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (earnedEl.value === 'earned' && !earned.has(trophy.name)) return false;
  if (earnedEl.value === 'todo' && earned.has(trophy.name)) return false;
  if (activeKind === 'missable' && !trophy.missable) return false;
  if (activeKind === 'online' && trophy.kind !== 'online') return false;
  if (activeKind !== 'all' && activeKind !== 'missable' && activeKind !== 'online' && trophy.kind !== activeKind) return false;
  const query = searchEl.value.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide} ${trophy.kind}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function renderProgress() {
  const total = allTrophies.length;
  const done = allTrophies.filter((t) => earned.has(t.name)).length;
  $('progressText').textContent = `${done} of ${total} earned`;
  $('progressPct').textContent = total ? `${Math.round((done / total) * 100)}%` : '0%';
  $('progressBar').style.width = total ? `${(done / total) * 100}%` : '0%';
  $('gradeCounts').textContent = GRADE_ORDER.map((g) => {
    const inGrade = allTrophies.filter((t) => t.grade === g);
    const doneInGrade = inGrade.filter((t) => earned.has(t.name)).length;
    return `${GRADE_LABEL[g]} ${doneInGrade}/${inGrade.length}`;
  }).join(' · ');
}

function renderRoadmap() {
  const stages = $('roadmapStages');
  stages.replaceChildren();
  for (const stage of ROADMAP) {
    const item = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = stage.title;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const links = document.createElement('div');
    links.className = 'stage-links';
    for (const id of stage.trophies) {
      const trophy = byId.get(id);
      if (!trophy) continue;
      const link = document.createElement('a');
      link.href = `#t-${id}`;
      link.textContent = trophy.name;
      links.append(link);
    }
    item.append(heading, text, links);
    stages.append(item);
  }
}

function renderMissable() {
  const flagged = allTrophies.filter((t) => t.missable);
  $('missableText').textContent = flagged.length
    ? 'The guides agree on this: almost everything in Leonida can be finished after the story in free-roam. These are the exceptions the guides flag — deal with them as you go, and keep a save at the start of each chapter, because there is no mission replay.'
    : 'The guides flag no trophy as missable: everything can be finished after the story in free-roam. There is no mission replay, so keep a save at the start of each chapter anyway.';
  const list = $('missableList');
  list.replaceChildren();
  for (const trophy of flagged) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#t-${trophy.id}`;
    link.textContent = trophy.name;
    item.append(link, document.createTextNode(` — ${trophy.description}`));
    list.append(item);
  }
}

function renderList() {
  const shown = allTrophies.filter(trophyMatches);
  listEl.replaceChildren(...shown.map(trophyCard));
  $('emptyNote').hidden = shown.length > 0;
  if (activeKind === 'online') {
    noteEl.textContent = 'The official list holds no online trophies — all 55 are earned in single-player.';
  } else if (shown.length === 0) {
    noteEl.textContent = '';
  } else {
    noteEl.textContent = `Showing ${shown.length} of ${allTrophies.length} trophies.`;
  }
}

function renderAll() {
  renderProgress();
  renderList();
}

function exportProgress() {
  const payload = {
    app: 'leonida-trophy-guide',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
    spoilerHidden: spoilerEl.checked,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(url);
  noteEl.textContent = `Exported ${earned.size} earned ${earned.size === 1 ? 'trophy' : 'trophies'}.`;
}

async function importProgress(file) {
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(allTrophies.map((t) => t.name));
    const clean = names.filter((n) => typeof n === 'string' && known.has(n));
    earned = new Set(clean);
    saveProgress();
    if (typeof parsed.spoilerHidden === 'boolean') {
      spoilerEl.checked = parsed.spoilerHidden;
      saveSettings();
    }
    renderAll();
    noteEl.textContent = `Imported ${clean.length} earned ${clean.length === 1 ? 'trophy' : 'trophies'}${names.length - clean.length ? ` (${names.length - clean.length} unknown names skipped)` : ''}.`;
  } catch {
    noteEl.textContent = 'That file could not be read as a progress export. Export one first and import that file back.';
  }
}

function wireControls() {
  document.querySelectorAll('#kindChips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      activeKind = chip.dataset.kind;
      document.querySelectorAll('#kindChips .chip').forEach((c) => c.classList.toggle('on', c === chip));
      renderList();
    });
  });
  searchEl.addEventListener('input', renderList);
  gradeEl.addEventListener('change', renderList);
  earnedEl.addEventListener('change', renderList);
  spoilerEl.addEventListener('change', () => { saveSettings(); renderList(); });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) importProgress(file);
    event.target.value = '';
  });
}

async function startGuide() {
  loadStored();
  const response = await fetch(DATA_URL);
  const data = await response.json();
  allTrophies = data.trophies;
  byId = new Map(allTrophies.map((t) => [t.id, t]));
  renderRoadmap();
  renderMissable();
  wireControls();
  renderAll();
}

startGuide();
