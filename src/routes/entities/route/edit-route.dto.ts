import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

export class EditRouteDto{

    @IsString()
    @IsNotEmpty()
    public readonly arcId: number;

    @IsString()
    @IsNotEmpty()
    public readonly originNodeId: number;

    @IsString()
    @IsNotEmpty()
    public readonly destinationNodeId: number;

    @IsString()
    @IsNotEmpty()
    public readonly originLongitude: string;

    @IsString()
    @IsNotEmpty()
    public readonly originLatitude: string;

    @IsString()
    @IsNotEmpty()
    public readonly destinationLongitude: string;

    @IsString()
    @IsNotEmpty()
    public readonly destinationLatitude: string;

    @IsBoolean()
    public readonly enabled: boolean;

    public constructor(opts?: Partial<EditRouteDto>){
        Object.assign(this, opts);
    }
}