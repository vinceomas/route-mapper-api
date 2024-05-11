import { Injectable } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { RouteService } from "./route.service";
import { v4 as uuid } from 'uuid';
import { MailService } from "./mail.service";
import { RouteDetailService } from "./route-detail.service";

@Injectable()
export class CronService {
    constructor(
        private schedulerRegistry: SchedulerRegistry,
        private routeDetailService: RouteDetailService,
        private mailService: MailService
    ) {}

    //QUESTO è UN JOB DINAMICO CHE PUò ESSERE GENERATO A PARTIRE DA UNA CHIAMATA API 
    addCronJob(name: string, cronExpressions: CronExpression[]) {
        //Check if there is another cron job with the same name
        let existJob = false;
        cronExpressions.forEach((cronExpression) => existJob = this.schedulerRegistry.doesExist("cron", `name+${cronExpression.toString()}`)) 
        if(existJob){                
            console.warn(
            `job ${name} già presente, occorre interrompere il job precedente per poterne creare uno nuovo`,
            );
        }else{
            const jobUuid: string = uuid();
            cronExpressions.forEach(cronExpression => {
                const job = new CronJob(cronExpression, (job) => {
                    this.routeDetailService.getAllRouteDetails(jobUuid);
                    this.mailService.sendMail(
                        `E' stato avviato il job ${name} in data ${new Date()}`,
                        'AVVIO CRON JOB'
                    )
                    console.warn(`time (${cronExpression}) for job ${name} to run!`);
                });
            
                this.schedulerRegistry.addCronJob(`name+${cronExpression.toString()}`, job);
                job.start();
            
                console.warn(
                `job ${name} added for ${cronExpression}!`,
                );
            }); 
            this.mailService.sendMail(
                `E' stato aggiunto un nuovo job il ${new Date()} che verrà schedulato nei seguenti orrari: ${JSON.stringify(cronExpressions)}`,
                'AGGIUNTA NUOVO CRON JOB'
            )
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

    stopAllCronJob(){
        const jobs = this.schedulerRegistry.getCronJobs();
        jobs.forEach(job => job.stop());
    }
}