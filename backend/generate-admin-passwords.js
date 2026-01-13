// Script para generar hashes de contraseñas para admins
// Ejecutar con: node generate-admin-passwords.js

const bcrypt = require('bcrypt');

const passwords = {
    faustina: 'faustina2026',
    christian: 'christian2026'
};

async function generateHashes() {
    console.log('🔐 Generando hashes de contraseñas...\n');

    for (const [username, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`Usuario: ${username}`);
        console.log(`Contraseña: ${password}`);
        console.log(`Hash: ${hash}\n`);
    }

    console.log('✅ Hashes generados. Copia los hashes a la migración SQL.');
}

generateHashes();
