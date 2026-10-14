import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query,
  UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';

import { SuppliersService } from './suppliers.service';

import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { GetSuppliersQueryDto } from './dto/get-suppliers-query.dto';

@Controller('suppliers')
export class SuppliersController {
  constructor(
    private readonly suppliersService: SuppliersService,
  ) { }

  @Post()
  create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(
      createSupplierDto,
    );
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Image size should be less than 5MB'
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          })
        ]
      })
    )
    file: Express.Multer.File
  ) {

    if (!file) {
      throw new BadRequestException('No image uploaded');
    }

    return this.suppliersService.uploadAvatar(id, file);
  }

  @Delete(':id/avatar')
  async deleteAvatar(
    @Param('id') id: string,
  ) {
    return this.suppliersService.deleteAvatar(id);
  }

  @Get()
  findAll(@Query() query: GetSuppliersQueryDto) {
    return this.suppliersService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(
      id,
      updateSupplierDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
