import { InjectRepository } from "@nestjs/typeorm";
import { Route } from "../entities/route/route";
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { RouteMapperService } from "./route-mapper/route-mapper.service";
import { Between, In, Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { isNullOrUndefined } from "util";

@Injectable()
export class TestService {
    public constructor(
        @InjectRepository(Route) private readonly routeRepository: Repository<Route>,
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        private readonly routeMapper: RouteMapperService,
        private readonly logger: Logger,
    ){}

    async updateRoutesState(enabled: boolean, fromArcId: number, toArcId:number): Promise<number>{
        const updatedRoutes = await this.routeRepository
        .createQueryBuilder('route')
        .update(Route)
        .set({ enabled: enabled })
        .where('route.arcId BETWEEN :fromArcId AND :toArcId', { fromArcId, toArcId })
        .execute();

        this.logger.log(`Sono state aggiornate ${updatedRoutes.affected} Routess`);
        return updatedRoutes.affected
    }

    async testRouteDetails(timeSlotIdentifier: number, fromArcId: number, toArcId: number){
        let countCorrectRoute = 0;
        let lostRouteArcIds: number[] = [];
        let wrongTimeSlotArcIds: number[] = [];
        const routes = await this.routeRepository.find({where: {
            arcId: Between(fromArcId, toArcId),
        }});

        console.log('numero di routes: ', routes.length)

        const routeDetails = await this.routeDetailRepository.find({where: [
            {timeSlotIdentifier}
        ]}); 

        console.log('Total Route Details: ', routeDetails.length);

        routes.forEach(route => {
            const detail = routeDetails.find(routeD => routeD.arcId == route.arcId);
            if(detail){
                countCorrectRoute ++;
                let targetDateStart: number;
                let targetDateEnd: number;
                switch(timeSlotIdentifier){
                    case 0:
                        targetDateStart = 7 * 60 * 60; // 7 AM in secondi
                        targetDateEnd = 9 * 60 * 60; // 9 AM in secondi
                        break;
                    case 1:
                        targetDateStart = (9 * 60 * 60) + 60; // 9.01 AM in secondi
                        targetDateEnd = (12 * 60 * 60) + 1800; // 12.30 AM in secondi
                        break;
                    case 2:
                        targetDateStart = (12 * 60 * 60) + 1860; // 12.31 AM in secondi
                        targetDateEnd = (16 * 60 * 60) + 1800; // 16.30 AM in secondi
                        break;
                }
                //const currentDate = this.getDateFromTimeZone(new Date(detail.date), 2);
                const currentDate = new Date(detail.date);
                // Estrarre solo l'orario
                const orarioEstratto = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
                const orarioEstrattoInSecondi = currentDate.getHours() * 60 * 60 + currentDate.getMinutes() * 60 + currentDate.getSeconds();

                if(orarioEstrattoInSecondi < targetDateStart || orarioEstrattoInSecondi > targetDateEnd){
                    wrongTimeSlotArcIds.push(detail.id);
                }

            }else{
                lostRouteArcIds.push(route.arcId);
            }
        })        

        const res = {
            countCorrectRoute,
            lostRoute: lostRouteArcIds.length,
            wrongTimeSlotArcIds: wrongTimeSlotArcIds.length
        }

        console.log('LOST ARC ID: ', JSON.stringify(lostRouteArcIds))

        console.log('RESULT', res);

        console.log('WRONG ROUTE DETAIL ID TIME SLOT: ', JSON.stringify(wrongTimeSlotArcIds))

        return res;
    }

    private getDateFromTimeZone(date: Date, utcHours: number){
        return new Date (date.setHours(date.getHours() + utcHours));
    }

    async countActivedRoute(){
        const routes = await this.routeRepository.find({where: {
            enabled: true,
        }});

        const minMaxArcId = routes.reduce((acc, route) => {
            if (route.arcId < acc.min) acc.min = route.arcId;
            if (route.arcId > acc.max) acc.max = route.arcId;
            return acc;
        }, { min: Infinity, max: -Infinity });
        
        console.log(`Min ID: ${minMaxArcId.min}, Max ID: ${minMaxArcId.max}`);

        return {
            activedRoutes: routes.length,
            minArcId: minMaxArcId.min,
            maxArcId: minMaxArcId.max
        };
    }

    async deleteRouteDetails(ids: number[]){
        const deleteResult = await this.routeDetailRepository.delete({
            id: In(ids),
        });
        console.log('EMLIMINATI: ', deleteResult.affected)
        return deleteResult;
    }
}