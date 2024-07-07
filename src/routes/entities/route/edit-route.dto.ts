import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsNotEmpty, IsString } from "class-validator";

export class EditRouteDto{

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

    @IsBoolean()
    @ApiProperty({ description: 'Arc enabled for data extraction' })
    public readonly enabled: boolean;

    public constructor(opts?: Partial<EditRouteDto>){
        Object.assign(this, opts);
    }
}