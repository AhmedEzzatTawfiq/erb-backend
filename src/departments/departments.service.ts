import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from 'src/employees/entities/employee.entity';
import { Department } from './entities/department.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DepartmentsService {

  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,

    @InjectRepository(Department)
    private readonly departmentRepository: Repository<Department>,
  ) { }

  async create(createDepartmentDto: CreateDepartmentDto) {
    const existngDepartment = await this.departmentRepository.findOne({
      where: {
        name: createDepartmentDto.name,
      }
    })

    if(existngDepartment){
      throw new ConflictException('Department already exist')
    }

    const department = this.departmentRepository.create(createDepartmentDto)

    return this.departmentRepository.save(department)
  }

  async findAll() {
    return this.departmentRepository.find({
      order: {
        name: 'ASC',
      }
    })
  }

  async findOne(id: string) {
    const department = await this.departmentRepository.findOne({
      where: {id},
      relations: {
        employees: true,
      }
    });

    if(!department) {
      throw new NotFoundException('Department not found')
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.departmentRepository.findOne({
      where: { id }
    })

    if(!department){
      throw new NotFoundException('Department Not Found');
    }

    if(updateDepartmentDto.name) {
      const existngDepartment = await this.departmentRepository.findOne({
        where: {
          name: updateDepartmentDto.name,
        }
      })

      if(existngDepartment && existngDepartment.id !== id) {
        throw new ConflictException('Department already exist')
      }
    }

    Object.assign(department, updateDepartmentDto)

    return this.departmentRepository.save(department)
  }

  async remove(id: string) {
    const department = await this.departmentRepository.findOne({
      where: { id }
    })

    if(!department){
      throw new NotFoundException('Department Not Found');
    }

    const employeeCount = await this.employeeRepository.count({
      where: {
        departmentId: id,
      }
    })

    if(employeeCount > 0) {
      throw new ConflictException('Cannot delete a department that has employees')
    }

    await this.departmentRepository.remove(department)

    return {
      message: 'Department deleted successfully',
    }
  }
}
