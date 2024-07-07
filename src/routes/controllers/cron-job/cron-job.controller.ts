import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CronExpression } from "@nestjs/schedule";
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { CronService } from "src/routes/services/cron.service";
import { CronExpresionToTimeSlotMap, TimeSlotIdentifier } from "src/routes/types/types";

@ApiTags('Cron Job')
@Controller('cronJob')
export class CronJobController{
    public constructor(
        private cronService: CronService
    ){}

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('/start')
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
    async startCronJob(@Body() timeSlotIdentifiers: TimeSlotIdentifier[]){
        return this.cronService.addCronJob('calculaterouteDetailsInformation', timeSlotIdentifiers);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @ApiQuery({ name: 'jobName', required: false })
    @Delete(':jobName')
    public stopCronJob(@Query('jobName') jobName: string = undefined){
        if(jobName){
            return this.cronService.stopCronJob(jobName);
        }else{
            return this.cronService.stopAllCronJob();
        }
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get('/')
    async getAll(){
        const jobNames =  Array.from(this.cronService.getAllCronJob());
        if(!jobNames.length){
            return "No cron jobs found";
        }
        return jobNames;
    }
}