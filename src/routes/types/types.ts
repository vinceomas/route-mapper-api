import { CronExpression } from "@nestjs/schedule";

export enum TimeSlotIdentifier {
    SEVEN_TO_NINE_AM,
    NINE_TO_ELEVEN_AM,
    ELEVEN_TO_TWELVE
}

export interface CronExpresionToTimeSlotMap {[id: number]: CronExpression}