import { Kysely } from 'kysely';
import { User } from '../user/schema/user.schema';

// Add your tables here.
interface Tables {
  user: User;
}

export interface DatabaseOptions {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export class Database extends Kysely<Tables> {}
