import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AuthProvider, UserIdentity } from './entities/user-identity.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(UserIdentity)
    private readonly identityRepo: Repository<UserIdentity>,
  ) {}

  async create(email: string, password: string): Promise<User> {
    this.logger.log(`Creating new user record`);
    try {
      const user = this.repo.create({ email, password });
      const savedUser = await this.repo.save(user);
      this.logger.log(`User record created with ID: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create user record`, error);
      throw new ConflictException('Email already in use');
    }
  }

  async createOAuthUser(email: string): Promise<User> {
    this.logger.log(`Creating new OAuth user record`);
    try {
      const user = this.repo.create({ email, password: null });
      const savedUser = await this.repo.save(user);
      this.logger.log(`OAuth user record created with ID: ${savedUser.id}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Failed to create OAuth user record`, error);
      throw new ConflictException('Email already in use');
    }
  }

  findOne(id: number): Promise<User | null> {
    if (!id) {
      throw new BadRequestException('User ID must be provided');
    }

    return this.repo.findOneBy({ id });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email });
  }

  findIdentityByProviderUserId(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<UserIdentity | null> {
    return this.identityRepo.findOneBy({ provider, providerUserId });
  }

  async createIdentity(params: {
    userId: number;
    provider: AuthProvider;
    providerUserId: string;
    email: string;
    emailVerified: boolean;
  }): Promise<UserIdentity> {
    this.logger.log(
      `Creating new user identity for user ID: ${params.userId} with provider: ${params.provider}`,
    );
    const identity = this.identityRepo.create({
      userId: params.userId,
      provider: params.provider,
      providerUserId: params.providerUserId,
      email: params.email,
      emailVerified: params.emailVerified,
    });

    const savedIdentity = await this.identityRepo.save(identity);
    this.logger.log(
      `User identity created with ID: ${savedIdentity.id} for user ID: ${params.userId}`,
    );
    return savedIdentity;
  }

  find(email: string): Promise<User[]> {
    return this.repo.findBy({ email });
  }

  async update(id: number, attrs: Partial<User>): Promise<User> {
    this.logger.log(`Updating user ID: ${id}`);
    const user = await this.findOne(id);
    if (!user) {
      this.logger.warn(`Update failed - user not found with ID: ${id}`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const newUser = Object.assign(user, attrs);
    const updatedUser = await this.repo.save(newUser);
    this.logger.log(`User ID: ${id} updated successfully`);
    return updatedUser;
  }

  async remove(id: number): Promise<User> {
    this.logger.log(`Removing user ID: ${id}`);
    const user = await this.findOne(id);
    if (!user) {
      this.logger.warn(`Remove failed - user not found with ID: ${id}`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const removedUser = await this.repo.remove(user);
    this.logger.log(`User ID: ${id} removed successfully`);
    return removedUser;
  }
}
