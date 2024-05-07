import { Repository } from "typeorm";
import { RouteDetail } from "../entities/route-detail/route-detail";
import { RouteDetailMapperService } from "./route-detail-mapper/route-detail-mapper.service";
import { InjectRepository } from "@nestjs/typeorm";
import { RouteDetailDto } from "../entities/route-detail/route-detail.dto";

export class RouteDetailService {
    public constructor(
        @InjectRepository(RouteDetail) private readonly routeDetailRepository: Repository<RouteDetail>,
        private readonly routeDetailMapper: RouteDetailMapperService,
    ){}

    public async findAll(): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository.find();
        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async findByJobId(jobId: string): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository.find({where: {jobId}});
        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async findByRouteId(routeId: number): Promise<RouteDetailDto[]>{
        const routeDetails = await this.routeDetailRepository.find({where: {routeId: routeId}});
        return routeDetails.map(this.routeDetailMapper.modelRouteDetailDto);
    }

    public async add(routeDetail: Partial<RouteDetail>): Promise<RouteDetail>{
        let currentRouteDetail = new RouteDetail(routeDetail.routeId, routeDetail.jobId, routeDetail.date, routeDetail.durationText, routeDetail.durationValue, routeDetail.distanceText, routeDetail.distanceValue);
        currentRouteDetail = await this.routeDetailRepository.save(currentRouteDetail);
        return this.routeDetailMapper.modelRouteDetailDto(currentRouteDetail);
    }
}