import { extname } from 'path';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ReqBodyDto } from './route.controller';
import { read, utils } from 'xlsx';
import { RouteService } from 'src/routes/services/route.service';
import { Route } from 'src/routes/entities/route/route';
import { InsertResult } from 'typeorm';

export const SUPPORTED_FILES = ['xls', 'xlsx'];

export const multerOptions = {
    limits: {
        fileSize: +process.env.MAX_FILE_SIZE || 1862 * 2000,
    },
    fileFilter: (req: any, file: any, cb: any) => {
        const ext: string = file.originalname.split('.').pop() || '';
        if (SUPPORTED_FILES.indexOf(ext?.toLowerCase()) !== -1) {
            cb(null, true);
        } else {
            cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
        }
    },
};

export type CsvRoute = {
    idArco: number,
    idNodoPartenza: number,
    idNodoArrivo: number,
    Partenza: string,
    Arrivo: string,
    distanzaFasciaOraria1: number | undefined,
    distanzaFasciaOraria2: number | undefined,
    distanzaFasciaOraria3: number | undefined,
    tempoFasciaOraria1: number | undefined,
    tempoFasciaOraria2: number | undefined,
    tempoFasciaOraria3: number | undefined,
}

  export function getRouteToAdd(csvRoutes: CsvRoute[]): Route[][]{
    const logger = new Logger('GetRouteToAdd');
    let addedRoutes = 0;
    let notAddedRoutes = 0;
    let routesToAdd: Route[][] = [];    
    let matrixRow: Route[] = [];
    
    csvRoutes.map(async csvRoute => {
        const arcId = Number(csvRoute['ID arco']);
        const originNodeId = Number(csvRoute['ID nodo partenza']);
        const destinationNodeId = Number(csvRoute['ID nodo arrivo']);
        const origin = csvRoute.Partenza.split(',', 2);
        const originLatitude = origin[0];
        const originLongitude = origin[1];
        const destination = csvRoute.Arrivo.split(',', 2);
        const destinationLatitude = destination[0];
        const destinationLongitude = destination[1];
        if( 
            arcId &&
            originNodeId &&
            destinationNodeId &&
            originLatitude &&
            originLongitude &&
            destinationLatitude &&
            destinationLongitude
        ){
            matrixRow.push(new Route(
                arcId,
                originNodeId,
                destinationNodeId,
                originLatitude,
                originLongitude,
                destinationLatitude,
                destinationLongitude
            ));
            if(matrixRow.length > Number(process.env.MASSIVE_INSERT_CHUNCK_SIZE)){
                routesToAdd.push(matrixRow);
                matrixRow = [];
            }
            addedRoutes = addedRoutes + 1;            
        }else{
            notAddedRoutes = notAddedRoutes + 1;
        }
    });
    if (matrixRow.length > 0){
        routesToAdd.push(matrixRow);
    }
    logger.log(`'Percorsi aggiunti alla matrice ${addedRoutes}`);
    logger.log(`'Percorsi scartati ${notAddedRoutes}`);
    logger.log(`'Numero di trance create ${routesToAdd.length}`);
    return routesToAdd;
  }
