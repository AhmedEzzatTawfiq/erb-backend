import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}