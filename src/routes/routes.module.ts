import { Logger, Module } from '@nestjs/common';
import { Route } from './entities/route/route';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteMapperService } from './services/route-mapper/route-mapper.service';
import { RouteService } from './services/route.service';
import { HttpModule } from '@nestjs/axios';
import { CronService } from './services/cron.service';
import { RouteController } from './controllers/route/route.controller';
import { RouteDetailService } from './services/route-detail.service';
import { RouteDetailMapperService } from './services/route-detail-mapper/route-detail-mapper.service';
import { RouteDetail } from './entities/route-detail/route-detail';
import { RouteDetailController } from './controllers/route-detail/route-detail.controller';
import { CronJobController } from './controllers/cron-job/cron-job.controller';
import { MailService } from './services/mail.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Route, RouteDetail]),
        HttpModule
    ],
    providers: [RouteMapperService, RouteService, CronService, RouteDetailService, RouteDetailMapperService, MailService, Logger],
    controllers: [RouteController, RouteDetailController, CronJobController]
})
export class RoutesModule {}

