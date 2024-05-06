import { RouteDto } from "../route/route.dto";

export class AlternativeRouteDto {
    public readonly id: number;
    public readonly routeId: number;
    public readonly jobId: string;
    public readonly date: Date;
    public readonly distanceText: string;
    public readonly distanceValue: number;
    public readonly durationText: string;
    public readonly durationValue: number;

    public constructor(opts?: AlternativeRouteDto){
        Object.assign(this, opts)
    }
}