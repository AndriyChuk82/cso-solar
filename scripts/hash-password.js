const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Enter password to hash: ', async (password) => {
    const hash = await bcrypt.hash(password, 12);
    console.log('\n✅ Password hash generated!\n');
    console.log('Add this to your .env.local and Vercel Environment Variables:\n');
    console.log(`AUTH_PASSWORD_HASH=${hash}`);
    console.log('\n⚠️  Keep this hash secure. Do not share it.');
    rl.close();
});
