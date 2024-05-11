import { Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";
import { Route } from "../entities/route/route";
import { Client, DirectionsResponse, DirectionsRoute } from "@googlemaps/google-maps-services-js";
import { ConfigService } from "@nestjs/config";
import { RouteService } from "./route.service";

export class RouteDetailService {
    public constructor(
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        private readonly routeDetailMapper: RouteDetailMapperService,
        private readonly configService: ConfigService,
        private readonly routeService: RouteService
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
        const routes = await this.routeService.findAll();
        let index = 0;
        for(const route of routes){
            if ((index + 1) % 1000 === 0){
                console.log(`CALCOLO DELLA ROUTE ${index}`);
            }
            index = index + 1;
            const routeDetail = await this.getRouteDetail(route, jobId);
            await this.add(routeDetail);
        }
        // await this.routeService.findAll().then(async routes => {
        //     const routeCount = routes.length;
        //     console.log('NUMERO DI ROUTES DA CALCOLARE', routeCount)
        //     await Promise.all(
        //         routes.map(async (route, index) => {
        //             if ((index + 1) % 1000 === 0){
        //                 console.log(`CALCOLO DELLA ROUTE ${index}`);
        //             }
        //             return this.getRouteDetail(route, jobId)
        //         })
        //     ).then(async directionResponse => {
        //         await Promise.all(
        //             directionResponse.map(async (routeDetail, index) => {
        //                 if ((index + 1) % 1000 === 0){
        //                     console.log(`INSERIMENTO DELLA ROUTE ${index}`);
        //                 }
        //                 return this.add(routeDetail);
        //             })
        //         )
        //     })
        //     // return await Promise.all(
        //     //     routes.map(async (route, index) => {
        //     //         if ((index + 1) % 1000 === 0){
        //     //             console.log(`CALCOLO DELLA ROUTE ${index}`);
        //     //         }
        //     //         await this.getRouteDetail(route, jobId);
        //     //         await this.getRouteDetail(route, jobId).then(async directionResponse => {
        //     //             const routeWithLowestTime: DirectionsRoute = directionResponse.data.routes.reduce((acc, cur) => {
        //     //                 return cur.legs[0].duration.value < acc.legs[0].duration.value ? cur : acc
        //     //             }, directionResponse.data.routes[0])
        //     //             await this.add({
        //     //                 arcId: route.arcId,
        //     //                 jobId: jobId, 
        //     //                 date: new Date(),
        //     //                 distanceText: routeWithLowestTime.legs[0].distance.text,
        //     //                 distanceValue: routeWithLowestTime.legs[0].distance.value,
        //     //                 durationText: routeWithLowestTime.legs[0].duration.text,
        //     //                 durationValue: routeWithLowestTime.legs[0].duration.value
        //     //             })
        //     //         })
        //     //         .catch(err => {
        //     //             console.log('ERRORE DURANTE IL PROCESSO DELLA ROPUTE', index)
        //     //         })
        //     //     })
        //     // )
        // })
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
            console.error('ERRORE DURANTE IL PROCESSO DELLA ROUTE:', err);
            throw err; // Rilancia l'errore per gestirlo esternamente, se necessario
        }
    }


}