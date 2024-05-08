import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RouteDetailService } from "src/routes/services/route-detail.service";
import { RouteService } from "src/routes/services/route.service";
import { CronService } from "src/routes/services/cron.service";
import { v4 as uuid } from 'uuid';

@ApiTags('Route Details')
@Controller('routeDetail')
export class RouteDetailController {
        
    public constructor(
        private routeService: RouteService,
        private taskService: CronService,
        private routeDetailService: RouteDetailService
    ){}

    // @ApiBody({
    //     type: RouteInformationDto
    // })
    // @Post()
    // async calculaterouteDetailsInformation(@Body() routeInformationBody: RouteInformationDto){
    //     console.log('TEST', routeInformationBody)
    //     // return from(this.routeService.getrouteDetailsInfo(routeInformationBody.originLatitude, routeInformationBody.originLongitude, routeInformationBody.destinationLatitude, routeInformationBody.destinationLongitude)).pipe(
    //     //     map(res => {return JSON.stringify(res.data)})
    //     // )
    // }

    @Get('/finAllrouteDetails')
    async findAllrouteDetails(){
        return this.routeDetailService.findAll();
    }

    @Get('/findAllrouteDetails/:routeId')
    async findAllrouteDetailsByRouteId(@Param('routeId') routeId: number){
        return this.routeDetailService.findByRouteId(routeId)
    }

    @Get('/findAllrouteDetails/:jobId')
    async findAllrouteDetailsByJobId(@Param('jobId') jobId: string){
        return this.routeDetailService.findByJobId(jobId)
    }    

    @Get()
    async calculateRouteDetailsInformation(){
        const jobUuid: string = uuid();
        this.routeService.getAllRouteDetails(jobUuid);
    }

}