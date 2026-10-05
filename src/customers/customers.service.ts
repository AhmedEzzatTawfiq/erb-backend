import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) { }

  async create(createCustomerDto: CreateCustomerDto) {
    const existingCustomer = await this.customerRepository.findOne({
      where: [
        { email: createCustomerDto.email },
      ],
    });
    if (existingCustomer) {
      throw new ConflictException(
        'Customer with this email already exists',
      );
    }
    const customer = await this.customerRepository.save(createCustomerDto);
    return customer;
  }

  async findAll(query: GetCustomersQueryDto) {
    const { page = 1, limit = 10, search, sortField = 'companyName', sortOrder = 'asc' } = query;

    // Sorting
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select([
        'customer.id',
        'customer.companyName',
        'customer.contactName',
        'customer.email',
        'customer.avatar',
        'customer.phone',
        'customer.address',
        'customer.city',
        'customer.country',
        'customer.taxId',
        'customer.isDeleted',
        'customer.createdAt',
        'customer.updatedAt',
      ])
      .addSelect('COUNT(order.id)', 'orders')
      .addSelect(
        'COALESCE(SUM(order.totalAmount), 0)',
        'totalSpent',
      )
      .where('customer.isDeleted = false');

    if (search) {
      queryBuilder.andWhere(
        `(
        customer.companyName ILIKE :search
        OR customer.contactName ILIKE :search
        OR customer.email ILIKE :search
        OR customer.phone ILIKE :search
      )`,
        { search: `%${search}%` },
      );
    }

    queryBuilder.groupBy('customer.id');


    const direction = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    if (sortField === 'orders') {
      queryBuilder.orderBy(
        'COUNT(order.id)',
        direction
      );
    } else if (sortField === 'totalSpent') {
      queryBuilder.orderBy(
        'COALESCE(SUM(order.totalAmount), 0)',
        direction
      );
    } else {
      const allowedSortFields = [
        'companyName',
        'contactName',
        'email',
        'phone',
        'city',
        'country',
        'createdAt',
      ];

      const field = allowedSortFields.includes(sortField)
        ? sortField
        : 'companyName';

      queryBuilder.orderBy(
        `customer.${field}`,
        direction
      );
    }


    // Pagination
    queryBuilder
      .skip((page - 1) * limit)
      .take(limit);

    const rawData = await queryBuilder.getRawMany();

    const data = rawData.map((item) => ({
      id: item.customer_id,
      companyName: item.customer_companyName,
      contactName: item.customer_contactName,
      email: item.customer_email,
      avatar: item.customer_avatar,
      phone: item.customer_phone,
      address: item.customer_address,
      city: item.customer_city,
      country: item.customer_country,
      taxId: item.customer_taxId,
      isDeleted: item.customer_isDeleted,
      createdAt: item.customer_createdAt,
      updatedAt: item.customer_updatedAt,

      orders: Number(item.orders),
      totalSpent: Number(item.totalSpent),
    }));

    const countQuery = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.isDeleted = false');


    if (search) {
      countQuery.andWhere(
        `(
        customer.companyName ILIKE :search
        OR customer.contactName ILIKE :search
        OR customer.email ILIKE :search
        OR customer.phone ILIKE :search
      )`,
        { search: `%${search}%` },
      );
    }

    const totalCount = await countQuery.getCount();

    return {
      data,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }


  async findOne(id: string) {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.orders', 'order')
      .select([
        'customer.id',
        'customer.companyName',
        'customer.contactName',
        'customer.email',
        'customer.avatar',
        'customer.phone',
        'customer.address',
        'customer.city',
        'customer.country',
        'customer.taxId',
        'customer.isDeleted',
        'customer.createdAt',
        'customer.updatedAt',
      ])
      .addSelect('COUNT(order.id)', 'orders')
      .addSelect(
        'COALESCE(SUM(order.totalAmount), 0)',
        'totalSpent',
      )
      .where('customer.id = :id', { id })
      .andWhere('customer.isDeleted = false')
      .groupBy('customer.id');

    const result = await queryBuilder.getRawOne();

    if (!result) {
      throw new NotFoundException('Customer not found');
    }

    return {
      id: result.customer_id,
      companyName: result.customer_companyName,
      contactName: result.customer_contactName,
      email: result.customer_email,
      avatar: result.customer_avatar,
      phone: result.customer_phone,
      address: result.customer_address,
      city: result.customer_city,
      country: result.customer_country,
      taxId: result.customer_taxId,
      isDeleted: result.customer_isDeleted,
      createdAt: result.customer_createdAt,
      updatedAt: result.customer_updatedAt,
      orders: Number(result.orders),
      totalSpent: Number(result.totalSpent),
    };
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.customerRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (updateCustomerDto.email) {
      const existingCustomer = await this.customerRepository.findOne({
        where: [
          { email: updateCustomerDto.email },
        ],
      });
      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException(
          'Customer with this email already exists',
        );
      }
    }

    Object.assign(customer, updateCustomerDto);
    await this.customerRepository.save(customer);

    return this.findOne(id);
  }

  async remove(id: string) {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.customerRepository.remove(customer);

    return {
      message: 'Customer deleted successfully',
    };
  }

}
