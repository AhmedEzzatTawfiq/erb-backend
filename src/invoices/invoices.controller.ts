import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';

import { InvoicesService } from './invoices.service';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get()
  findAll(@Query() query: GetInvoicesQueryDto) {
    return this.invoicesService.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateInvoiceStatusDto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(
      id,
      updateInvoiceStatusDto.status,
    );
  }
}
