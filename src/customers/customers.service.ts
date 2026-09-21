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
    const { page, limit } = query;
    const skip = (page - 1) * limit;
    const [customers, totalCount] =
      await this.customerRepository.findAndCount({
        skip,
        take: limit,
        order: {
          id: 'DESC',
        },
      });
    const totalPages = Math.ceil(totalCount / limit);
    return {
      data: customers,
      meta: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    };
  }


  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {

    const customer = await this.findOne(id);

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
    return await this.customerRepository.save(customer);

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
