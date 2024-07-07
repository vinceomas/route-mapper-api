import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationDto {
    @ApiProperty({ description: 'Page number to retrieve' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    page?: number;

    @ApiProperty({ description: 'Item per page' })
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    @Min(1)
    limit?: number;
}