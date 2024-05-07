import { Module } from '@nestjs/common';
import { Route } from './entities/route/route';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteMapperService } from './services/route-mapper/route-mapper.service';
import { RouteService } from './services/route.service';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from './services/task.service';
import { RouteController } from './controllers/route/route.controller';
import { RouteDetailService } from './services/route-detail.service';
import { RouteDetailMapperService } from './services/route-detail-mapper/route-detail-mapper.service';
import { RouteDetail } from './entities/route-detail/route-detail';
import { RouteDetailController } from './controllers/route-detail/route-detail.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Route, RouteDetail]),
        HttpModule
    ],
    providers: [RouteMapperService, RouteService, TaskService, RouteDetailService, RouteDetailMapperService],
    controllers: [RouteController, RouteDetailController]
})
export class RoutesModule {}

