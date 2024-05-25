import { TimeSlotIdentifier } from "src/routes/types/types";
import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity()
export class RouteDetail {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public arcId: number;

    @Column()
    public jobId: string;

    @Column()
    public date: Date;

    @Column() 
    public distanceText: string;

    @Column()
    public distanceValue: number;

    @Column()
    public durationText: string;

    @Column()
    public durationValue: number;

    @Column()
    public staticDurationText: string;

    @Column()
    public staticDurationValue: number;

    @Column()
    public googleMapsPolyline: string;

    @Column()
    public timeSlotIdentifier: TimeSlotIdentifier

    public constructor(arcId: number, jobId: string, date: Date, distanceText: string, distanceValue: number, durationText: string, durationValue: number, staticDurationText: string, staticDurationValue: number, googleMapsPolyline: string, timeSlotIdentifier: TimeSlotIdentifier){
        this.arcId = arcId;
        this.jobId = jobId;
        this.date = date;
        this.distanceText = distanceText;
        this.distanceValue = distanceValue;
        this.durationText = durationText;
        this.durationValue = durationValue;
        this.staticDurationText = staticDurationText;
        this.staticDurationValue = staticDurationValue;
        this.googleMapsPolyline = googleMapsPolyline;
        this.timeSlotIdentifier = timeSlotIdentifier;
    }

}