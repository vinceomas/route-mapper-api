import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Route {

    @PrimaryGeneratedColumn()
    public id: number;

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

    public constructor(originLatitude: string, originLongitude: string, destinationLatitude: string, destinationLongitude: string){
        this.originLatitude = originLatitude;
        this.originLongitude = originLongitude;
        this.destinationLatitude = destinationLatitude;
        this.destinationLongitude = destinationLongitude;
        this.enabled = true;
    }
}
