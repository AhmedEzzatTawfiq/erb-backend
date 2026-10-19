import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { GetCustomersQueryDto } from './dto/get-customers-query.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,

    private readonly cloudinaryService: CloudinaryService,
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


  async uploadAvatar(id: string, file: Express.Multer.File) {

    const customer = await this.customerRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const oldPublicId = customer.avatarPublicId;

    const newAvatar = await this.cloudinaryService.uploadImage(file, 'erb/customers');

    try {

      customer.avatar = newAvatar.url;
      customer.avatarPublicId = newAvatar.publicId;

      const updatedCustomer = await this.customerRepository.save(customer);

      if (oldPublicId) {
        try {
          await this.cloudinaryService.deleteImage(oldPublicId);
        } catch (error) {
          console.error('Failed to delete old avatar:', error);
        }
      }

      return updatedCustomer;

    } catch (error) {
      await this.cloudinaryService.deleteImage(newAvatar.publicId);

      throw error;
    }

  }

  async deleteAvatar(id: string) {
    const customer = await this.customerRepository.findOne({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const oldPublicId = customer.avatarPublicId;

    if (!oldPublicId) {
      return customer;
    }

    try {
      await this.cloudinaryService.deleteImage(oldPublicId);

      customer.avatar = null;
      customer.avatarPublicId = null;

      await this.customerRepository.save(customer);

      return customer;

    } catch (error) {
      throw error;
    }
  }

  async findAll(query: GetCustomersQueryDto) {
    const { page = 1, limit = 10, search, status, sortField = 'companyName', sortOrder = 'asc' } = query;

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
        'customer.avatarPublicId',
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
      .where('1 = 1');

    if (status === 'active') {
      queryBuilder.andWhere('customer.isDeleted = false');
    } else if (status === 'inactive') {
      queryBuilder.andWhere('customer.isDeleted = true');
    }

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
    queryBuilder.offset((page - 1) * limit).limit(limit);

    const rawData = await queryBuilder.getRawMany();

    const data = rawData.map((item) => ({
      id: item.customer_id,
      companyName: item.customer_companyName,
      contactName: item.customer_contactName,
      email: item.customer_email,
      avatar: item.customer_avatar,
      avatarPublicId: item.customer_avatarPublicId,
      phone: item.customer_phone,
      address: item.customer_address,
      city: item.customer_city,
      country: item.customer_country,
      taxId: item.customer_taxId,
      isDeleted: item.customer_isDeleted,
      createdAt: item.customer_createdAt,
      updatedAt: item.customer_updatedAt,
      status: item.customer_isDeleted ? 'inactive' : 'active',
      orders: Number(item.orders),
      totalSpent: Number(item.totalSpent),
    }));


    const countQuery = this.customerRepository
      .createQueryBuilder('customer')
      .where('1 = 1');

    if (status === 'active') {
      countQuery.andWhere('customer.isDeleted = false');
    } else if (status === 'inactive') {
      countQuery.andWhere('customer.isDeleted = true');
    }

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
        'customer.avatarPublicId',
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
      avatarPublicId: result.customer_avatarPublicId,
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
      status: result.customer_isDeleted ? 'inactive' : 'active',
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
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    customer.isDeleted = true;

    await this.customerRepository.save(customer);

    return {
      message: 'Customer deactivated successfully',
    };
  }

}
