import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Route } from "../entities/route/route";
import { RouteMapperService } from "./route-mapper/route-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDto } from "../entities/route/route.dto";
import { InsertResult, Repository } from "typeorm";
import { isNullOrUndefined } from "util";
import { AddRouteDto } from "../entities/route/add-route.dto";
import { EditRouteDto } from "../entities/route/edit-route.dto";
import { read, utils } from "xlsx";
import { CsvRoute, getRouteToAdd as getRouteFromCsvRoute } from "../controllers/route/csv-parser.utils";import { RouteDetail } from "../entities/route-detail/route-detail";

@Injectable()
export class RouteService {
    public constructor(
        @InjectRepository(Route) private readonly routeRepository: Repository<Route>,
        @InjectRepository(RouteDetail) private readonly routeDetail: Repository<RouteDetail>,
        private readonly routeMapper: RouteMapperService,
        private readonly logger: Logger
    ){}

    public async findAll(): Promise<RouteDto[]>{
        const routes = await this.routeRepository.find();
        return routes.map(this.routeMapper.modelRouteDto)
    }

    public async findAllActivedRoutes(): Promise<RouteDto[]>{
        const activedRoutes = await this.routeRepository.find({where: {enabled: true}});
        return activedRoutes.map(this.routeMapper.modelRouteDto)
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
        return await this.routeRepository
        .createQueryBuilder('route')
        .insert()
        .values(routeToAdd)
        .orIgnore()
        .execute();
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

    public async deleteAllRoutes(): Promise<number>{
        await this.routeDetail.clear();
        const countRouteToDelete = this.routeRepository.count();
        await this.routeRepository.clear();
        return countRouteToDelete;
    }

    public async extractRoutesFromCsvDataSheet(file: any, eraseOldRoutesData: boolean) {
        const logger = new Logger('UploadFileWithInfo');
        if(eraseOldRoutesData){
            await this.deleteAllRoutes().then(deletedRoutes => logger.log(`SONO STATI CANCELLATI ${deletedRoutes} PERCORSI`)).catch(err => logger.error(`Error during massive routes deletion: ${err}`));        
        }
        const initialRoutesCount = await this.routeRepository.count();
        const wb = read(file.buffer);
        const csvRoutes: CsvRoute[] = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        logger.log(`Numero di righe nel file CSV ${csvRoutes.length}`)
        /**
         * Per velocizzare l'inserimento uso la bulkInsert di SQL 
         * SQLlite ha un limite di variabili che possono essere passate a una query SQL quindi non posso creare un'unica insert con tutte le righe del CSV
         * Per risolvere il problema suddivido l'array in una matrice, ogni elemento della matrice contiene un array di massimo 2000 operazioni 
         * in questo modo l'insert è motlo più veloce 
         */
        const routesToAdd = getRouteFromCsvRoute(csvRoutes);

        const insertOperations: Promise<InsertResult>[] = routesToAdd.map((routesToAdd, index) => {
            logger.log(`Inserimento della trance: ${index}`)
            return this.addMany(routesToAdd as Route[]);
        })

        await Promise.all(insertOperations).then(res => {
            const insertOperationCount = res.reduce((acc, insertResult) => acc + insertResult.generatedMaps.length, 0);
            logger.log(`Sono stati eseguiti ${insertOperationCount} tentativi di inserimenti`);
        });
        const finalRoutesCount = await this.routeRepository.count();
        const routesAdded = finalRoutesCount - initialRoutesCount;
        const discardedRoutes = csvRoutes.length - routesAdded;
        return {
            routesAdded,
            discardedRoutes
        }
    }
}