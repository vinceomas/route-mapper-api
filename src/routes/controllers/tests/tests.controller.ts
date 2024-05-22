import { Controller, Get, Logger, Param } from "@nestjs/common";
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
}