import * as migration_20261010_092902_baseline from './20261010_092902_baseline';

export const migrations = [
  {
    up: migration_20261010_092902_baseline.up,
    down: migration_20261010_092902_baseline.down,
    name: '20261010_092902_baseline'
  },
];
