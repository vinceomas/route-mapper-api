import { InsertResult, LessThanOrEqual, MoreThanOrEqual, Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";
import { Route } from "../entities/route/route";
import { AddressType, Client, DirectionsResponse, DirectionsRoute, GeocodedWaypointStatus, LatLngLiteral, Status, Time } from "@googlemaps/google-maps-services-js";
import { ConfigService } from "@nestjs/config";
import { RouteService } from "./route.service";
import { Logger } from "@nestjs/common";
import { WorkSheet, read, utils, write } from 'xlsx';
import { TimeSlotIdentifier } from "../types/types";
import { MailService } from "./mail.service";
import { directions } from "@googlemaps/google-maps-services-js/dist/directions";
import { AxiosHeaders } from "axios";

export class RouteDetailService {
    public constructor(
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        private readonly routeDetailMapper: RouteDetailMapperService,
        private readonly configService: ConfigService,
        private readonly routeService: RouteService,
        private readonly logger: Logger,
        private readonly mailService: MailService
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
        let routeMatrix: Route[][] = [];
        let routeMatrixRow: Route[] = [];
        let totalAddedRouteDetail = 0;

        let directionResponseByRouteIdMap: {[id: number]: number} = {}
        const routeArray = await this.routeService.findAllActivedRoutes();

        //Dividi le route in in pacchetti di 200 elementi 
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
                return this.getRouteDetail(route, jobId, timeSlotIdentifier)
            });
            let routesToAdd: Partial<RouteDetail>[] = [];
            await Promise.all(rowPromises).then(directionsResponse => {
                routesToAdd = directionsResponse.map((dir, index) => {
                    const routeWithLowestTime: DirectionsRoute = dir.data.routes.reduce((acc, cur) => {
                        return cur.legs[0].duration.value < acc.legs[0].duration.value ? cur : acc;
                    }, dir.data.routes[0]);
                    return {
                        arcId: directionResponseByRouteIdMap[index],
                        jobId: jobId,
                        date: new Date(),
                        distanceText: routeWithLowestTime.legs[0].distance.text,
                        distanceValue: routeWithLowestTime.legs[0].distance.value,
                        durationText: routeWithLowestTime.legs[0].duration.text,
                        durationValue: routeWithLowestTime.legs[0].duration.value,
                        timeSlotIdentifier
                    }
                });
            })

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

    private async getRouteDetail(route: Route, jobId: string, timeSlotIdentifier: TimeSlotIdentifier): Promise<DirectionsResponse>{
        //Simulate Google Maps directions API response 
        return {
            status: 200,
            statusText: "",
            headers: new AxiosHeaders(),
            config: {
                headers: new AxiosHeaders()
            },
            data: {
                geocoded_waypoints : [
                    {
                       geocoder_status : GeocodedWaypointStatus.OK,
                       place_id : "ChIJRVY_etDX3IARGYLVpoq7f68",
                       types : [
                        AddressType.bus_station,
                        AddressType.train_station,
                        AddressType.point_of_interest,
                        AddressType.establishment
                       ],
                       partial_match: false
                    },
                    {
                       geocoder_status : GeocodedWaypointStatus.OK,
                       partial_match : true,
                       place_id : "ChIJp2Mn4E2-woARQS2FILlxUzk",
                       types : [ AddressType.route ]
                    }
                 ],
                 routes : [
                    {
                       bounds : {
                          northeast : {
                             lat : 34.1330949,
                             lng : -117.9143879
                          },
                          southwest : {
                             lat : 33.8068768,
                             lng : -118.3527671
                          }
                       },
                       copyrights : "Map data ©2016 Google",
                       legs : [
                          {
                             distance : {
                                text : "35.9 mi",
                                value : 57824
                             },
                             duration : {
                                text : "51 mins",
                                value : 3062
                             },
                             end_address : "Universal Studios Blvd, Los Angeles, CA 90068, USA",
                             end_location : {
                                lat : 34.1330949,
                                lng : -118.3524442
                             },
                             start_address : "Disneyland (Harbor Blvd.), S Harbor Blvd, Anaheim, CA 92802, USA",
                             start_location : {
                                lat : 33.8098177,
                                lng : -117.9154353
                             },
                             steps: [],
                             departure_time: {
                                value: new Date(),
                                text: "string",
                                time_zone: "string"
                             },
                             arrival_time: {
                                value: new Date(),
                                text: "string",
                                time_zone: "string"
                             },

                         }
                        ],    
          
                       overview_polyline : {
                          points : "knjmEnjunUbKCfEA?"
                       },
                       summary : "I-5 N and US-101 N",
                       warnings : [],
                       waypoint_order : [],
                       fare: {
                            currency: "string",
                            /** The total fare amount, in the currency specified above. */
                            value: 1,
                            /** The total fare amount, formatted in the requested language. */
                            text: ""
                        },
                     overview_path: [] as LatLngLiteral[]
                    }
                 ],
                 status : Status.OK,
                 error_message: "",
                 available_travel_modes: []
            },

        }
        // const client = new Client({});

        // return client.directions({
        //     params: {
        //         origin: {
        //             lat: Number(route.originLatitude),
        //             lng: Number(route.originLongitude)
        //         },
        //         destination: {
        //             lat: Number(route.destinationLatitude),
        //             lng: Number(route.destinationLongitude)
        //         },
        //         alternatives: true,
        //         //key: this.configService.get<string>('GOOGLE_MAPS_API_KEY'),
        //         key: "AIzaSyCa2jbjuPvveaNLvXeOVf0uEPkCw2rb8Lo"
        //     },
        //     timeout: 3000, // milliseconds
        // });
    }




}