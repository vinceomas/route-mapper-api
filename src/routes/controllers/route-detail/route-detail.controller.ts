import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from 'express';
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

    @Get('/retrieveRouteDetails')
    async retrieveRouteDetails(){
        const jobUuid: string = uuid();
        return this.routeDetailService.getAllRouteDetails(jobUuid);
    }

    @Get('/downlodRouteDetailsCsv/:fromDate/:toDate')
    async downloadRouteDetailsCsv(@Param('fromDate') fromDate: Date, @Param('toDate') toDate: Date, @Res() res: Response){
        const buffer = await this.routeDetailService.getRouteWithDetailsCsv(fromDate, toDate);
        // Invio del file al client come download
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=dati.xlsx',
        });
        res.send(buffer);
    }

}