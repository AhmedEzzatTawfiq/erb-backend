import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeeStatus } from './enums/employee-status.enum';
import { GetEmployeesQueryDto } from './dto/get-employees-query.dto';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,

  ) { }


  async create(createEmployeeDto: CreateEmployeeDto) {

    const { departmentId, ...employeeData } = createEmployeeDto;

    const department = await this.departmentRepository.findOne({
      where: {
        id: createEmployeeDto.departmentId,
      }
    })

    if (!department) {
      throw new NotFoundException('Department not found')
    }

    const existingEmployee = await this.employeeRepository.findOne({
      where: {
        email: createEmployeeDto.email
      }
    })

    if (existingEmployee) {
      throw new ConflictException('Employee with this email already exist')
    }

    const employee = this.employeeRepository.create({
      ...employeeData,
      departmentId,
      hireDate: new Date(createEmployeeDto.hireDate)
    })

    const savedEmployee = await this.employeeRepository.save(employee)

    return this.findOne(savedEmployee.id)
  }

  async findAll(query: GetEmployeesQueryDto) {
    const { status, departmentId, search, page, limit, sortField, sortOrder } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.department', 'department');

    if (status) {
      queryBuilder.andWhere('employee.status = :status', { status })
    }

    if (departmentId) {
      queryBuilder.andWhere('employee.departmentId = :departmentId', { departmentId })
    }

    if (search) {
      queryBuilder.andWhere('employee.name ILIKE :search OR employee.email ILIKE :search', { search: `%${search}%` })
    }

    //sorting
    const sortColumn = {
      name: 'employee.name',
      department: 'department.name',
      position: 'employee.jobTitle',
      hireDate: 'employee.hireDate',
      salary: 'employee.salary',
    }[sortField ?? 'hireDate'];

    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    queryBuilder
      .orderBy(sortColumn, order)
      .skip(skip)
      .take(limit)

    const [employees, total] = await queryBuilder.getManyAndCount()

    return {
      data: employees,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }

  }

  async findOne(id: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: {
        department: true,
      }
    })

    if (!employee) {
      throw new NotFoundException('Employee not found')
    }

    return employee;
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);

    if (updateEmployeeDto.email) {
      const existingEmployee = await this.employeeRepository.findOne({
        where: {
          email: updateEmployeeDto.email,
        }
      })

      if (existingEmployee && existingEmployee.id !== id) {
        throw new ConflictException('Employee with this email already exist')
      }

    }

    if (updateEmployeeDto.departmentId) {
      const department = await this.departmentRepository.findOne({
        where: {
          id: updateEmployeeDto.departmentId,
        }
      })

      if (!department) {
        throw new NotFoundException('Department not found')
      }

      employee.departmentId = updateEmployeeDto.departmentId;
    }

    const { departmentId, hireDate, ...employeeData } = updateEmployeeDto;

    Object.assign(employee, employeeData);

    if (hireDate) {
      employee.hireDate = new Date(hireDate)
    }

    return this.employeeRepository.save(employee)

  }

  async remove(id: string) {
    const employee = await this.findOne(id)

    employee.status = EmployeeStatus.INACTIVE;

    await this.employeeRepository.save(employee)

    return {
      message: 'Employee deactivated successfully'
    }
  }

}
