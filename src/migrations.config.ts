import * as path from 'path';
import { promises as fs } from 'fs';
import { Kysely, Migrator, FileMigrationProvider, MysqlDialect } from 'kysely';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { createPool } from 'mysql2';

config();

const configService = new ConfigService();

async function migrateToLatest() {
  const database = new Kysely({
    dialect: new MysqlDialect({
      pool: createPool({
        uri: configService.get<string>('DATABASE_URL'),
      }),
    }),
  });

  const migrator = new Migrator({
    db: database,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, './modules/database/migrations'),
    }),
  });

  const { error, results } = await migrator.migrateToLatest();
  results?.forEach((migrationResult) => {
    if (migrationResult.status === 'Success') {
      console.log(
        `migration "${migrationResult.migrationName}" was executed successfully`,
      );
    } else if (migrationResult.status === 'Error') {
      console.error(
        `failed to execute migration "${migrationResult.migrationName}"`,
      );
    }
  });

  if (error) {
    console.error('Failed to migrate');
    console.error(error);
    process.exit(1);
  }

  await database.destroy();
}

migrateToLatest();
