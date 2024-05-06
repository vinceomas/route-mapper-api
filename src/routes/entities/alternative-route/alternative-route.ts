import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class AlternativeRoute {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column()
    public routeId: number;

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
    public durationValue: number

    public constructor(routeId: number, jobId: string, date: Date, distanceText: string, distanceValue: number, durationText: string, durationValue: number){
        this.routeId = routeId;
        this.jobId = jobId;
        this.date = date;
        this.distanceText = distanceText;
        this.distanceValue = distanceValue;
        this.durationText = durationText;
        this.durationValue = durationValue;
    }

}