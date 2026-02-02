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
import { JwtDto } from './dtos/jwt-dto';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: UserRole.USER })
  role: string;

  @OneToMany(() => Report, (report) => report.createdBy)
  reports: Report[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterInsert()
  logInsertUser() {
    console.log(`Inserted User with id: ${this.id}`);
  }

  @AfterUpdate()
  logUpdatedUser() {
    console.log(`Updated User with id: ${this.id}`);
  }
}

export class UserWithJwt extends User {
  jwt: JwtDto;
}
