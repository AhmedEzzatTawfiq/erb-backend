import { IsEnum } from 'class-validator';

import { InvoiceStatus } from '../enums/invoice-status.enum';

export class UpdateInvoiceStatusDto {
  @IsEnum(InvoiceStatus)
  status: InvoiceStatus;
}