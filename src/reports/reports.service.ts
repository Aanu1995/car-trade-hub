import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { CreateReportDto } from './dtos/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly repo: Repository<Report>,
  ) {}

  create(user: User, reportDto: CreateReportDto): Promise<Report> {
    const report = this.repo.create(reportDto);
    report.createdBy = user;

    return this.repo.save(report);
  }

  findByUserId(userid: number, limit: number = 10): Promise<Report[]> {
    return this.repo.find({
      where: { createdBy: { id: userid } },
      order: { createdOn: 'DESC' },
      take: limit,
    });
  }

  async changeApproval(id: number, approved: boolean): Promise<Report> {
    // verify report exists
    const report = await this.repo.findOneBy({ id });
    if (!report) {
      throw new NotFoundException(`Report with id ${id} not found`);
    }

    report.approved = approved;
    return this.repo.save(report);
  }
}
