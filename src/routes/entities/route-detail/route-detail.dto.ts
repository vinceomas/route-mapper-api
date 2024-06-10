import { TimeSlotIdentifier } from "src/routes/types/types";
import { Route } from "../route/route";

export class RouteDetailDto {
    public readonly id: number;
    public readonly arcId: number;
    public readonly jobId: string;
    public readonly date: Date;
    public readonly distanceText: string;
    public readonly distanceValue: number;
    public readonly durationText: string;
    public readonly durationValue: number;
    public readonly staticDurationText: string;
    public readonly staticDurationValue: number;
    public readonly googleMapsPolyline: string;
    public readonly timeSlotIdentifier: TimeSlotIdentifier;
    public readonly route: Route;

    public constructor(opts?: RouteDetailDto){
        Object.assign(this, opts)
    }
}