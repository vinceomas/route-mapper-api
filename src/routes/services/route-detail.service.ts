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
import { RouteDto } from "../entities/route/route.dto";

@Injectable()
export class RouteDetailService {
    public constructor(
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        @InjectRepository(Route) private readonly routeRepository: Repository<Route>,
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

    private async getAggregatedRoutesDetail(timeSlotIdentifiers: number[]) {
        const result = await this.routeRepository.createQueryBuilder('route')
        .leftJoinAndSelect('route.routeDetails', 'routeDetail')
        .where('routeDetail.timeSlotIdentifier IN (:...timeSlotIdentifiers)', { timeSlotIdentifiers })
        .getMany();

        return result;
    }

    public async add(routeDetail: Partial<RouteDetail>): Promise<RouteDetail>{
        let currentRouteDetail = new RouteDetail(routeDetail.arcId, routeDetail.jobId, routeDetail.date, routeDetail.distanceText, routeDetail.distanceValue, routeDetail.durationText, routeDetail.durationValue, routeDetail.staticDurationText, routeDetail.staticDurationValue, routeDetail.googleMapsPolyline, routeDetail.timeSlotIdentifier);
        currentRouteDetail = await this.routeDetailRepository.save(currentRouteDetail);
        return this.routeDetailMapper.modelRouteDetailDto(currentRouteDetail);
    }

    public async getAllRouteDetails(jobId: string, timeSlotIdentifier: TimeSlotIdentifier){
        let routeMatrix: RouteDto[][] = [];
        let routeMatrixRow: RouteDto[] = [];
        let totalAddedRouteDetail = 0;

        let directionResponseByRouteIdMap: {[id: number]: number} = {}
        const routeDtoArray = await this.routeService.findAllActivedRoutes();

        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        //Dividi le route in in chunks
        for(const routeDto of routeDtoArray){
            routeMatrixRow.push(routeDto);
            if(routeMatrixRow.length > Number(process.env.EXTRACTION_CHUNK_SIZE)){
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
                //return this.googleMapsApiHandler.getFakeRouteDetails(route, route.arcId, timeSlotIdentifier);
            });
            let routesToAdd: Partial<RouteDetail>[] = [];
            let iterationError = false;
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
                iterationError = true;
                console.log('err', err)
                this.logger.error(`Error during fetch trance ${iterationIndex}`)
            })

            const insertOperations = this.routeDetailRepository.insert(routesToAdd);

            await insertOperations.then(insertResult => {
                console.log(`Inserimento della trance: ${iterationIndex}, sono stati inseriti ${insertResult.generatedMaps.length} elementi`);
                totalAddedRouteDetail = totalAddedRouteDetail + insertResult.generatedMaps.length;
            })                
            iterationIndex = iterationIndex + 1;

            await wait(Number(process.env.EXTRACTION_TIMEOUT_BETWEEN_CHUNKS))
        }

        this.mailService.sendMail(
            `L'operazione di recupero informazioni sui percorsi è terminata il ${new Date()} sono stati inseriti ${totalAddedRouteDetail} nuovi dettagli con jobId: ${jobId}`,
            'OPERAZIONE DI RECUPERO INFO PERCORSI TERMINATA'
        )
        this.logger.log(`PERCORSI AGGIUNTI: ${totalAddedRouteDetail}`)

    }

    public async getRouteDetailsCsvBuffer(timeSlotIdentifiersKey: TimeSlotIdentifier[]){
        const timeSlotIdentifiers: number[] = timeSlotIdentifiersKey.map(key => TimeSlotIdentifier[key as unknown as keyof typeof TimeSlotIdentifier]);
        //CSV header generation
        let header = [
            'Id arco', 
            'Id nodo partenza', 
            'Id nodo arrivo', 
            'Partenza', 
            'Arrivo', 
        ];
        timeSlotIdentifiers.forEach(identifier => header.push(`Distanza ${identifier}`));
        timeSlotIdentifiers.forEach(identifier => header.push(`Durata ${identifier}`));
        timeSlotIdentifiers.forEach(identifier => header.push(`Durata medio ${identifier} (senza traffico in tempo reale)`));
        timeSlotIdentifiers.forEach(identifier => header.push(`Orario estrazione time slot ${identifier}`));

        let data = [];
        data.push(header);

        //CSV row generation
        const routeWithDetails = await this.getAggregatedRoutesDetail(timeSlotIdentifiers);
        console.log('Route recuperate', routeWithDetails.length);
        for(const routeWithDetail of routeWithDetails){

            const routeDetailRow = [];
            
            timeSlotIdentifiers.forEach(identifier => {
                const distanceValue = routeWithDetail.routeDetails.find(rd => rd.timeSlotIdentifier == identifier).distanceValue
                routeDetailRow.push(distanceValue);
            })
            timeSlotIdentifiers.forEach(identifier => {
                const durationValue = routeWithDetail.routeDetails.find(rd => rd.timeSlotIdentifier == identifier).durationValue
                routeDetailRow.push(durationValue)
            })
            timeSlotIdentifiers.forEach(identifier => {
                const staticDurationValue = routeWithDetail.routeDetails.find(rd => rd.timeSlotIdentifier == identifier).staticDurationValue
                routeDetailRow.push(staticDurationValue)
            })
            timeSlotIdentifiers.forEach(identifier => {
                const date = routeWithDetail.routeDetails.find(rd => rd.timeSlotIdentifier == identifier).date
                routeDetailRow.push(this.getDateFromTimeZone(new Date(date), 0))
            })
            data.push(
                [
                    routeWithDetail.arcId.toString(), 
                    routeWithDetail.originNodeId.toString(),
                    routeWithDetail.destinationNodeId.toString(),
                    `${routeWithDetail.originLatitude}, ${routeWithDetail.originLongitude}`, 
                    `${routeWithDetail.destinationLatitude}, ${routeWithDetail.destinationLongitude}`,
                    ...routeDetailRow
                ]
            )
        }

        // Workbook generation
        const workbook = utils.book_new();
        const worksheet = utils.aoa_to_sheet(data);        
        utils.book_append_sheet(workbook, worksheet, 'Dati');

        // Inserting workbook into buffer
        const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    }

    private getDateFromTimeZone(date: Date, utcHours: number){
        return new Date (date.setHours(date.getHours() + utcHours)).toLocaleTimeString();
    }
}