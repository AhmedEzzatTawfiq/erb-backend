import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';

import { Invoice } from './entities/invoice.entity';
import { InvoiceLine } from './entities/invoice-line.entity';
import { InvoiceStatus } from './enums/invoice-status.enum';

import { Order } from '../orders/entities/order.entity';
import { OrderLine } from '../orders/entities/order-line.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GetInvoicesQueryDto } from './dto/get-invoices-query.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class InvoicesService {
  constructor(
    private dataSource: DataSource,

    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
  ) { }

  async createFromOrder(manager: EntityManager, orderId: string) {
    const order = await manager.findOne(Order, {
      where: { id: orderId },
      relations: {
        customer: true,
        lines: { product: true },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const invoice = manager.create(Invoice, {
      orderId: order.id,
      customerId: order.customerId,
      invoiceDate: order.orderDate,
      dueDate: order.orderDate,
      status: InvoiceStatus.PENDING,
      totalAmount: order.totalAmount,
    });

    const savedInvoice = await manager.save(invoice);

    const invoiceLines: InvoiceLine[] = [];

    for (const orderLine of order.lines) {
      const invoiceLine = manager.create(InvoiceLine, {
        invoiceId: savedInvoice.id,
        description: orderLine.product.name,
        quantity: orderLine.quantity,
        unitPrice: orderLine.unitPrice,
        taxRate: 0,
      });
      invoiceLines.push(invoiceLine);
    }

    await manager.save(invoiceLines);

    return this.findOneWithManager(manager, savedInvoice.id);
  }

  private async findOneWithManager(
    manager: EntityManager,
    id: string,
  ) {
    return manager.findOneOrFail(Invoice, {
      where: { id },
      relations: {
        order: true,
        customer: true,
        lines: true,
      },
    });
  }


  async findAll(query: GetInvoicesQueryDto) {
    const { status, customerId, from, to, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.customer', 'customer')
      .leftJoinAndSelect('invoice.order', 'order')
      .leftJoinAndSelect('invoice.lines', 'lines');

    if (status) {
      queryBuilder.andWhere('invoice.status = :status', { status });
    }

    if (customerId) {
      queryBuilder.andWhere('invoice.customerId = :customerId', { customerId });
    }

    if (from) {
      queryBuilder.andWhere('invoice.invoiceDate >= :from', { from });
    }

    if (to) {
      queryBuilder.andWhere('invoice.invoiceDate <= :to', { to });
    }

    if (search) {
      queryBuilder.andWhere(
        '(customer.companyName ILIKE :search OR customer.contactName ILIKE :search OR invoice.id::text ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    queryBuilder
      .orderBy('invoice.invoiceDate', 'DESC')
      .skip(skip)
      .take(limit);

    const [invoices, total] = await queryBuilder.getManyAndCount();

    return {
      data: invoices,
      meta: {
        total,
        totalCount: total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        order: true,
        lines: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(
        'Invoice not found',
      );
    }

    return invoice;
  }

  async updateStatus(id: string, status: InvoiceStatus) {
    const invoice = await this.findOne(id);

    if (status === InvoiceStatus.PAID) {
      if (invoice.status === InvoiceStatus.PAID) {
        throw new ConflictException('Invoice is already paid');
      }

      invoice.status = InvoiceStatus.PAID;
      invoice.paidAt = new Date();

      return this.invoiceRepository.save(invoice);
    }

    throw new ConflictException(`Cannot change invoice status to ${status}`);
  }

  remove(id: number) {
    return `This action removes a #${id} invoice`;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async markOverdueInvoices() {
    const today = new Date().toISOString().split('T')[0];

    await this.invoiceRepository
      .createQueryBuilder()
      .update(Invoice)
      .set({status: InvoiceStatus.OVERDUE})
      .where('status = :status', {status: InvoiceStatus.PENDING})
      .andWhere('dueDate < :today', {today})
      .execute();
  }

}
