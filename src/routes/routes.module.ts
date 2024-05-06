import { Module } from '@nestjs/common';
import { Route } from './entities/route/route';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteMapperService } from './services/route-mapper/route-mapper.service';
import { RouteService } from './services/route.service';
import { HttpModule } from '@nestjs/axios';
import { TaskService } from './services/task.service';
import { RouteController } from './controllers/route/route.controller';
import { AlternativeRouteService } from './services/alternative-route.service';
import { AlternativeRouteMapperSerivce } from './services/alternative-route-mapper/alternative.route-mapper.service';
import { AlternativeRoute } from './entities/alternative-route/alternative-route';
import { AlternativeRouteInformation } from './controllers/alternative-route-calculator/alternative-route-calculator.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Route, AlternativeRoute]),
        HttpModule
    ],
    providers: [RouteMapperService, RouteService, TaskService, AlternativeRouteService, AlternativeRouteMapperSerivce],
    controllers: [RouteController, AlternativeRouteInformation]
})
export class RoutesModule {}

