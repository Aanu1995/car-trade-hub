import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Timeout } from 'src/interceptors/timeout.interceptor';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { ReportDto } from './dtos/report.dto';
import { CreateReportDto } from './dtos/create-report.dto';
import { CurrentUser } from 'src/decorators/current-user.decorator';
import { User, UserRole } from 'src/users/user.entity';
import { Report } from './report.entity';
import { changeReportApprovalDto } from './dtos/change-report-approval.dto';
import { Roles } from 'src/decorators/role.decorator';

@Timeout()
@Serialize(ReportDto)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  createReport(
    @CurrentUser() user: User,
    @Body() body: CreateReportDto,
  ): Promise<Report> {
    return this.reportsService.create(user, body);
  }

  @Get()
  findAllReports(@CurrentUser() user: User): Promise<Report[]> {
    return this.reportsService.findByUserId(user.id);
  }

  @Roles([UserRole.ADMIN])
  @Patch(':id')
  approveReport(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: changeReportApprovalDto,
  ): Promise<Report> {
    try {
      return this.reportsService.changeApproval(id, body.approved);
    } catch (error) {
      throw error;
    }
  }
}
