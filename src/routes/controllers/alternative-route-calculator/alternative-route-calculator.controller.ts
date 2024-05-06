import { Controller, Get, Param } from "@nestjs/common";
import { CronExpression } from "@nestjs/schedule";
import { AlternativeRouteService } from "src/routes/services/alternative-route.service";
import { RouteService } from "src/routes/services/route.service";
import { TaskService } from "src/routes/services/task.service";
import { v4 as uuid } from 'uuid';

@Controller('alternativeRouteInformation')
export class AlternativeRouteInformation {
        
    public constructor(
        private routeService: RouteService,
        private taskService: TaskService,
        private alternativeRouteService: AlternativeRouteService
    ){}

    // @ApiBody({
    //     type: RouteInformationDto
    // })
    // @Post()
    // async calculateAlternativeRouteInformation(@Body() routeInformationBody: RouteInformationDto){
    //     console.log('TEST', routeInformationBody)
    //     // return from(this.routeService.getAlternativeRouteInfo(routeInformationBody.originLatitude, routeInformationBody.originLongitude, routeInformationBody.destinationLatitude, routeInformationBody.destinationLongitude)).pipe(
    //     //     map(res => {return JSON.stringify(res.data)})
    //     // )
    // }

    @Get('/finAllAlternativeRoutes')
    async findAllAlternativeRoutes(){
        return this.alternativeRouteService.findAll();
    }

    @Get('/findAllAlternativeRoutes/:routeId')
    async findAllAlternativeRoutesByRouteId(@Param('routeId') routeId: number){
        return this.alternativeRouteService.findByRouteId(routeId)
    }

    @Get('/findAllAlternativeRoutes/:jobId')
    async findAllAlternativeRoutesByJobId(@Param('jobId') jobId: string){
        return this.alternativeRouteService.findByJobId(jobId)
    }
    

    @Get()
    async calculateAlternativeRouteInformation(){
        const jobUuid: string = uuid();
        this.routeService.getAllRouteAlternativesInformation(jobUuid);
    }

    @Get('/startCronJob')
    async startCronJob(){
        //TODO: change into EVERY_8_HOURS

        //TODO2: delete all jobs with the same name 

        //TODO3: E' importante ritornare il jobID 

        this.taskService.addCronJob('calculateAlternativeRouteInformation', CronExpression.EVERY_10_SECONDS); //only for test run job exery 10 seconds 
        return "added task scheduled every 8 hours"
    }

    @Get('/stopCronJob')
    async stopCronJob(){
        this.taskService.stopCronJob('calculateAlternativeRouteInformation');
    }


}