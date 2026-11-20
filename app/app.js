// Leonida Trophy Guide — tracker logic. Static files only: the trophy data comes
// from data/trophies.json next to this file, progress lives in localStorage.
const STORAGE_KEY = 'gta6-trophy-guide-progress-v1';

const SOURCES = {
  exophase: { name: 'Exophase — Grand Theft Auto VI trophies (PSN)', url: null },
  psnprofiles: { name: 'PSNProfiles — Grand Theft Auto VI trophy list', url: null },
  pushsquare: { name: 'Push Square — GTA 6 Trophy Guide & Roadmap', url: 'https://www.pushsquare.com/guides/gta-6-trophy-guide-and-roadmap' },
  gtabase: { name: 'GTABase — GTA 6 Trophy Guide & Roadmap', url: 'https://www.gtabase.com/articles/gta-6/gta-6-achievements-trophies-list-ps5-xbox-series' },
  keengamer: { name: 'KeenGamer — GTA 6 Trophy Guide & Platinum Roadmap', url: 'https://www.keengamer.com/articles/guides/gta-6-trophy-guide-platinum-roadmap-all-55-trophies/' },
  gamesfuze: { name: 'GamesFuze — GTA 6 Trophy List', url: 'https://gamesfuze.com/gta-6-wiki/achievements/' },
  egamers: { name: 'EGamers.io — GTA 6 Trophy List', url: 'https://egamers.io/gta-6-trophy-list-all-55-trophies-and-achievements-plus-the-hardest-ones/' },
  insider: { name: 'Insider Gaming — 100% completion checklist (via KeenGamer)', url: null },
};

const KIND_LABELS = {
  story: 'Story', side: 'Strangers', collectible: 'Collectibles', activity: 'Activities',
  crime: 'Crime', economy: 'Money', meta: 'Platinum path',
};

const STAGES = [
  { n: 1, title: 'Stage 1 — Play the story', text: 'Chapters 1 to 4 in order. The six named-mission trophies unlock as you go, and the final mission pays the Gold. No mission replay, so enjoy it the first time.' },
  { n: 2, title: 'Stage 2 — Strangers & Freaks', text: 'Finish the five stranger strands (Andy, Kenton, Billy, Randy, Tyrone) and find three more stranger strands to reach eight for the Silver.' },
  { n: 3, title: 'Stage 3 — Activities', text: 'Shooting Range golds (42), drone races (14), 20 different races, fishing against Cal, an arcade game, Bret\u2019s hunt, bowling, and all 18 meditation spots. Meditate at each spot as you find it — see the missable warning above.' },
  { n: 4, title: 'Stage 4 — Collectibles & counts', text: '250 stunts, 100 vehicles, 100 WAiNK tags, 3 card sets, 50 challenges, and every corner of Leonida explored. The long grind — chip away at it between missions.' },
  { n: 5, title: 'Stage 5 — Crime with your partner', text: 'Bank vaults, an armored truck, a jewelry store undetected, three shops in a row, one illegal operation per gang, and the 4-star wanted escape — most of these want your partner beside you.' },
  { n: 6, title: 'Stage 6 — Money & loose ends', text: 'Launder $250,000 of Marked Bills, spend $100,000 across the shops, buy every garage, register 10 vehicles — and check the four still-unconfirmed trophies (Personal Best, Actions Speak Louder, Bad Luck I Guess, The Truth Is Out There) once players pin them down.' },
  { n: 7, title: 'Stage 7 — 100% & Platinum', text: 'Finish the 35-task 100% checklist (A Long Road, the hardest trophy), and Vice Got a Price! pops with it.' },
];

const params = new URLSearchParams(location.search);
const state = {
  earned: new Set(loadProgress()),
  kind: params.get('kind') || 'all',
  grade: 'all',
  status: 'all',
  search: '',
  spoiler: params.get('spoiler') !== '0',
  highlight: params.get('trophy') ? Number(params.get('trophy')) : null,
};

const listEl = document.getElementById('trophy-list');
const summaryEl = document.getElementById('list-summary');
const emptyNote = document.getElementById('empty-note');
const spoilerBox = document.getElementById('spoiler');
spoilerBox.checked = state.spoiler;

let DATA = null;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.earned].sort((a, b) => a - b)));
}

function gradeBadge(t) {
  const span = document.createElement('span');
  span.className = 'grade-badge grade-' + t.grade;
  span.textContent = t.grade;
  return span;
}

function sourceLine(t) {
  const p = document.createElement('p');
  p.className = 'sources';
  p.append(document.createTextNode('Sources: '));
  t.sources.forEach((key, i) => {
    if (i > 0) p.append(document.createTextNode(' · '));
    const src = SOURCES[key];
    if (src && src.url) {
      const a = document.createElement('a');
      a.href = src.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = src.name;
      p.append(a);
    } else {
      p.append(document.createTextNode(src ? src.name : key));
    }
  });
  return p;
}

function renderProgress() {
  const total = DATA.trophies.length;
  const earned = state.earned.size;
  document.getElementById('progress-fill').style.width = (earned / total * 100).toFixed(1) + '%';
  document.getElementById('progress-text').textContent = earned + ' of ' + total + ' earned (' + Math.round(earned / total * 100) + '%)';
  const counts = {};
  for (const t of DATA.trophies) counts[t.grade] = (counts[t.grade] || 0) + 1;
  const earnedByGrade = {};
  for (const t of DATA.trophies) if (state.earned.has(t.id)) earnedByGrade[t.grade] = (earnedByGrade[t.grade] || 0) + 1;
  document.getElementById('grade-counts').textContent =
    'Platinum ' + (earnedByGrade.platinum || 0) + '/' + counts.platinum +
    ' · Gold ' + (earnedByGrade.gold || 0) + '/' + counts.gold +
    ' · Silver ' + (earnedByGrade.silver || 0) + '/' + counts.silver +
    ' · Bronze ' + (earnedByGrade.bronze || 0) + '/' + counts.bronze;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap');
  ol.replaceChildren();
  for (const stage of STAGES) {
    const members = DATA.trophies.filter((t) => t.stage === stage.n);
    const done = members.filter((t) => state.earned.has(t.id)).length;
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    h3.textContent = stage.title;
    const count = document.createElement('span');
    count.className = 'stage-count';
    count.textContent = done + ' / ' + members.length + ' earned';
    h3.append(count);
    const p = document.createElement('p');
    p.textContent = stage.text;
    const names = document.createElement('p');
    names.className = 'stage-trophies';
    names.textContent = members.map((t) => (state.earned.has(t.id) ? '✓ ' : '') + t.name).join(' · ');
    li.append(h3, p, names);
    ol.append(li);
  }
}

function trophyVisible(t) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.status === 'earned' && !state.earned.has(t.id)) return false;
  if (state.status === 'unearned' && state.earned.has(t.id)) return false;
  if (state.search) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(state.search)) return false;
  }
  return true;
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of DATA.trophies) {
    if (!trophyVisible(t)) continue;
    shown += 1;
    const card = document.createElement('article');
    card.className = 'trophy' + (state.earned.has(t.id) ? ' earned' : '');
    card.id = 'trophy-' + t.id;
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', 'Earned: ' + t.name);
    box.addEventListener('change', () => {
      if (box.checked) state.earned.add(t.id);
      else state.earned.delete(t.id);
      saveProgress();
      renderAll();
    });
    const body = document.createElement('div');
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const hiddenStory = state.spoiler && t.kind === 'story' && !state.earned.has(t.id);
    const name = document.createElement('h3');
    name.className = 'trophy-name';
    name.textContent = hiddenStory ? 'Hidden story trophy' : t.name;
    head.append(name, gradeBadge(t));
    const kindTag = document.createElement('span');
    kindTag.className = 'kind-tag';
    kindTag.textContent = KIND_LABELS[t.kind] || t.kind;
    head.append(kindTag);
    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'missable-tag';
      tag.textContent = 'Possibly missable';
      head.append(tag);
    }
    if (t.targetLabel) {
      const tag = document.createElement('span');
      tag.className = 'target-tag';
      tag.textContent = t.targetLabel;
      head.append(tag);
    }
    body.append(head);
    if (hiddenStory) {
      const p = document.createElement('p');
      p.className = 'spoiler-hidden';
      p.textContent = 'Story trophy — its name, description and guide stay hidden until you earn it. Tick the box when it pops.';
      body.append(p);
    } else {
      const official = document.createElement('p');
      official.className = 'official';
      const label = document.createElement('span');
      label.className = 'label';
      label.textContent = 'Official — ';
      official.append(label, document.createTextNode('\u201C' + t.description + '\u201D'));
      const guide = document.createElement('p');
      guide.className = 'guide-text';
      guide.textContent = t.guide;
      body.append(official, guide, sourceLine(t));
    }
    card.append(box, body);
    listEl.append(card);
  }
  summaryEl.textContent = shown + ' of ' + DATA.trophies.length + ' trophies shown' +
    (state.kind === 'online' ? ' — there are no online trophies: all 55 are offline and single-player.' : '');
  emptyNote.hidden = shown !== 0;
}

function renderKindFilters() {
  const wrap = document.getElementById('kind-filters');
  wrap.replaceChildren();
  const kinds = [['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectible', 'Collectibles'], ['activity', 'Activities'], ['side', 'Strangers'], ['crime', 'Crime'], ['economy', 'Money'], ['meta', 'Platinum path'], ['online', 'Online']];
  for (const [value, label] of kinds) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    if (state.kind === value) b.classList.add('active');
    b.addEventListener('click', () => {
      state.kind = value;
      renderAll();
    });
    wrap.append(b);
  }
}

function renderSources() {
  const ul = document.getElementById('source-list');
  ul.replaceChildren();
  for (const key of Object.keys(SOURCES)) {
    const src = SOURCES[key];
    const li = document.createElement('li');
    if (src.url) {
      const a = document.createElement('a');
      a.href = src.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = src.name;
      li.append(a);
    } else {
      li.textContent = src.name;
    }
    ul.append(li);
  }
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderKindFilters();
  renderList();
}

document.getElementById('search').addEventListener('input', (e) => {
  state.search = e.target.value.trim().toLowerCase();
  renderList();
});
document.getElementById('grade-filter').addEventListener('change', (e) => {
  state.grade = e.target.value;
  renderList();
});
document.getElementById('status-filter').addEventListener('change', (e) => {
  state.status = e.target.value;
  renderList();
});
spoilerBox.addEventListener('change', () => {
  state.spoiler = spoilerBox.checked;
  renderList();
});

document.getElementById('export').addEventListener('click', () => {
  const payload = {
    game: 'Grand Theft Auto VI',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    const valid = new Set(DATA.trophies.map((t) => t.id));
    state.earned = new Set(ids.filter((id) => valid.has(id)));
    saveProgress();
    renderAll();
  } catch {
    alert('That file is not a trophy-progress export from this guide.');
  }
  e.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (!confirm('Clear all earned trophies?')) return;
  state.earned = new Set();
  saveProgress();
  renderAll();
});

DATA = await (await fetch('data/trophies.json')).json();
renderSources();
renderAll();
if (params.get('view') === 'roadmap') {
  document.getElementById('roadmap-panel').scrollIntoView();
} else if (state.highlight) {
  const el = document.getElementById('trophy-' + state.highlight);
  if (el) el.scrollIntoView({ block: 'center' });
}
