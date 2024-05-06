import { Repository } from "typeorm";
import { AlternativeRoute } from "../entities/alternative-route/alternative-route";
import { AlternativeRouteMapperSerivce } from "./alternative-route-mapper/alternative.route-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { AlternativeRouteDto } from "../entities/alternative-route/alternative-route.dto";

export class AlternativeRouteService {
    public constructor(
        @InjectRepository(AlternativeRoute) private readonly alternativeRouteRepository: Repository<AlternativeRoute>,
        private readonly alternativeRouteMapper: AlternativeRouteMapperSerivce,
    ){}

    public async findAll(): Promise<AlternativeRouteDto[]>{
        const alternativeRoutes = await this.alternativeRouteRepository.find();
        return alternativeRoutes.map(this.alternativeRouteMapper.modelAlternativeRouteDto);
    }

    public async findByJobId(jobId: string): Promise<AlternativeRouteDto[]>{
        const alternativeRoutes = await this.alternativeRouteRepository.find({where: {jobId}});
        return alternativeRoutes.map(this.alternativeRouteMapper.modelAlternativeRouteDto);
    }

    public async findByRouteId(routeId: number): Promise<AlternativeRouteDto[]>{
        const alternativeRoutes = await this.alternativeRouteRepository.find({where: {routeId: routeId}});
        return alternativeRoutes.map(this.alternativeRouteMapper.modelAlternativeRouteDto);
    }

    public async add(alternativeRoute: Partial<AlternativeRoute>): Promise<AlternativeRoute>{
        let currentAlternativeRoute = new AlternativeRoute(alternativeRoute.routeId, alternativeRoute.jobId, alternativeRoute.date, alternativeRoute.durationText, alternativeRoute.durationValue, alternativeRoute.distanceText, alternativeRoute.distanceValue);
        currentAlternativeRoute = await this.alternativeRouteRepository.save(currentAlternativeRoute);
        return this.alternativeRouteMapper.modelAlternativeRouteDto(currentAlternativeRoute);
    }
}