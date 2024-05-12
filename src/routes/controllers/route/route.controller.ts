import { Body, Controller, Delete, Get, HttpException, Logger, Param, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { AddRouteDto } from 'src/routes/entities/route/add-route.dto';
import { EditRouteDto } from 'src/routes/entities/route/edit-route.dto';
import { RouteDto } from 'src/routes/entities/route/route.dto';
import { RouteService } from 'src/routes/services/route.service';
import { CronService } from 'src/routes/services/cron.service';
import { SUPPORTED_FILES, multerOptions, uploadFileWithInfo } from './csv-parser.utils';
import { JwtAuthGuard } from 'src/authz/jwt.guard';

export class ReqBodyDto {
    @ApiProperty({ required: true })
    //@IsNotEmpty()
    MACode: string;

    @ApiProperty({ required: true })
    //@IsNotEmpty()
    chunkSize: string;

    @ApiProperty({ required: true })
    @IsNotEmpty()
    eraseOldRoutesData: boolean;
}

@ApiTags('Routes')
@Controller('route')
@UseGuards(AuthGuard('jwt'))
@UseGuards(JwtAuthGuard)
export class RouteController {
    
    public constructor(
        private routeService: RouteService,
        private taskService: CronService,
        private readonly logger: Logger,
    ){}
    
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get()
    public findAll(): Promise<RouteDto[]>{
        return this.routeService.findAll();
    }
    
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Get(':id')
    public findOne(@Param('id') id: number): Promise<RouteDto>{
        return this.routeService.findOne(id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Put(':id')
    public edit(@Param('id') id: number, @Body() coordinate: EditRouteDto): Promise<RouteDto>{
        return this.routeService.edit(id, coordinate);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post()
    public add(@Body() route: AddRouteDto): Promise<RouteDto>{
        return this.routeService.add(route);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete(':id')
    public remove(@Param('id') id: number){
        return this.routeService.remove(id);
    }
    
    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post("/massiveInsert")
    @ApiConsumes('multipart/form-data')
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          eraseOldRoutesData: { type: 'boolean' },
          file: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })
    @UseInterceptors(FileInterceptor('file', multerOptions))
    async upload(@UploadedFile() file, @Body() body: ReqBodyDto) {
        if (!file) {
            this.logger.error(`Please provide correct file name with extension ${JSON.stringify(SUPPORTED_FILES)}`)
            throw new HttpException(
            `Please provide correct file name with extension ${JSON.stringify(SUPPORTED_FILES)}`,
            400
            );
        }
        this.logger.log('FILE VALIDO');
        return uploadFileWithInfo(file, body, this.routeService, body.eraseOldRoutesData);
    }


}
