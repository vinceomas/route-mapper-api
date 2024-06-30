import { BadRequestException, Body, Controller, Get, Param, Post, Res, UseGuards } from "@nestjs/common";
import { Response } from 'express';
import { ApiBearerAuth, ApiBody, ApiTags } from "@nestjs/swagger";
import { RouteDetailService } from "src/routes/services/route-detail.service";
import { v4 as uuid } from 'uuid';
import { TimeSlotIdentifier } from "src/routes/types/types";
import { AuthGuard } from "@nestjs/passport";

@ApiTags('Route Details')
@Controller('routeDetail')
export class RouteDetailController {
        
    public constructor(
        private routeDetailService: RouteDetailService
    ){}

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/finAllrouteDetails')
    async findAllrouteDetails(){
        return this.routeDetailService.findAll();
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/findAllrouteDetails/:arcId')
    async findAllrouteDetailsByArcId(@Param('arcId') arcId: number){
        return this.routeDetailService.findByArcId(arcId)
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/findAllrouteDetails/:jobId')
    async findAllrouteDetailsByJobId(@Param('jobId') jobId: string){
        return this.routeDetailService.findByJobId(jobId)
    }    

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/retrieveRouteDetails/:timeSlotIdentifier')
    async retrieveRouteDetails(@Param('timeSlotIdentifier') timeSlotIdentifier: TimeSlotIdentifier){
        const jobUuid: string = uuid();
        return this.routeDetailService.getAllRouteDetails(jobUuid, timeSlotIdentifier, true);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('/routeDetailsCsv')
    @ApiBody({
        schema: {
            type: 'array', 
            items: {
              type: 'string', 
              enum: Object.keys(TimeSlotIdentifier),
            },
            example: [
                "SEVEN_TO_NINE_AM", 
                "NINE_TO_ELEVEN_AM", 
                "ELEVEN_TO_TWELVE"
            ]
        },
    })
    async getRouteDetailsCsv(@Res() res: Response, @Body() timeSlotIdentifiers: TimeSlotIdentifier[]){
        if (!timeSlotIdentifiers.length) {
            throw new BadRequestException('timeSlotIdentifier array should not be empty');
        }
        const buffer = await this.routeDetailService.getRouteDetailsCsvBuffer(timeSlotIdentifiers);
        // Invio del file al client come download
        res.set({
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': 'attachment; filename=dati.xlsx',
        });
        res.send(buffer);
    }

}