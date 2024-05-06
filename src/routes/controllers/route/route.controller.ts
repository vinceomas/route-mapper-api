import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { AddRouteDto } from 'src/routes/entities/route/add-route.dto';
import { EditRouteDto } from 'src/routes/entities/route/edit-route.dto';
import { RouteDto } from 'src/routes/entities/route/route.dto';
import { RouteService } from 'src/routes/services/route.service';
import { TaskService } from 'src/routes/services/task.service';
@Controller('route')
export class RouteController {
    
    public constructor(
        private routeService: RouteService,
        private taskService: TaskService
    ){}

    @Get()
    public findAll(): Promise<RouteDto[]>{
        return this.routeService.findAll();
    }
    
    @Get(':id')
    public findOne(@Param('id') id: number): Promise<RouteDto>{
        return this.routeService.findOne(id);
    }

    @Put(':id')
    public edit(@Param('id') id: number, @Body() coordinate: EditRouteDto): Promise<RouteDto>{
        return this.routeService.edit(id, coordinate);
    }

    @Post()
    public add(@Body() route: AddRouteDto): Promise<RouteDto>{
        return this.routeService.add(route);
    }

    @Delete(':id')
    public remove(@Param('id') id: number){
        return this.routeService.remove(id);
    }


}
