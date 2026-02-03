import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { CreateReportDto } from './dtos/create-report.dto';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Report) private readonly repo: Repository<Report>,
  ) {}

  async create(user: User, reportDto: CreateReportDto): Promise<Report> {
    this.logger.log(`Creating report for user ID: ${user.id}`);
    const report = this.repo.create({ ...reportDto, createdBy: user });
    const savedReport = await this.repo.save(report);

    this.logger.log(
      `Report created with ID: ${savedReport.id} by user ID: ${user.id}`,
    );
    return savedReport;
  }

  findByUserId(userid: number, limit: number = 10): Promise<Report[]> {
    return this.repo.find({
      where: { createdById: userid },
      order: { createdOn: 'DESC' },
      take: limit,
    });
  }

  async changeApproval(id: number, approved: boolean): Promise<Report> {
    this.logger.log(
      `Changing approval status for report ID: ${id} to ${approved}`,
    );
    // verify report exists
    const report = await this.repo.findOneBy({ id });
    if (!report) {
      this.logger.warn(`Report not found with ID: ${id}`);
      throw new NotFoundException(`Report with id ${id} not found`);
    }

    report.approved = approved;
    const updatedReport = await this.repo.save(report);

    this.logger.log(`Report ID: ${id} approval status changed to ${approved}`);
    return updatedReport;
  }
}
