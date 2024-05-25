import { Injectable } from '@nestjs/common';
import { Route } from 'src/routes/entities/route/route';
import { RouteDto } from 'src/routes/entities/route/route.dto';

@Injectable()
export class RouteMapperService {
    public modelRouteDto({id, arcId, originNodeId, destinationNodeId, originLatitude, originLongitude, destinationLatitude, destinationLongitude, enabled}: Route){
        return new RouteDto({id, arcId, originNodeId, destinationNodeId, originLatitude, originLongitude, destinationLatitude, destinationLongitude, enabled})
    }
}
