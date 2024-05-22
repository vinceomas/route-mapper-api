import { InjectRepository } from "@nestjs/typeorm";
import { Route } from "../entities/route/route";
import { Injectable, Logger } from "@nestjs/common";
import { RouteMapperService } from "./route-mapper/route-mapper.service";
import { Repository } from "typeorm";

@Injectable()
export class TestService {
    public constructor(
        @InjectRepository(Route) private readonly routeRepository: Repository<Route>,
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
}