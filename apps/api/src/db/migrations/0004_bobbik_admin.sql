-- Make BobbikMan an admin across all environments
UPDATE users SET role = 'admin' WHERE username ILIKE 'bobbikman';
