import { Controller, Get, Param } from "@nestjs/common";
import { CronExpression } from "@nestjs/schedule";
import { RouteDetailService } from "src/routes/services/route-detail.service";
import { RouteService } from "src/routes/services/route.service";
import { TaskService } from "src/routes/services/task.service";
import { v4 as uuid } from 'uuid';

@Controller('routeDetail')
export class RouteDetailController {
        
    public constructor(
        private routeService: RouteService,
        private taskService: TaskService,
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

    @Get('/startCronJob')
    async startCronJob(){
        //TODO: change into EVERY_8_HOURS

        //TODO2: delete all jobs with the same name 

        //TODO3: E' importante ritornare il jobID 

        this.taskService.addCronJob('calculaterouteDetailsInformation', CronExpression.EVERY_10_SECONDS); //only for test run job exery 10 seconds 
        return "added task scheduled every 8 hours"
    }

    @Get('/stopCronJob')
    async stopCronJob(){
        this.taskService.stopCronJob('calculaterouteDetailsInformation');
    }


}