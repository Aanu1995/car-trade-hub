import { Report } from 'src/reports/report.entity';
import {
  AfterInsert,
  AfterUpdate,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JwtDto } from '../dtos/jwt-dto';
import { UserIdentity } from './user-identity.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password: string | null;

  @Column({ default: UserRole.USER })
  role: string;

  @OneToMany(() => UserIdentity, (identity) => identity.user)
  identities: UserIdentity[];

  @OneToMany(() => Report, (report) => report.createdBy)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export class UserWithJwt extends User {
  jwt: JwtDto;
}

export class UserWithTokenInfo extends User {
  tokenId: string;
}
