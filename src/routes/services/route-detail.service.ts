import { InsertResult, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";
import { Route } from "../entities/route/route";
import { Client, DirectionsResponse, DirectionsRoute } from "@googlemaps/google-maps-services-js";
import { ConfigService } from "@nestjs/config";
import { RouteService } from "./route.service";
import { Logger } from "@nestjs/common";
import { WorkSheet, read, utils, write } from 'xlsx';
import { TimeSlotIdentifier } from "../types/types";

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

    public async findByDateAndId(fromDate: Date, toDate: Date, arcId: number): Promise<RouteDetailDto[]>{
        // const routeDetails = await this.routeDetailRepository.find({
        //     where: [
        //         {
        //             arcId: arcId
        //         },
        //         {                
        //             date: LessThanOrEqual(toDate)
        //         },
        //         {
        //             date: MoreThanOrEqual(fromDate)
        //         }
        //     ],

        // })

        const routeDetails = await this.routeDetailRepository
            .createQueryBuilder('entity')
            .where('entity.arcId = :arcId', { arcId })
            .andWhere('entity.date BETWEEN :fromDate AND :toDate', { fromDate, toDate })
            .getMany();

        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);


    }

    public async add(routeDetail: Partial<RouteDetail>): Promise<RouteDetail>{
        let currentRouteDetail = new RouteDetail(routeDetail.arcId, routeDetail.jobId, routeDetail.date, routeDetail.distanceText, routeDetail.distanceValue, routeDetail.durationText, routeDetail.durationValue, routeDetail.timeSlotIdentifier);
        currentRouteDetail = await this.routeDetailRepository.save(currentRouteDetail);
        return this.routeDetailMapper.modelRouteDetailDto(currentRouteDetail);
    }

    public async getAllRouteDetails(jobId: string, timeSlotIdentifier: TimeSlotIdentifier){
        let routesDetailToAdd: Partial<RouteDetail>[][] = [];
        let matrixRow: Partial<RouteDetail>[] = [];
        const routes = await this.routeService.findAll();
        let index = 0;
        for(const route of routes){
            if ((index + 1) % 1000 === 0){
                this.logger.log(`CALCOLO DELLA ROUTE ${index}`);
            }
            index = index + 1;
            const routeDetail = await this.getRouteDetail(route, jobId, timeSlotIdentifier);
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
        for(const route of routes){
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
                console.log(key);
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

    private async getRouteDetail(route: Route, jobId: string, timeSlotIdentifier: TimeSlotIdentifier): Promise<Partial<RouteDetail>>{
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
                durationValue: routeWithLowestTime.legs[0].duration.value,
                timeSlotIdentifier
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