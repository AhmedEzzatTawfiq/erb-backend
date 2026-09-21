import { ConflictException, Injectable, NotFoundException, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryBuilder, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { GetProductsQueryDto } from './dto/get-products-query.dto';
import { CategoriesService } from 'src/categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly categoriesService: CategoriesService,
  ) { }

  async create(createProductDto: CreateProductDto) {
    const existingProduct = await this.productRepository.findOne({
      where: {
        sku: createProductDto.sku,
      },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    await this.categoriesService.findOne(createProductDto.categoryId);

    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(query: GetProductsQueryDto) {
    const { page, limit, search, categoryId, lowStock } = query;

    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if(search) {
      queryBuilder.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    if (categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    if(lowStock) {
      queryBuilder.andWhere('product.stockQuantity <= product.reorderLevel');
    }

    queryBuilder
    .skip(skip)
    .take(limit)
    .orderBy('product.createdAt', 'DESC');

    const [products, total] = await queryBuilder.getManyAndCount();


    return {
      products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id);

    if (updateProductDto.sku) {
      const existingProduct = await this.productRepository.findOne({
        where: {
          sku: updateProductDto.sku,
        },
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    if (updateProductDto.categoryId) {
      await this.categoriesService.findOne(updateProductDto.categoryId);
    }

    Object.assign(product, updateProductDto);
    return await this.productRepository.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);

    await this.productRepository.softRemove(product);

    return {
      message: 'Product deleted successfully',
    };
  }

  async adjustStock(id: string, adjustStockDto: AdjustStockDto) {
    const product = await this.findOne(id);

    const newStock = product.stockQuantity + adjustStockDto.quantity;

    if (newStock < 0) {
      throw new ConflictException('Not Enough Stock');
    }

    product.stockQuantity = newStock;

    await this.productRepository.save(product);

    return {
      message: 'Stock adjusted successfully',
      product,
      newStock: product.stockQuantity,
    };
  }
}
