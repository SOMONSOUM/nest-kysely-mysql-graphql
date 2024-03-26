import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SecurityConfig } from 'src/common/configs/config.interface';
import { Token } from './schema/token.schema';
import { RegisterAuthDto } from './dto/register.dto';
import { PasswordService } from '../../utils/password.service';
import { UserService } from '../user/user.service';
import { User } from '../user/schema/user.schema';
import { GraphQLError } from 'graphql';
import { ERROR_MESSAGES } from 'src/common/errors/errorMessages';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly userService: UserService,
  ) {}

  async createUser(payload: RegisterAuthDto): Promise<Token> {
    const { ...user } = payload;

    const hashedPassword = await this.passwordService.hashPassword(
      user.password,
    );

    user.password = hashedPassword;

    try {
      const existed_user = await this.userService.getUserByEmail(user.email);
      if (existed_user) {
        throw new GraphQLError(ERROR_MESSAGES.CONFLICT, {
          extensions: {
            code: HttpStatus.CONFLICT,
          },
        });
      }

      const userId = await this.userService.createUser(user);
      if (!userId) {
        throw new BadRequestException('Error creating user');
      }
      return this.generateTokens({
        userId: userId,
      });
    } catch (e) {
      throw new Error(e);
    }
  }

  async login(email: string, password: string): Promise<Token> {
    const user = await this.userService.getUserByEmail(email);

    if (!user) {
      throw new GraphQLError(ERROR_MESSAGES.NOT_FOUND, {
        extensions: {
          code: HttpStatus.NOT_FOUND,
        },
      });
    }

    const passwordValid = await this.passwordService.validatePassword(
      password,
      user.password,
    );

    if (!passwordValid) {
      throw new GraphQLError(ERROR_MESSAGES.PASSWORD_IN_CORRECT, {
        extensions: {
          code: HttpStatus.UNAUTHORIZED,
        },
      });
    }

    return this.generateTokens({
      userId: user.id,
    });
  }

  async validateUser(userId: string): Promise<User> {
    // Find user by id
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }
    return user;
  }

  getUserFromToken(token: string): Promise<User> {
    // Decode token and get user id from sub property
    const id = this.jwtService.decode(token)['userId'];
    return this.validateUser(id);
  }

  generateTokens(payload: { userId: string }): Token {
    // Generate access token and refresh token
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  private generateAccessToken(payload: { userId: string }): string {
    return this.jwtService.sign(payload);
  }

  private generateRefreshToken(payload: { userId: string }): string {
    const securityConfig = this.configService.get<SecurityConfig>('security');
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: securityConfig.refreshIn,
    });
  }

  refreshToken(token: string) {
    try {
      const { userId } = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      return this.generateTokens({
        userId,
      });
    } catch (e) {
      throw new UnauthorizedException();
    }
  }
}
