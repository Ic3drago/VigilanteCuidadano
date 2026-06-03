/**
 * VigilanteCiudadano - Migration & Seeding Runner Script
 * Location: database/run_migration.js
 */

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const crypto = require('crypto');

// Server-side crypto hash utilities replicated in standard JS for migration script execution
const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha256';

function hashPin(pin, salt) {
  const hash = crypto.pbkdf2Sync(pin, salt, ITERATIONS, KEY_LENGTH, DIGEST);
  return hash.toString('hex');
}

function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

// 1. Load DATABASE_URL from .env.local
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=["']?([^"'\r\n]+)["']?/);
    if (match) {
      databaseUrl = match[1];
    }
  }
}

if (!databaseUrl) {
  console.error('❌ Error: DATABASE_URL no fue encontrada en las variables de entorno ni en .env.local');
  process.exit(1);
}

console.log('🔗 Conectando a la base de datos PostgreSQL...');
const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  }
});

async function run() {
  try {
    await client.connect();
    console.log('✅ Conexión exitosa.');

    // 2. Read and execute the SQL migration script
    const sqlPath = path.join(__dirname, 'migration_auth.sql');
    console.log(`📖 Leyendo migración desde: ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('⚙️ Ejecutando migración DDL...');
    await client.query(sql);
    console.log('✅ Migración ejecutada con éxito.');

    // 3. Seed/Update Official "PAC-402" with secure PIN 123456
    console.log('👤 Procesando cuenta semilla de Oficial...');
    const officialPlate = 'PAC-402';
    const officialPin = '123456';
    const officialSalt = generateSalt();
    const officialHash = hashPin(officialPin, officialSalt);

    // Check if the official already exists
    const checkOfficial = await client.query('SELECT id FROM vc_oficiales WHERE numero_placa = $1', [officialPlate]);
    
    if (checkOfficial.rows.length > 0) {
      // Update credentials
      await client.query(
        'UPDATE vc_oficiales SET pin_hash = $1, pin_salt = $2 WHERE numero_placa = $3',
        [officialHash, officialSalt, officialPlate]
      );
      console.log(`✓ Oficial '${officialPlate}' actualizado con PIN seguro.`);
    } else {
      // Insert new official
      await client.query(
        'INSERT INTO vc_oficiales (numero_placa, nombre_completo, rango, pin_hash, pin_salt) VALUES ($1, $2, $3, $4, $5)',
        [officialPlate, 'Cabo Juan de Dios Quispe', 'CABO', officialHash, officialSalt]
      );
      console.log(`✓ Oficial '${officialPlate}' creado e insertado con PIN seguro.`);
    }

    // 4. Seed/Update Operator "SGT. QUISPE" with secure PIN 654321
    console.log('👤 Procesando cuenta semilla de Operador...');
    const operatorId = 'SGT. QUISPE';
    const operatorName = 'Sargento Hilarión Quispe';
    const operatorPin = '654321';
    const operatorSalt = generateSalt();
    const operatorHash = hashPin(operatorPin, operatorSalt);

    // Check if operator exists (using INSERT ON CONFLICT)
    const checkOperator = await client.query('SELECT id FROM vc_operadores WHERE credencial_id = $1', [operatorId]);
    
    if (checkOperator.rows.length > 0) {
      await client.query(
        'UPDATE vc_operadores SET nombre_completo = $1, pin_hash = $2, pin_salt = $3 WHERE credencial_id = $4',
        [operatorName, operatorHash, operatorSalt, operatorId]
      );
      console.log(`✓ Operador '${operatorId}' actualizado con PIN seguro.`);
    } else {
      await client.query(
        'INSERT INTO vc_operadores (credencial_id, nombre_completo, pin_hash, pin_salt) VALUES ($1, $2, $3, $4)',
        [operatorId, operatorName, operatorHash, operatorSalt]
      );
      console.log(`✓ Operador '${operatorId}' creado e insertado con PIN seguro.`);
    }

    console.log('🎉 Migración y población de datos semilla completada con éxito.');

  } catch (error) {
    console.error('❌ Error ejecutando la migración:', error);
  } finally {
    await client.end();
  }
}

run();
