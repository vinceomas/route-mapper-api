import { Injectable, NotFoundException } from "@nestjs/common";
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
import { Client } from "@googlemaps/google-maps-services-js";
import { AlternativeRouteService } from "./alternative-route.service";

@Injectable()
export class RouteService {
    public constructor(
        @InjectRepository(Route) private readonly routeRepository: Repository<Route>,
        private readonly routeMapper: RouteMapperService,
        private readonly httpService: HttpService,
        private readonly alternativeRoutesService: AlternativeRouteService
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

    public async add({originLatitude, originLongitude, destinationLatitude, destinationLongitude}: AddRouteDto): Promise<RouteDto>{
        let route = new Route(originLatitude, originLongitude, destinationLatitude, destinationLongitude)
        route = await this.routeRepository.save(route)
        return this.routeMapper.modelRouteDto(route)
    }

    public async edit(id: number, {originLatitude, originLongitude, destinationLatitude, destinationLongitude, enabled}: EditRouteDto): Promise<RouteDto>{
        let route = await this.routeRepository.findOne({where: {id}})
        if(isNullOrUndefined(route))
            throw new NotFoundException();
        
        route.enabled = enabled;
        route.originLatitude = originLatitude;
        route.originLongitude = originLongitude;
        route.destinationLatitude = destinationLatitude;
        route.destinationLongitude = destinationLongitude;

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

    public async getAlternativeRouteInfo(route: Route, jobId: string){
        const client = new Client({});

        console.log('RETRIEVE INFORMATION FOR ROUTE: ', {
            ...route,
            originLatitude: Number(route.originLatitude),
            originLongitude: Number(route.originLongitude),
            destinationLatitude: Number(route.destinationLatitude),
            destinationLongitude: Number(route.destinationLongitude)
        })

        client
        .directions({
            params: {
            origin:{
                lat: Number(route.originLatitude),
                lng: Number(route.originLongitude)
            },
            destination: {
                lat: Number(route.destinationLatitude),
                lng: Number(route.destinationLongitude)         
            },
            alternatives: true,
            key: 'AIzaSyCa2jbjuPvveaNLvXeOVf0uEPkCw2rb8Lo',
            },
            timeout: 3000, // milliseconds
        })
        .then((r) => {
            console.log('MIO TEST', r.data);
            r.data.routes.forEach(alternativeRoute => {
                this.alternativeRoutesService.add({
                    routeId: route.id,
                    jobId: jobId,
                    date: new Date(),
                    distanceText: alternativeRoute.legs[0].distance.text,
                    distanceValue: alternativeRoute.legs[0].distance.value,
                    durationText: alternativeRoute.legs[0].duration.text,
                    durationValue: alternativeRoute.legs[0].duration.value
                })
            })
        })
        .catch((e) => {
            console.log("ERRORE", e);
        });
    }

    public async getAllRouteAlternativesInformation(jobId: string){
        this.findAll().then(routes => {
            routes.forEach(route => {this.getAlternativeRouteInfo(route, jobId)})
        })
    }

    public async getRouteInfo(originLatitude: string, originLongitude: string, destinationLatitude: string, destinationLongitude: string){
        const apiKey = 'AIzaSyCa2jbjuPvveaNLvXeOVf0uEPkCw2rb8Lo'; // Inserisci qui la tua API key di Google Maps
        //const requestUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.latitude}&destinations=${destination}&key=${apiKey}`;
        const requestUrl = 'https://routes.googleapis.com/directions/v2:computeRoutes'
        const requestConfig: AxiosRequestConfig = {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask':'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline',
            },
            params: {               
                "origin":{
                    "location":{
                    "latLng":{
                        "latitude": originLatitude,
                        "longitude": originLongitude
                    }
                    }
                },
                "destination":{
                    "location":{
                    "latLng":{
                        "latitude": destinationLatitude,
                        "longitude": destinationLongitude
                    }
                    }
                },
                "travelMode": "DRIVE",
                "routingPreference": "TRAFFIC_AWARE",
                "departureTime": "2023-10-15T15:01:23.045123456Z",
                "computeAlternativeRoutes": false,
                "routeModifiers": {
                    "avoidTolls": false,
                    "avoidHighways": false,
                    "avoidFerries": false
                },
                "languageCode": "en-US",
                "units": "IMPERIAL"
                  
            },
          };

        return this.httpService.post(requestUrl, null, requestConfig)
            .pipe(
                map(response => {
                    const data = response.data;
                    if (data && data.rows && data.rows.length > 0 && data.rows[0].elements && data.rows[0].elements.length > 0) {
                        //const durationText = data.rows[0].elements[0].duration.text;
                        //const durationValue = data.rows[0].elements[0].duration.value; // Durata in secondi
                        //return durationValue;
                        return JSON.stringify(data)
                    } else {
                        throw new Error('Impossibile ottenere i tempi di percorrenza.');
                    }
                })
            )
            .toPromise()
            .catch(err => {
                console.log('ERROR', err);
                return 'ERROR'
            })
    }
}