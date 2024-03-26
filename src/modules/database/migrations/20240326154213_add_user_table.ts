import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user')
    .addColumn('id', 'varchar(36)', (col) => col.primaryKey().notNull())
    .addColumn('email', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('password', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('first_name', 'varchar(255)')
    .addColumn('last_name', 'varchar(255)')
    .addColumn('created_at', 'datetime(6)', (cb) => cb.notNull())
    .addColumn('updated_at', 'datetime(6)', (cb) => cb.notNull())
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user').execute();
}
