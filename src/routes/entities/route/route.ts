import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Route {

    @PrimaryGeneratedColumn()
    public id: number;

    @Column({unique: true})
    public arcId: number;

    @Column()
    public originNodeId: number;

    @Column()
    public destinationNodeId: number

    @Column()
    public originLongitude: string;

    @Column()
    public originLatitude: string;

    @Column()
    public destinationLongitude: string;
    
    @Column()
    public destinationLatitude: string;

    @Column()
    public enabled: boolean;

    public constructor(arcId: number, originNodeId: number, destinationNodeId:number, originLatitude: string, originLongitude: string, destinationLatitude: string, destinationLongitude: string){
        this.arcId = arcId;
        this.originNodeId = originNodeId;
        this.destinationNodeId = destinationNodeId;
        this.originLatitude = originLatitude;
        this.originLongitude = originLongitude;
        this.destinationLatitude = destinationLatitude;
        this.destinationLongitude = destinationLongitude;
        this.enabled = true;
    }
}
