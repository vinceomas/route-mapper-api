import { Controller, Get } from "@nestjs/common";
import { CronExpression } from "@nestjs/schedule";
import { ApiTags } from "@nestjs/swagger";
import { CronService } from "src/routes/services/cron.service";

@ApiTags('Cron Job')
@Controller('cronJob')
export class CronJobController{
    public constructor(
        private taskService: CronService
    ){}

    @Get('/startCronJob')
    async startCronJob(){
        //TODO3: E' importante ritornare il jobID 
        this.taskService.addCronJob('calculaterouteDetailsInformation', [CronExpression.EVERY_DAY_AT_7AM, CronExpression.EVERY_DAY_AT_9AM, CronExpression.EVERY_DAY_AT_NOON]); //only for test run job exery 10 seconds 
        return "added task scheduled every 8 hours"
    }

    @Get('/stopCronJob')
    async stopCronJob(){
        this.taskService.stopCronJob('calculaterouteDetailsInformation');
    }

    @Get('/stopAllCronJobs')
    async stopAllCronJobs(){
        this.taskService.stopAllCronJob();
    }
}