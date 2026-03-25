import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, '../data/raw');

const REPO = 'https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2014';

const FILES = [
  { url: `${REPO}/5e-SRD-Spells.json`, out: 'spells-phb.json' },
  { url: `${REPO}/5e-SRD-Monsters.json`, out: 'monsters-mm.json' },
  { url: `${REPO}/5e-SRD-Classes.json`, out: 'classes.json' },
  { url: `${REPO}/5e-SRD-Races.json`, out: 'races.json' },
  { url: `${REPO}/5e-SRD-Backgrounds.json`, out: 'backgrounds.json' },
  { url: `${REPO}/5e-SRD-Feats.json`, out: 'feats.json' },
  { url: `${REPO}/5e-SRD-Conditions.json`, out: 'conditions.json' },
  { url: `${REPO}/5e-SRD-Equipment.json`, out: 'items-phb.json' },
  { url: `${REPO}/5e-SRD-Magic-Items.json`, out: 'items-dmg.json' },
];

async function run() {
  mkdirSync(RAW_DIR, { recursive: true });
  console.log('Fetching SRD 5.1 data from 5e-bits/5e-database...');
  
  for (const file of FILES) {
    try {
      const res = await fetch(file.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      writeFileSync(join(RAW_DIR, file.out), text);
      console.log(`✅ Successfully downloaded ${file.out}`);
    } catch (err) {
      console.error(`❌ Failed to download ${file.out}:`, err);
    }
  }
}

run();
