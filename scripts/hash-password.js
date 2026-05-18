const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.js <your-password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
console.log('\nYour bcrypt hash (paste into .env as NEXT_AUTH_ADMIN_PASSWORD):');
console.log(hash);
