import { IsMongoId, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty()
  @IsMongoId()
  productId!: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  quantity!: number;
}

export class MergeCartDto {
  @ApiProperty({ type: [Object] })
  items!: { productId: string; quantity: number }[];
}
