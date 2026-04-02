import { runMigrations } from './migrate.js';

runMigrations()
  .then(() => {
    console.log('✅ Migrations completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Fatal migration error:', err);
    process.exit(1);
  });
