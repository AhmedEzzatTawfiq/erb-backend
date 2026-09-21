import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Order } from './entities/order.entity';
import { OrderLine } from './entities/order-line.entity';

import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';

import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(OrderLine)
    private readonly orderLineRepository: Repository<OrderLine>,

    private readonly dataSource: DataSource,
  ) { }

  async create(createOrderDto: CreateOrderDto) {
    const { customerId, orderDate, paymentMethod, shippingAddress, lines } = createOrderDto;

    return this.dataSource.transaction(
      async (manager) => {
        const customer = await manager.findOne(Customer, {
          where: {
            id: customerId,
          },
        });

        if (!customer) {
          throw new NotFoundException('Customer not found');
        }

        // 1-Create order
        const order = manager.create(Order, {
          customerId,
          orderDate: new Date(orderDate),
          paymentMethod,
          shippingAddress,
          status: OrderStatus.PENDING,
          totalAmount: 0,
        });

        const savedOrder = await manager.save(order);

        let totalAmount = 0;

        const orderLines: OrderLine[] = [];

        // 2. Process order lines
        for (const line of lines) {
          const product = await manager.findOne(
            Product,
            {
              where: {
                id: line.productId,
              },
            },
          );

          if (!product) {
            throw new NotFoundException(`Product ${line.productId} not found`);
          }

          const unitPrice = Number(product.unitPrice);

          const subtotal = line.quantity * unitPrice;

          const discount = Number(line.discount ?? 0);

          if (discount > subtotal) {
            throw new ConflictException('Discount cannot be greater than line total');
          }

          const lineTotal = subtotal - discount;

          totalAmount += lineTotal;

          const orderLine = manager.create(OrderLine, {
            orderId: savedOrder.id,
            productId: product.id,
            quantity: line.quantity,
            unitPrice,
            discount,
          });

          orderLines.push(orderLine);
        }

        // 3-Save lines
        await manager.save(orderLines);

        // 4-Update order total
        savedOrder.totalAmount = totalAmount;

        return manager.save(savedOrder);
      },
    );
  }

  async findAll(query: GetOrdersQueryDto) {
    const { status, customerId, from, to } = query;

    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.customer', 'customer')
      .leftJoinAndSelect('order.lines', 'line')
      .leftJoinAndSelect('line.product', 'product');

    if (status) {
      queryBuilder.andWhere(
        'order.status = :status',
        { status },
      );
    }

    if (customerId) {
      queryBuilder.andWhere(
        'order.customerId = :customerId',
        { customerId },
      );
    }

    if (from) {
      queryBuilder.andWhere(
        'order.orderDate >= :from',
        { from },
      );
    }

    if (to) {
      queryBuilder.andWhere(
        'order.orderDate <= :to',
        { to },
      );
    }

    queryBuilder.orderBy('order.orderDate', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        customer: true,
        lines: {
          product: true,
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    Object.assign(order, updateOrderDto);

    return this.orderRepository.save(order);
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto) {
    const order = await this.findOne(id);

    const newStatus = updateOrderStatusDto.status;

    const allowedTransitions: Record<
      OrderStatus,
      OrderStatus[]
    > = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED],
      [OrderStatus.CONFIRMED]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
    };

    const allowedNextStatuses = allowedTransitions[order.status];

    if (!allowedNextStatuses.includes(newStatus)) {
      throw new ConflictException(`Cannot change order status from ${order.status} to ${newStatus}`);
    }

    order.status = newStatus;

    return this.orderRepository.save(order);
  }

  async remove(id: string) {
    const order = await this.findOne(id);

    if (order.status !== OrderStatus.PENDING) {
      throw new ConflictException('Only pending orders can be deleted');
    }

    return this.dataSource.transaction(
      async (manager) => {
        await manager.delete(OrderLine,
          {
            orderId: order.id,
          },
        );

        await manager.delete(Order,
          {
            id: order.id,
          },
        );

        return {
          message:'Order deleted successfully',
        };
      },
    );
  }

}
