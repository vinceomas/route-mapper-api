import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { CronExpression } from "@nestjs/schedule";
import { ApiTags } from "@nestjs/swagger";
import { CronService } from "src/routes/services/cron.service";
import { CronExpresionToTimeSlotMap, TimeSlotIdentifier } from "src/routes/types/types";

@ApiTags('Cron Job')
@Controller('cronJob')
export class CronJobController{
    public constructor(
        private cronService: CronService
    ){}

    @UseGuards(AuthGuard('jwt'))
    @Get('/startCronJob')
    async startCronJob(){
        const cronExpressionToTimeSlotMap: CronExpresionToTimeSlotMap = {
            [TimeSlotIdentifier.SEVEN_TO_NINE_AM]: CronExpression.EVERY_DAY_AT_7AM,
            [TimeSlotIdentifier.NINE_TO_ELEVEN_AM]: CronExpression.EVERY_DAY_AT_9AM,
            [TimeSlotIdentifier.ELEVEN_TO_TWELVE]: CronExpression.EVERY_DAY_AT_NOON
        }
        //TODO3: E' importante ritornare il jobID 
        this.cronService.addCronJob('calculaterouteDetailsInformation', cronExpressionToTimeSlotMap); //only for test run job exery 10 seconds 
        //this.taskService.addCronJob('calculaterouteDetailsInformation', [CronExpression.EVERY_DAY_AT_7AM, CronExpression.EVERY_DAY_AT_9AM, CronExpression.EVERY_DAY_AT_NOON]);
        return "added task scheduled every 8 hours"
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/stopCronJob')
    async stopCronJob(){
        this.cronService.stopCronJob('calculaterouteDetailsInformation');
    }

    @UseGuards(AuthGuard('jwt'))
    @Get('/stopAllCronJobs')
    async stopAllCronJobs(){
        this.cronService.stopAllCronJob();
    }
}