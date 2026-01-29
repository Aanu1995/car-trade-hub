import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  async create(email: string, password: string): Promise<User> {
    try {
      const user = this.repo.create({ email, password });

      return this.repo.save(user);
    } catch (error) {
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

  find(email: string): Promise<User[]> {
    return this.repo.findBy({ email });
  }

  async update(id: number, attrs: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const newUser = Object.assign(user, attrs);
    return await this.repo.save(newUser);
  }

  async remove(id: number): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return await this.repo.remove(user);
  }
}
