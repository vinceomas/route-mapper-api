import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RouteDetailService } from "src/routes/services/route-detail.service";
import { v4 as uuid } from 'uuid';

@ApiTags('Route Details')
@Controller('routeDetail')
export class RouteDetailController {
        
    public constructor(
        private routeDetailService: RouteDetailService
    ){}

    @Get('/finAllrouteDetails')
    async findAllrouteDetails(){
        return this.routeDetailService.findAll();
    }

    @Get('/findAllrouteDetails/:arcId')
    async findAllrouteDetailsByArcId(@Param('arcId') arcId: number){
        return this.routeDetailService.findByArcId(arcId)
    }

    @Get('/findAllrouteDetails/:jobId')
    async findAllrouteDetailsByJobId(@Param('jobId') jobId: string){
        return this.routeDetailService.findByJobId(jobId)
    }    

    @Get('/calculateRouteDetailsInformation')
    async calculateRouteDetailsInformation(){
        const jobUuid: string = uuid();
        return this.routeDetailService.getAllRouteDetails(jobUuid);
    }

}