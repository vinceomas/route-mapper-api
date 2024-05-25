import { Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";
import { Route } from "../entities/route/route";
import { ConfigService } from "@nestjs/config";
import { RouteService } from "./route.service";
import { Injectable, Logger } from "@nestjs/common";
import { utils, write } from 'xlsx';
import { TimeSlotIdentifier } from "../types/types";
import { MailService } from "./mail.service";
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

    private async getAggregatedRoutesDetail() {

        const subquery0 = this.routeDetailRepository.createQueryBuilder('rDetail0')
        .select('rDetail0.arcId', 'arcId')
        .addSelect('0', 'timeSlotIdentifier')
        .addSelect('MAX(rDetail0.durationValue)', 'max_durationValue0')
        .where('rDetail0.timeSlotIdentifier = 0')
        .groupBy('rDetail0.arcId');

        const subquery1 = this.routeDetailRepository.createQueryBuilder('rDetail1')
        .select('rDetail1.arcId', 'arcId')
        .addSelect('1', 'timeSlotIdentifier')
        .addSelect('MAX(rDetail1.durationValue)', 'max_durationValue1')
        .where('rDetail1.timeSlotIdentifier = 1')
        .groupBy('rDetail1.arcId');

        const subquery2 = this.routeDetailRepository.createQueryBuilder('rDetail2')
        .select('rDetail2.arcId', 'arcId')
        .addSelect('2', 'timeSlotIdentifier')
        .addSelect('MAX(rDetail2.durationValue)', 'max_durationValue2')
        .where('rDetail2.timeSlotIdentifier = 2')
        .groupBy('rDetail2.arcId');

        const results = await this.routeDetailRepository
        .createQueryBuilder('rDetails')
        .leftJoin(Route, 'r', 'rDetails.arcId = r.arcId')
        .leftJoin(
            `(${subquery0.getQuery()})`,
            'sq0',
            'rDetails.arcId = sq0.arcId'
        )
        .leftJoin(
            `(${subquery1.getQuery()})`,
            'sq1',
            'rDetails.arcId = sq1.arcId'
        )
        .leftJoin(
            `(${subquery2.getQuery()})`,
            'sq2',
            'rDetails.arcId = sq2.arcId'
        )
        .select('r.arcId', 'arcId')
        .addSelect('r.originNodeId', 'originNodeId')
        .addSelect('r.destinationNodeId', 'destinationNodeId')
        .addSelect('r.originLatitude', 'originLatitude')
        .addSelect('r.originLongitude', 'originLongitude')
        .addSelect('r.destinationLatitude', 'destinationLatitude')
        .addSelect('r.destinationLongitude', 'destinationLongitude')

        .addSelect('sq0.max_durationValue0', 'durationValue_slot0')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 0 AND rDetails.durationValue = sq0.max_durationValue0 THEN rDetails.durationText ELSE NULL END)', 'durationText_slot0')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 0 AND rDetails.durationValue = sq0.max_durationValue0 THEN rDetails.distanceValue ELSE NULL END)', 'distanceValue_slot0')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 0 AND rDetails.durationValue = sq0.max_durationValue0 THEN rDetails.distanceText ELSE NULL END)', 'distanceText_slot0')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 0 AND rDetails.durationValue = sq0.max_durationValue0 THEN rDetails.googleMapsPolyline ELSE NULL END)', 'googleMapsPolyline_slot0')

        .addSelect('sq1.max_durationValue1', 'durationValue_slot1')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 1 AND rDetails.durationValue = sq1.max_durationValue1 THEN rDetails.durationText ELSE NULL END)', 'durationText_slot1')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 1 AND rDetails.durationValue = sq1.max_durationValue1 THEN rDetails.distanceValue ELSE NULL END)', 'distanceValue_slot1')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 1 AND rDetails.durationValue = sq1.max_durationValue1 THEN rDetails.distanceText ELSE NULL END)', 'distanceText_slot1')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 1 AND rDetails.durationValue = sq1.max_durationValue1 THEN rDetails.googleMapsPolyline ELSE NULL END)', 'googleMapsPolyline_slot1')

        .addSelect('sq2.max_durationValue2', 'durationValue_slot2')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 2 AND rDetails.durationValue = sq2.max_durationValue2 THEN rDetails.durationText ELSE NULL END)', 'durationText_slot2')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 2 AND rDetails.durationValue = sq2.max_durationValue2 THEN rDetails.distanceValue ELSE NULL END)', 'distanceValue_slot2')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 2 AND rDetails.durationValue = sq2.max_durationValue2 THEN rDetails.distanceText ELSE NULL END)', 'distanceText_slot2')
        .addSelect('MAX(CASE WHEN rDetails.timeSlotIdentifier = 2 AND rDetails.durationValue = sq2.max_durationValue2 THEN rDetails.googleMapsPolyline ELSE NULL END)', 'googleMapsPolyline_slot2')

        .where('rDetails.timeSlotIdentifier IN (0, 1, 2)')
        .groupBy('rDetails.arcId')
        .getRawMany();
    
        return results;
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
                //return this.googleMapsApiHandler.getRouteDetails(route);
                return this.googleMapsApiHandler.getFakeRouteDetails(route, route.arcId, timeSlotIdentifier);
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

            //await wait(60000)
            await wait(2000)

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

        const aggregatedRoutesDetail = await this.getAggregatedRoutesDetail();
        console.log('Route recuperate', aggregatedRoutesDetail.length);
        for(const routeDetail of aggregatedRoutesDetail){
            data.push(
                [
                    routeDetail.arcId.toString(), 
                    routeDetail.originNodeId.toString(),
                    routeDetail.destinationNodeId.toString(),
                    `${routeDetail.originLatitude}, ${routeDetail.originLongitude}`, 
                    `${routeDetail.destinationLatitude}, ${routeDetail.destinationLongitude}`,
                    routeDetail.distanceValue_slot0,
                    routeDetail.distanceValue_slot1,
                    routeDetail.distanceValue_slot2,
                    routeDetail.durationValue_slot0,
                    routeDetail.durationValue_slot1,
                    routeDetail.durationValue_slot2,
                ]
            )
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