import { IsInt, IsNumber, IsPositive, IsUUID, Min } from "class-validator";

export class CreateOrderLineDto {
    @IsUUID()
    productId: string;

    @IsInt()
    @IsPositive()
    quantity: number;

    @IsNumber({maxDecimalPlaces: 2})
    @IsPositive()
    unitPrice: number;

    @IsNumber({maxDecimalPlaces: 2})
    @Min(0)
    discount: number;
}