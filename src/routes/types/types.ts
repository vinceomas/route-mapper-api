import { CronExpression } from "@nestjs/schedule";

interface Time {
    hours: number;
    minutes: number;
    seconds: number;
  }
  

export enum TimeSlotIdentifier {
    SEVEN_TO_NINE_AM,
    NINE_TO_ELEVEN_AM,
    ELEVEN_TO_TWELVE
}

export interface CronExpresionToTimeSlotMap {[id: number]: {
    maximumTimeForExecution: Time
    cronExpression: CronExpression | string}}