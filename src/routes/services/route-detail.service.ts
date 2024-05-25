import { InsertResult, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";
import { Route } from "../entities/route/route";
import { AddressType, Client, DirectionsResponse, DirectionsRoute, GeocodedWaypointStatus, LatLngLiteral, Status, Time, TravelMode } from "@googlemaps/google-maps-services-js";
import { ConfigService } from "@nestjs/config";
import { RouteService } from "./route.service";
import { Injectable, Logger } from "@nestjs/common";
import { WorkSheet, read, utils, write } from 'xlsx';
import { TimeSlotIdentifier } from "../types/types";
import { MailService } from "./mail.service";
import { directions } from "@googlemaps/google-maps-services-js/dist/directions";
import { AxiosHeaders } from "axios";
import { RoutesClient } from "@googlemaps/routing/build/src/v2";
import { GoogleMapsApiHandler } from "./google-maps-api-handler.service";

@Injectable()
export class RouteDetailService {
    public constructor(
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        private readonly routeDetailMapper: RouteDetailMapperService,
        private readonly configService: ConfigService,
        private readonly routeService: RouteService,
        private readonly logger: Logger,
        private readonly mailService: MailService,
        private readonly googleMapsApiHandler: GoogleMapsApiHandler
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

    public async findByDateAndId(fromDate: Date, toDate: Date, arcId: number): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository
            .createQueryBuilder('entity')
            .where('entity.arcId = :arcId', { arcId })
            .andWhere('entity.date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
            .getMany();

        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async add(routeDetail: Partial<RouteDetail>): Promise<RouteDetail>{
        let currentRouteDetail = new RouteDetail(routeDetail.arcId, routeDetail.jobId, routeDetail.date, routeDetail.distanceText, routeDetail.distanceValue, routeDetail.durationText, routeDetail.durationValue, routeDetail.staticDurationText, routeDetail.staticDurationValue, routeDetail.googleMapsPolyline, routeDetail.timeSlotIdentifier);
        currentRouteDetail = await this.routeDetailRepository.save(currentRouteDetail);
        return this.routeDetailMapper.modelRouteDetailDto(currentRouteDetail);
    }

    public async getAllRouteDetails(jobId: string, timeSlotIdentifier: TimeSlotIdentifier){
        let routeMatrix: Route[][] = [];
        let routeMatrixRow: Route[] = [];
        let totalAddedRouteDetail = 0;

        let directionResponseByRouteIdMap: {[id: number]: number} = {}
        const routeArray = await this.routeService.findAllActivedRoutes();

        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        //Dividi le route in in pacchetti di 2000 elementi 
        for(const route of routeArray){
            routeMatrixRow.push(route);
            if(routeMatrixRow.length > 2000){
                routeMatrix.push(routeMatrixRow);
                routeMatrixRow = [];
            }
        }
        if(routeMatrixRow.length > 0){
            routeMatrix.push(routeMatrixRow);
            routeMatrixRow = [];
        }

        console.log(`Le route sono state divise in ${routeMatrix.length} trance`);

        let iterationIndex = 0;
        for(const matrixRow of routeMatrix){
            const rowPromises = matrixRow.map((route, index) => {
                directionResponseByRouteIdMap[index] = route.arcId;
                //const routeApiResponse = this.getDirectionsDetail(route, jobId, timeSlotIdentifier)
                return this.googleMapsApiHandler.getRouteDetails(route);
                //return this.googleMapsApiHandler.getFakeRouteDetails(route);
            });
            let routesToAdd: Partial<RouteDetail>[] = [];
            await Promise.all(rowPromises).then(directionsResponse => {
                routesToAdd = directionsResponse.map((dir, index) => {
                    this.logger.verbose(`Route API Response: ${JSON.stringify(dir)}`);
                    // const routeWithLowestTime: DirectionsRoute = dir.data.routes.reduce((acc, cur) => {
                    //     return cur.legs[0].duration.value < acc.legs[0].duration.value ? cur : acc;
                    // }, dir.data.routes[0]);
                    // return {
                    //     arcId: directionResponseByRouteIdMap[index],
                    //     jobId: jobId,
                    //     date: new Date(),
                    //     distanceText: routeWithLowestTime.legs[0].distance.text,
                    //     distanceValue: routeWithLowestTime.legs[0].distance.value,
                    //     durationText: routeWithLowestTime.legs[0].duration.text,
                    //     durationValue: routeWithLowestTime.legs[0].duration.value,
                    //     timeSlotIdentifier
                    // }
                    if(isNaN(dir[0].routes[0].duration.seconds as number))
                        this.logger.error(`IsNan duration value for route with arcId: ${directionResponseByRouteIdMap[index]}`)
                    if(isNaN(dir[0].routes[0].staticDuration.seconds as number))
                        this.logger.error(`IsNan staticDuration value for route with arcId: ${directionResponseByRouteIdMap[index]}`)
                    return {
                        arcId: directionResponseByRouteIdMap[index],
                        jobId: jobId,
                        date: new Date(),
                        distanceText: dir[0].routes[0].localizedValues.distance.text,
                        distanceValue: dir[0].routes[0].distanceMeters,
                        durationText: dir[0].routes[0].localizedValues.duration.text,
                        durationValue:dir[0].routes[0].duration.seconds as number,
                        staticDurationText: dir[0].routes[0].localizedValues.staticDuration.text,
                        staticDurationValue: dir[0].routes[0].staticDuration.seconds as number,
                        googleMapsPolyline: dir[0].routes[0].polyline.encodedPolyline,
                        timeSlotIdentifier
                    }
                });
            }).catch(err => {
                console.log('err', err)
                this.logger.error(`Error during fetch trance ${iterationIndex}: ${err}`)
            })

            await wait(60000)

            const insertOperations = this.routeDetailRepository.insert(routesToAdd);

            await insertOperations.then(insertResult => {
                console.log(`Inserimento della trance: ${iterationIndex}, sono stati inseriti ${insertResult.generatedMaps.length} elementi`);
                totalAddedRouteDetail = totalAddedRouteDetail + insertResult.generatedMaps.length;
            })                
            iterationIndex = iterationIndex + 1;
        }

        this.mailService.sendMail(
            `L'operazione di recupero informazioni sui percorsi è terminata il ${new Date()} sono stati inseriti ${totalAddedRouteDetail} nuovi dettagli con jobId: ${jobId}`,
            'OPERAZIONE DI RECUPERO INFO PERCORSI TERMINATA'
        )
        this.logger.log(`PERCORSI AGGIUNTI: ${totalAddedRouteDetail}`)

    }

    //TODO: è molto lento 
    //TODO 2: occorre ordinare le righe 
    public async getRouteWithDetailsCsv(fromDate: Date, toDate: Date){
        // Creazione del workbook
        let data = [
            [
                'Id arco', 
                'Id nodo partenza', 
                'ID nodo arrivo', 
                'Partenza', 
                'Arrivo', 
                'Media distanza 1', 
                'Media distanza 2',
                'Media distanza 3',
                'Tempo 1',
                'Tempo 2',
                'Tempo 3',
            ]
        ];

        const routes = await this.routeService.findAll();
        console.log('Route recuperate', routes.length);
        let index = 0;
        for(const route of routes){
            if((index + 1) % 1000 === 0){
                console.log('sono state processate ', index )
            }
            index = index + 1;
            //Recupero tutti i dettagli di una determinata route 
            await this.findByDateAndId(fromDate, toDate, route.arcId).then(routeDetails => {
                //Eseguo la media del tempo e delle distanze 
                let averages = this.calculateRouteDetailAverage(routeDetails);
                //Stampo i irsultati nel csv
                data.push(
                    [
                        route.arcId.toString(), 
                        route.originNodeId.toString(),
                        route.destinationNodeId.toString(),
                        `${route.originLatitude}, ${route.originLongitude}`, 
                        `${route.destinationLatitude}, ${route.destinationLongitude}`,
                        averages[TimeSlotIdentifier.SEVEN_TO_NINE_AM].averageDistance.toString(),
                        averages[TimeSlotIdentifier.NINE_TO_ELEVEN_AM].averageDistance.toString(),
                        averages[TimeSlotIdentifier.ELEVEN_TO_TWELVE].averageDistance.toString(),
                        averages[TimeSlotIdentifier.SEVEN_TO_NINE_AM].averageDuration.toString(),
                        averages[TimeSlotIdentifier.NINE_TO_ELEVEN_AM].averageDuration.toString(),
                        averages[TimeSlotIdentifier.ELEVEN_TO_TWELVE].averageDuration.toString()

                    ]
                )
            })
        }

        const workbook = utils.book_new();
        const worksheet = utils.aoa_to_sheet(data);        
        utils.book_append_sheet(workbook, worksheet, 'Dati');

        // Conversione del workbook in un buffer
        const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return buffer;

    }

    private calculateRouteDetailAverage(routeDetail: RouteDetail[]): {[id: number]: {averageDuration: number; averageDistance: number}} {
        let averages: {[id: number]: {averageDuration: number; averageDistance: number}} = {};
        for (const key of Object.values(TimeSlotIdentifier)) {
            if(!isNaN(Number(key))){
                const routeDetailOfCurrentTimeSlot = routeDetail.filter(routeDetail => routeDetail.timeSlotIdentifier == key)
                const { totalDistance, totalDuration } = routeDetailOfCurrentTimeSlot.reduce((acc, route) => {
                    acc.totalDistance += route.distanceValue;
                    acc.totalDuration += route.durationValue;
                    return acc;
                  }, { totalDistance: 0, totalDuration: 0 });
              
                const averageDuration = routeDetailOfCurrentTimeSlot.length > 0 ? totalDuration / routeDetailOfCurrentTimeSlot.length : 0;
                const averageDistance = routeDetailOfCurrentTimeSlot.length > 0 ? totalDistance / routeDetailOfCurrentTimeSlot.length : 0;
              
                averages[key] = {averageDuration, averageDistance}
            }
        }
        return averages

      }
}