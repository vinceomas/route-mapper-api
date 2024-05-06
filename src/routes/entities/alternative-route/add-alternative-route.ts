import { AddRouteDto } from "../route/add-route.dto";

export class AddAlternativeRouteDto {
    public readonly routeId: number;
    public readonly jobId: number;
    public readonly date: Date;
    public readonly distanceText: string;
    public readonly distanceValue: number;
    public readonly durationText: string;
    public readonly durationValue: number;

    public constructor(opts?: AddRouteDto){
        Object.assign(this, opts)
    }
}