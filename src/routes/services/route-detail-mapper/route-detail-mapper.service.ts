import { Injectable } from "@nestjs/common";
import { RouteDetail } from "src/routes/entities/route-detail/route-detail";
import { RouteDetailDto } from "src/routes/entities/route-detail/route-detail.dto";

@Injectable()
export class RouteDetailMapperService{
    public modelRouteDetailDto({id, arcId, jobId, date, distanceText, distanceValue, durationText, durationValue, staticDurationText, staticDurationValue, googleMapsPolyline, timeSlotIdentifier, route}: RouteDetail){
        return new RouteDetailDto({id, arcId, jobId, date, distanceText, distanceValue, durationText, durationValue, staticDurationText, staticDurationValue, googleMapsPolyline, timeSlotIdentifier, route})
    }
}