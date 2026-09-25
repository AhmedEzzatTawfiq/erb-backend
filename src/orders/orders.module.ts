import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from './entities/order.entity';
import { OrderLine } from './entities/order-line.entity';
import { InvoicesModule } from 'src/invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderLine]),
    InvoicesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
