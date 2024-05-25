import { TimeSlotIdentifier } from "src/routes/types/types";
import { AddRouteDto } from "../route/add-route.dto";

export class AddRouteDetailDto {
    public readonly arcId: number;
    public readonly jobId: number;
    public readonly date: Date;
    public readonly distanceText: string;
    public readonly distanceValue: number;
    public readonly durationText: string;
    public readonly durationValue: number;
    public readonly staticDurationText: string;
    public readonly staticDurationValue: number;
    public readonly googleMapsPolyline: string;
    public readonly timeSlotIdentifier: TimeSlotIdentifier;

    public constructor(opts?: AddRouteDto){
        Object.assign(this, opts)
    }
}