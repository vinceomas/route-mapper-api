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

    public async findAll(page: number, limit: number): Promise<{data: RouteDto[], total: number, page: number, limit: number}>{
        const [result, total] = await this.routeRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit
        });
        return {
            data: result.map(this.routeMapper.modelRouteDto),
            total,
            page,
            limit
        }
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

    public async checkGraph(): Promise<any>{
        const routes = await this.routeRepository
        .createQueryBuilder('entity')
        .getMany();
        let readedRouteIds = [];
        let arcInfo: {nodeId: number, countChildren: number}[] = [];
        let countSanitizedChildren = 0;
        routes.forEach(route => {
            if(!readedRouteIds.find(rr => rr == route.originNodeId)){
                const childrens = routes.filter(r => r.originNodeId == route.originNodeId);
                const sanitizedChildrens = this.sanitizeChildrens(childrens);
                if(sanitizedChildrens.length != childrens.length){
                    countSanitizedChildren += 1;
                }
                arcInfo.push({nodeId: route.originNodeId, countChildren: sanitizedChildrens.length})
                readedRouteIds.push(route.originNodeId)
            }

        })
        let wrongArc: {nodeId: number, countChildren: number}[] = []
        arcInfo.forEach(arc => {
            if(arc.countChildren != (arcInfo.length - 1)){
                wrongArc.push(arc);
            }
        })


        return {
            countArc: arcInfo.length,
            countWrongArc: wrongArc.length, 
            countSanitizedChildren,
            wrongArc
        };
    }

    private sanitizeChildrens(childrens: Route[]){
        let sanitizedChildrens: Route[] = [];
        childrens.forEach(currentChildren => {
            if(!sanitizedChildrens.find(c => c.originNodeId == currentChildren.originNodeId && c.destinationNodeId == currentChildren.destinationNodeId)){
                sanitizedChildrens.push(currentChildren)
            }
        })
        return sanitizedChildrens;
    }

    public async generateLostArc(): Promise<any>{
        const routes = await this.routeRepository
        .createQueryBuilder('entity')
        .getMany();

        let nodes: {nodeId: number, latitude: string, longitude: string}[] = [];
        routes.forEach(route => {
            if(!nodes.find(n => n.nodeId == route.destinationNodeId)){
                nodes.push({
                    nodeId: route.destinationNodeId,
                    latitude: route.destinationLatitude,
                    longitude: route.destinationLongitude
                });
            }
        })

        let currentArcId = 67524; //TODO: check
        const lostNode = {
            nodeId: 226,
            latitude: "41.56552848166146",
            longitude: "12.867944390257417"
        }
        let routesToAddFromOrigin: Route[] = [];
        let routesToAddFromDestination: Route[] = [];


        //use the lost node as the origin
        nodes.forEach(node => {
            if(node.nodeId != lostNode.nodeId){
                currentArcId += 1;
                const newRoute = new Route(
                    currentArcId,
                    lostNode.nodeId,
                    node.nodeId,
                    lostNode.latitude,
                    lostNode.longitude,
                    node.latitude,
                    node.longitude
                )
                routesToAddFromOrigin.push(newRoute);
            }
        })

        //use the lost node as the destination
        nodes.forEach(node => {
            if(node.nodeId != lostNode.nodeId){
                currentArcId += 1;
                const newRoute = new Route(
                    currentArcId,
                    node.nodeId,
                    lostNode.nodeId,
                    node.latitude,
                    node.longitude,
                    lostNode.latitude,
                    lostNode.longitude
                )
                routesToAddFromDestination.push(newRoute);
            }
        })

        let insertOperations = [
            this.addMany(routesToAddFromOrigin),
            this.addMany(routesToAddFromDestination)
        ]

        const insertionResult = await Promise.all(insertOperations)

        return {
            lostNode: nodes.length,
            insertedRouteFromOrigin: insertionResult[0].generatedMaps.length,
            insertedRouteFromDestination: insertionResult[1].generatedMaps.length
        };
    }
}