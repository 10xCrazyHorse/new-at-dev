import SqliteDb from 'better-sqlite3';
import {
  Kysely,
  Migrator,
  SqliteDialect,
  type Migration,
  type MigrationProvider,
} from 'kysely';

// Types

export type DatabaseSchema = {
  status: Status;
  post: Post;
};

export type Status = {
  uri: string;
  authorDid: string;
  status: string;
  createdAt: string;
  indexedAt: string;
};

export type Post = {
  uri: string;
  authorDid: string;
  text: string;
  createdAt: string;
  indexedAt: string;
};

// Migrations

const migrations: Record<string, Migration> = {};

const migrationProvider: MigrationProvider = {
  async getMigrations() {
    return migrations;
  },
};

migrations['001'] = {
  async up(db: Kysely<unknown>) {
    await db.schema
      .createTable('status')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('status', 'varchar', (col) => col.notNull())
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute();
    await db.schema
      .createTable('post')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('text', 'varchar', (col) => col.notNull())
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute();
  },
  async down(db: Kysely<unknown>) {
    await db.schema.dropTable('status').execute();
    await db.schema.dropTable('post').execute();
  },
};

// APIs

export const createDb = (location: string): Database => {
  return new Kysely<DatabaseSchema>({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  });
};

export const migrateToLatest = async (db: Database) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
};

export type Database = Kysely<DatabaseSchema>;
