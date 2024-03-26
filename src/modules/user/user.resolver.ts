import { Args, Query, Resolver } from '@nestjs/graphql';
import { UserService } from './user.service';
import { HttpStatus, UseGuards } from '@nestjs/common';
import { User } from './schema/user.schema';
import { GraphQLError } from 'graphql';
import { GqlAuthGuard } from '../auth/guard/gql.auth.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async getUserById(@Args('id') id: string) {
    const result = await this.userService.getUserById(id);
    if (!result) {
      throw new GraphQLError('User not found', {
        extensions: {
          code: HttpStatus.NOT_FOUND,
        },
      });
    }
    return result;
  }

  @Query(() => [User])
  @UseGuards(GqlAuthGuard)
  async getAllUsers() {
    const result = await this.userService.getAllUsers();
    if (!result) {
      throw new GraphQLError('User not found', {
        extensions: {
          code: HttpStatus.NOT_FOUND,
        },
      });
    }
    return result;
  }
}
