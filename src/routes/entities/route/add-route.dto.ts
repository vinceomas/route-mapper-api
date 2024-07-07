import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class AddRouteDto {
    
    @IsInt()
    @IsNotEmpty()
    @ApiProperty({ description: 'Arc id' })
    public readonly arcId: number;

    @IsInt()
    @IsNotEmpty()
    @ApiProperty({ description: 'Origin Node Id' })
    public readonly originNodeId: number;

    @IsInt()
    @IsNotEmpty()
    @ApiProperty({ description: 'Destination Node Id' })
    public readonly destinationNodeId: number;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'Origin node latitude' })
    public readonly originLongitude: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'origin node longitude' })
    public readonly originLatitude: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'destination node longitude' })
    public readonly destinationLongitude: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({ description: 'destination node latitude' })
    public readonly destinationLatitude: string;
    
    public constructor(opts?: Partial<AddRouteDto>){
        Object.assign(this, opts)
    }
}