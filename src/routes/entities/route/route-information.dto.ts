export interface RouteInformationBody {
    originLatitude: string,
    originLongitude: string,
    destinationLatitude: string,
    destinationLongitude: string
}

export class RouteInformationDto {
    public readonly originLongitude: string;
    public readonly originLatitude: string;
    public readonly destinationLongitude: string;
    public readonly destinationLatitude: string;

    public constructor(opts?: RouteInformationBody){
        Object.assign(this, opts)
    }

}