import { Injectable } from "@nestjs/common";
import { AlternativeRoute } from "src/routes/entities/alternative-route/alternative-route";
import { AlternativeRouteDto } from "src/routes/entities/alternative-route/alternative-route.dto";

@Injectable()
export class AlternativeRouteMapperSerivce{
    public modelAlternativeRouteDto({id, routeId, jobId, date, distanceText, distanceValue, durationText, durationValue}: AlternativeRoute){
        return new AlternativeRouteDto({id, routeId, jobId, date, distanceText, distanceValue, durationText, durationValue})
    }
}