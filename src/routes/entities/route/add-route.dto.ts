export class AddRouteDto {
    public readonly arcId: number;
    public readonly originNodeId: number;
    public readonly destinationNodeId: number;
    public readonly originLongitude: string;
    public readonly originLatitude: string;
    public readonly destinationLongitude: string;
    public readonly destinationLatitude: string;
    
    public constructor(opts?: Partial<AddRouteDto>){
        Object.assign(this, opts)
    }
}