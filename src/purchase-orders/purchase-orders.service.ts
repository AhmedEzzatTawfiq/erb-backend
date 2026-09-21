import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { PurchaseOrder } from './entities/purchase-order.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { ProductsService } from '../products/products.service';

import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchaseOrderItem } from './entities/purchase-order-item.entity';
import { PurchaseOrderStatus } from './enums/purchase-order-status.enum';
import { Product } from 'src/products/entities/product.entity';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,

    private readonly suppliersService: SuppliersService,

    private readonly productsService: ProductsService,

    private readonly dataSource: DataSource,
  ) { }

  async create(createPurchaseOrderDto: CreatePurchaseOrderDto) {
    const { supplierId, orderNumber, items } = createPurchaseOrderDto;

    await this.suppliersService.findOne(supplierId);

    return this.dataSource.transaction(
      async (manager) => {
        let totalAmount = 0;

        const purchaseOrder = manager.create(PurchaseOrder, {
          supplierId,
          orderNumber,
        });

        const savedPurchaseOrder = await manager.save(purchaseOrder);

        const purchaseOrderItems: PurchaseOrderItem[] = [];

        for (const item of items) {
          await this.productsService.findOne(item.productId);

          const totalPrice = item.quantity * item.unitPrice;

          totalAmount += totalPrice;

          const purchaseOrderItem = manager.create(PurchaseOrderItem, {
            purchaseOrderId: savedPurchaseOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice,
          });

          purchaseOrderItems.push(purchaseOrderItem);
        }

        await manager.save(purchaseOrderItems);

        savedPurchaseOrder.totalAmount = totalAmount;

        return manager.save(savedPurchaseOrder);
      },
    );
  }


  async findAll() {
    return this.purchaseOrderRepository.find({
      relations: {
        supplier: true,
        items: {
          product: true,
        },
      },
    });
  }

  async findOne(id: string) {
    const purchaseOrder =
      await this.purchaseOrderRepository.findOne({
        where: { id },
        relations: {
          supplier: true,
          items: {
            product: true,
          },
        },
      });

    if (!purchaseOrder) {
      throw new NotFoundException(
        'Purchase order not found',
      );
    }

    return purchaseOrder;
  }

  async update(
    id: string,
    updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    const purchaseOrder = await this.findOne(id);

    Object.assign(
      purchaseOrder,
      updatePurchaseOrderDto,
    );

    return this.purchaseOrderRepository.save(
      purchaseOrder,
    );
  }

  async remove(id: string) {
    const purchaseOrder = await this.findOne(id);

    await this.purchaseOrderRepository.remove(
      purchaseOrder,
    );

    return {
      message: 'Purchase order deleted successfully',
    };
  }

  async updateStatus(id: string, status: PurchaseOrderStatus) {
    const purchaseOrder = await this.findOne(id);
  
    if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
      throw new ConflictException(`Cannot change status from ${purchaseOrder.status}`);
    }
  
    if (status !== PurchaseOrderStatus.CANCELLED) {
      throw new ConflictException('Only cancellation is allowed through this endpoint');
    }
  
    purchaseOrder.status = status;
  
    return this.purchaseOrderRepository.save(purchaseOrder);
  }

  async receive(id: string) {
    const purchaseOrder = await this.findOne(id);
  
    if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
      throw new ConflictException(`Purchase order cannot be received from ${purchaseOrder.status} status`);
    }
  
    return this.dataSource.transaction(
      async (manager) => {
        for (const item of purchaseOrder.items) {
          const product = await manager.findOne(Product, {
            where: { id: item.productId },
          });
  
          if (!product) {
            throw new NotFoundException(`Product ${item.productId} not found`);
          }
  
          product.stockQuantity += item.quantity;
  
          await manager.save(Product, product);
        }
  
        purchaseOrder.status = PurchaseOrderStatus.RECEIVED;
  
        return manager.save(PurchaseOrder, purchaseOrder);
      },
    );
  }

}
