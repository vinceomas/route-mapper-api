export class RouteDto {
    public readonly id: number;
    public readonly arcId: number;
    public readonly originNodeId: number;
    public readonly destinationNodeId: number;
    public readonly originLongitude: string;
    public readonly originLatitude: string;
    public readonly destinationLongitude: string;
    public readonly destinationLatitude: string;
    public readonly googleMapsRouteIdentifier: string | null;
    public readonly enabled: boolean;

    public constructor(opts?: Partial<RouteDto>){
        Object.assign(this, opts);
    }
}