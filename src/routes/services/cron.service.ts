import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import { RouteService } from "./route.service";
import { v4 as uuid } from 'uuid';
import { MailService } from "./mail.service";
import { RouteDetailService } from "./route-detail.service";
import { TimeSlotIdentifier } from "../types/types";
import {cronExpressionToTimeSlotMap} from "../cron-job.config"

@Injectable()
export class CronService {
    constructor(
        private schedulerRegistry: SchedulerRegistry,
        private routeDetailService: RouteDetailService,
        private mailService: MailService,
        private readonly logger: Logger
    ) {}

    addCronJob(name: string, timeSlotIdentifiersKey: TimeSlotIdentifier[]) {
        let cronJobsAdded: string[] = [];
        let cronJobsDiscarded: string[] = [];
        const timeSlotIdentifiers: number[] = timeSlotIdentifiersKey.map(key => TimeSlotIdentifier[key as unknown as keyof typeof TimeSlotIdentifier]);
        //Check if there is another cron job with the same name
        timeSlotIdentifiers.forEach(identifier => {
            const cronExpression = cronExpressionToTimeSlotMap[identifier].cronExpression;
            const currentCronJobName = `${name}+${cronExpression?.toString()}`;
            const cronJob = this.schedulerRegistry.doesExist("cron", currentCronJobName);
            if(cronJob){
                this.logger.log(`job ${name} già presente, occorre interrompere il job precedente per poterne creare uno nuovo`);
                cronJobsDiscarded.push(currentCronJobName);
            }else{
                const jobUuid: string = uuid();
                const job = new CronJob(cronExpressionToTimeSlotMap[identifier].cronExpression, (job) => {
                    this.routeDetailService.getAllRouteDetails(jobUuid, identifier);
                    this.mailService.sendMail(
                        `E' stato avviato il job ${name} in data ${new Date()}`,
                        'AVVIO CRON JOB'
                    )
                    this.logger.log(`E' stato avviato il job ${name} in data ${new Date()}`)
                });
            
                this.schedulerRegistry.addCronJob(currentCronJobName, job);
                job.start();

                cronJobsAdded.push(currentCronJobName);

                this.mailService.sendMail(
                    `E' stato aggiunto un nuovo job il ${new Date()} che verrà schedulato nei seguenti orrari: ${JSON.stringify(identifier)}`,
                    'AGGIUNTA NUOVO CRON JOB'
                )
            
                console.warn(
                `job ${name} added for time slot ${identifier}!`,
                );
            }
        })
        return {
            cronJobsAdded,
            cronJobsDiscarded
        }
    }

    stopCronJob(name: string){
        const existJob = this.schedulerRegistry.doesExist("cron", name)
        if(existJob){
            const job = this.schedulerRegistry.getCronJob(name);
            job.stop();
            this.schedulerRegistry.deleteCronJob(name);
        }else{
            this.logger.warn(
                `job ${name} not exist!`,
            );
        }
    }

    stopAllCronJob(){
        const jobs = this.schedulerRegistry.getCronJobs();
        jobs.forEach((job, key) => {
            job.stop();
            this.schedulerRegistry.deleteCronJob(key);
        });
    }

    getAllCronJob(){
        const jobs = this.schedulerRegistry.getCronJobs();
        return jobs.keys()
    }
}