import { CronExpression } from "@nestjs/schedule";
import { CronExpresionToTimeSlotMap, TimeSlotIdentifier } from "./types/types";

export const cronExpressionToTimeSlotMap: CronExpresionToTimeSlotMap = {
    [TimeSlotIdentifier.SEVEN_TO_NINE_AM]: {
        maximumTimeForExecution: {hours: 9, minutes:0, seconds: 0},
        cronExpression: CronExpression.EVERY_DAY_AT_7AM
    },
    [TimeSlotIdentifier.NINE_TO_ELEVEN_AM]: {
        maximumTimeForExecution: {hours: 12, minutes:30, seconds: 0},
        cronExpression: CronExpression.EVERY_DAY_AT_9AM
    },
    [TimeSlotIdentifier.ELEVEN_TO_TWELVE]: {
        maximumTimeForExecution: {hours: 16, minutes:30, seconds: 0},
        cronExpression: '30 12 * * *'}
}