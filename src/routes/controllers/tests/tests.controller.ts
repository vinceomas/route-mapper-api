import { Body, Controller, Delete, Get, Logger, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RouteService } from "src/routes/services/route.service";
import { TestService } from "src/routes/services/test.service";


@ApiTags('Tests')
@Controller('tests')
export class TestController {
    public constructor(
        private routeService: RouteService,
        private readonly logger: Logger,
        private testService: TestService
    ){}

    @Get('/massiveUpdateRouteState/:fromArcId/:toArcId/:actived')
    async massiveUpdateRouteState(@Param('actived') actived: boolean, @Param('fromArcId') fromArcId: number, @Param('toArcId') toArcId: number){
        return await this.testService.updateRoutesState(actived, fromArcId, toArcId);
    }  

    @Get('/testRouteDetails/:fromArcId/:toArcId/:timeSlotIdentifier')
    async testRouteDetails(@Param('timeSlotIdentifier') timeSlotIdentifier: number, @Param('fromArcId') fromArcId: number, @Param('toArcId') toArcId: number){
        return await this.testService.testRouteDetails(timeSlotIdentifier, fromArcId, toArcId);
    }  

    @Get('/activerRouteCount')
    async getActivedRouteCount(){
        return this.testService.countActivedRoute();
    }

    @Post('/deleteRouteDetails')
    async delete(@Body() ids: number[]){
        return this.testService.deleteRouteDetails(ids);
    }
}