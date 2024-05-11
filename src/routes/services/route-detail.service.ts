import { InsertResult, Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";
import { Route } from "../entities/route/route";
import { Client, DirectionsResponse, DirectionsRoute } from "@googlemaps/google-maps-services-js";
import { ConfigService } from "@nestjs/config";
import { RouteService } from "./route.service";
import { Logger } from "@nestjs/common";

export class RouteDetailService {
    public constructor(
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        private readonly routeDetailMapper: RouteDetailMapperService,
        private readonly configService: ConfigService,
        private readonly routeService: RouteService,
        private readonly logger: Logger,
    ){}

    public async findAll(): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository.find();
        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async findByJobId(jobId: string): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository.find({where: {jobId}});
        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async findByArcId(arcId: number): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository.find({where: {arcId: arcId}});
        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async add(routeDetail: Partial<RouteDetail>): Promise<RouteDetail>{
        let currentRouteDetail = new RouteDetail(routeDetail.arcId, routeDetail.jobId, routeDetail.date, routeDetail.distanceText, routeDetail.distanceValue, routeDetail.durationText, routeDetail.durationValue,);
        currentRouteDetail = await this.routeDetailRepository.save(currentRouteDetail);
        return this.routeDetailMapper.modelRouteDetailDto(currentRouteDetail);
    }

    public async getAllRouteDetails(jobId: string){
        let routesDetailToAdd: Partial<RouteDetail>[][] = [];
        let matrixRow: Partial<RouteDetail>[] = [];
        const routes = await this.routeService.findAll();
        let index = 0;
        for(const route of routes){
            if ((index + 1) % 1000 === 0){
                this.logger.log(`CALCOLO DELLA ROUTE ${index}`);
            }
            index = index + 1;
            const routeDetail = await this.getRouteDetail(route, jobId);
            matrixRow.push(routeDetail);
            if(matrixRow.length > 2000){
                routesDetailToAdd.push(matrixRow);
                matrixRow = [];
            }
            //await this.add(routeDetail);
        }
        if(matrixRow.length > 0){
            routesDetailToAdd.push(matrixRow);
            matrixRow = [];
        }

        const insertOperations: Promise<InsertResult>[] = routesDetailToAdd.map((routesToAdd, index) => {
            this.logger.log(`Inserimento della trance: ${index}`)
            return this.routeDetailRepository.insert(routesToAdd as Route[]);
        })

        await Promise.all(insertOperations).then(insertOperationResults => {
            const routesDetailAdded = insertOperationResults.reduce((acc, insertResult) => acc + insertResult.generatedMaps.length, 0)
            this.logger.log(`PERCORSI AGGIUNTI: ${routesDetailAdded}`)
        })
    }

    private async getRouteDetail(route: Route, jobId: string): Promise<Partial<RouteDetail>>{
        const client = new Client({});

        try {
            const directionResponse = await client.directions({
                params: {
                    origin: {
                        lat: Number(route.originLatitude),
                        lng: Number(route.originLongitude)
                    },
                    destination: {
                        lat: Number(route.destinationLatitude),
                        lng: Number(route.destinationLongitude)
                    },
                    alternatives: true,
                    key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
                },
                timeout: 3000, // milliseconds
            });
    
            const routeWithLowestTime: DirectionsRoute = directionResponse.data.routes.reduce((acc, cur) => {
                return cur.legs[0].duration.value < acc.legs[0].duration.value ? cur : acc;
            }, directionResponse.data.routes[0]);
    
            const routeDetail: Partial<RouteDetail> = {
                arcId: route.arcId,
                jobId: jobId,
                date: new Date(),
                distanceText: routeWithLowestTime.legs[0].distance.text,
                distanceValue: routeWithLowestTime.legs[0].distance.value,
                durationText: routeWithLowestTime.legs[0].duration.text,
                durationValue: routeWithLowestTime.legs[0].duration.value
            };
    
            //console.log('Elaborata la route con arcId', route.arcId);
            return routeDetail;
        } catch (err) {
            this.logger.error('ERRORE DURANTE IL PROCESSO DELLA ROUTE:');
            this.logger.error(err)
            throw err; // Rilancia l'errore per gestirlo esternamente, se necessario
        }
    }


}