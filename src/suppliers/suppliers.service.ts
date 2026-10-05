import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Supplier } from './entities/supplier.entity';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { GetSuppliersQueryDto } from './dto/get-suppliers-query.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async create(createSupplierDto: CreateSupplierDto) {
    const supplier = this.supplierRepository.create(createSupplierDto);

    return this.supplierRepository.save(supplier);
  }

  async findAll(query?: GetSuppliersQueryDto) {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search;
    const status = query?.status;
    const sortField = query?.sortField ?? 'companyName';
    const sortOrder = query?.sortOrder ?? 'asc';

    const skip = (page - 1) * limit;

    const queryBuilder = this.supplierRepository
      .createQueryBuilder('supplier')
      .where('(supplier.isDeleted = false OR supplier.isDeleted IS NULL)');

    if (search) {
      queryBuilder.andWhere(
        '(supplier.companyName ILIKE :search OR supplier.contactName ILIKE :search OR supplier.email ILIKE :search OR supplier.phone ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      queryBuilder.andWhere('supplier.status = :status', { status });
    }

    const direction = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const allowedSortFields = ['companyName', 'contactName', 'email', 'createdAt'];
    const orderColumn = allowedSortFields.includes(sortField) ? sortField : 'companyName';

    queryBuilder
      .orderBy(`supplier.${orderColumn}`, direction)
      .skip(skip)
      .take(limit);

    const [suppliers, total] = await queryBuilder.getManyAndCount();

    return {
      data: suppliers,
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
    const supplier = await this.supplierRepository
      .createQueryBuilder('supplier')
      .where('supplier.id = :id', { id })
      .andWhere('(supplier.isDeleted = false OR supplier.isDeleted IS NULL)')
      .getOne();

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(id: string, updateSupplierDto: UpdateSupplierDto) {
    const supplier = await this.findOne(id);

    Object.assign(supplier, updateSupplierDto);

    return this.supplierRepository.save(supplier);
  }

  async remove(id: string) {
    const supplier = await this.findOne(id);

    supplier.isDeleted = true;
    await this.supplierRepository.save(supplier);

    return {
      message: 'Supplier deleted successfully',
    };
  }
}
