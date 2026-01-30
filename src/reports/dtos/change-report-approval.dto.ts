import { IsBoolean } from 'class-validator';

export class changeReportApprovalDto {
  @IsBoolean()
  approved: boolean;
}
