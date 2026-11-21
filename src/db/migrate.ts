import 'dotenv/config';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { db, client } from './index';

async function main() {
  console.log('Aplicando migraciones de Drizzle sobre', process.env.DATABASE_URL ?? 'file:local.db');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migraciones aplicadas correctamente.');
  client.close();
}

main().catch((err) => {
  console.error('Error al aplicar migraciones:', err);
  process.exit(1);
});
