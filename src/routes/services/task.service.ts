import { Injectable } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { RouteService } from "./route.service";
import { v4 as uuid } from 'uuid';

@Injectable()
export class TaskService {
    constructor(
        private schedulerRegistry: SchedulerRegistry,
        private routeService: RouteService,
    ) {

    }
    //QUESTIO JOB VIENE AVVIATO DIRETTAMENTE ALL'AVVIO DEL SERVER 
    //   @Cron(CronExpression.EVERY_8_HOURS)
    //   handleEvery8Hours() {
    //     console.log('Task executed every 8 hours');
    //   }

    //QUESTO JOB VIENE AVVIATO DIRETTAMENTE ALL'AVIO DEL SERVER 
    //   @Cron('45 * * * * *')
    //   handleEvery45Seconds() {
    //     console.log('Task executed every 45 seconds');
    //   }

    //QUESTO è UN JOB DINAMICO CHE PUò ESSERE GENERATO A PARTIRE DA UNA CHIAMATA API 
    addCronJob(name: string, cronExpression: CronExpression) {
        //Check if there is another cron job with the same name
        const existJob = this.schedulerRegistry.doesExist("cron", name)
        if(existJob){                
            console.warn(
            `job ${name} già presente, occorre interrompere il job precedente per poterne creare uno nuovo`,
            );
        }else{
            const jobUuid: string = uuid();
            const job = new CronJob(cronExpression, () => {
                this.routeService.getAllRouteAlternativesInformation(jobUuid);
                console.warn(`time (${cronExpression}) for job ${name} to run!`);
            });
        
            this.schedulerRegistry.addCronJob(name, job);
            job.start();
        
            console.warn(
            `job ${name} added for each minute at ${cronExpression} seconds!`,
            );
        }
    }

    stopCronJob(name: string){
        const existJob = this.schedulerRegistry.doesExist("cron", name)
        if(existJob){
            const job = this.schedulerRegistry.getCronJob(name);
            job.stop();
        }else{
            console.warn(
                `job ${name} not exist!`,
            );
        }
    }
}