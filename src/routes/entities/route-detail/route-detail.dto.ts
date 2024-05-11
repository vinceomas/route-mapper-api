import { TimeSlotIdentifier } from "src/routes/types/types";

export class RouteDetailDto {
    public readonly id: number;
    public readonly arcId: number;
    public readonly jobId: string;
    public readonly date: Date;
    public readonly distanceText: string;
    public readonly distanceValue: number;
    public readonly durationText: string;
    public readonly durationValue: number;
    public readonly timeSlotIdentifier: TimeSlotIdentifier;

    public constructor(opts?: RouteDetailDto){
        Object.assign(this, opts)
    }
}