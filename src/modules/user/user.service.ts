import { Injectable } from '@nestjs/common';
import { Database } from '../database/database';
import { Selectable } from 'kysely';
import { User } from './schema/user.schema';
import { randomUUID } from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly database: Database) {}

  async getUserById(id: string): Promise<Selectable<User>> {
    const user = await this.database
      .selectFrom('user')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return user;
  }

  async getAllUsers(): Promise<Selectable<User[]>> {
    const user = await this.database.selectFrom('user').selectAll().execute();
    return user;
  }

  async getUserByEmail(email: string): Promise<Selectable<User>> {
    const user = await this.database
      .selectFrom('user')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    return user;
  }

  async createUser(user: CreateUserDto): Promise<string> {
    const id = randomUUID();
    await this.database
      .insertInto('user')
      .values({
        ...user,
        id,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .executeTakeFirst();

    return id;
  }
}
