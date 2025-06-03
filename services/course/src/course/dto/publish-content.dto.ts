import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PublishContentDto {
  @ApiProperty({
    description: 'Дали съдържанието е публикувано',
    example: true,
  })
  @IsBoolean()
  isPublished: boolean;

  @ApiProperty({
    description: 'Коментар при публикуване',
    example: 'Одобрено след преглед от редактор',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
