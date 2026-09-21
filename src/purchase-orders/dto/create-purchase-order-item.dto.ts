import {
  IsInt,
  IsNumber,
  IsUUID,
  Min,
} from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  unitPrice: number;
}