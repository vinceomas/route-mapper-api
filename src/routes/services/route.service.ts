import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Route } from "../entities/route/route";
import { RouteMapperService } from "./route-mapper/route-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDto } from "../entities/route/route.dto";
import { Repository } from "typeorm";
import { isNullOrUndefined } from "util";
import { AddRouteDto } from "../entities/route/add-route.dto";
import { EditRouteDto } from "../entities/route/edit-route.dto";
import { HttpService } from "@nestjs/axios";
import { map } from "rxjs";
import { AxiosRequestConfig } from "axios";
import { Client, DirectionsResponseData, DirectionsRoute } from "@googlemaps/google-maps-services-js";
import { RouteDetailService } from "./route-detail.service";
import { ConfigService } from "@nestjs/config";
import { RouteDetail } from "../entities/route-detail/route-detail";

@Injectable()
export class RouteService {
    public constructor(
        @InjectRepository(Route) private readonly routeRepository: Repository<Route>,
        private readonly routeMapper: RouteMapperService,
        private readonly logger: Logger,
    ){}

    public async findAll(): Promise<RouteDto[]>{
        const routes = await this.routeRepository.find();
        return routes.map(this.routeMapper.modelRouteDto)
    }

    public async findOne(id: number): Promise<RouteDto>{
        const route = await this.routeRepository.findOne({where: {id}});
        if(isNullOrUndefined(route))
            throw new NotFoundException();
        return this.routeMapper.modelRouteDto(route);
    }

    public async add({arcId, originNodeId, destinationNodeId, originLatitude, originLongitude, destinationLatitude, destinationLongitude}: AddRouteDto): Promise<RouteDto>{
        let route = new Route(arcId, originNodeId, destinationNodeId, originLatitude, originLongitude, destinationLatitude, destinationLongitude)
        route = await this.routeRepository.save(route)
        return this.routeMapper.modelRouteDto(route)
    }

    public async addMany(routeToAdd: Route[]){
        return await this.routeRepository.insert(routeToAdd);
    }    

    public async edit(id: number, {originLatitude, originLongitude, destinationLatitude, destinationLongitude, googleMapsRouteIdentifier, enabled}: EditRouteDto): Promise<RouteDto>{
        let route = await this.routeRepository.findOne({where: {id}})
        if(isNullOrUndefined(route))
            throw new NotFoundException();
        
        route.enabled = enabled;
        route.originLatitude = originLatitude;
        route.originLongitude = originLongitude;
        route.destinationLatitude = destinationLatitude;
        route.destinationLongitude = destinationLongitude;
        route.googleMapsRouteIdentifier = googleMapsRouteIdentifier

        route = await this.routeRepository.save(route);

        return this.routeMapper.modelRouteDto(route);
    }

    public async remove(id: number): Promise<Route>{
        let route = await this.routeRepository.findOne({where: {id}});
        if(isNullOrUndefined(route))
            throw new NotFoundException();

        route = await this.routeRepository.remove(route);

        return route;
    }

    public async deleteAllRoutes(): Promise<number>{
        const countRouteToDelete = this.routeRepository.count();
        await this.routeRepository.clear()
        return countRouteToDelete;
    }
}