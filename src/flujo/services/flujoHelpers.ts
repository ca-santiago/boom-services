import { JwtService } from "@nestjs/jwt";
import { Flujo } from "../domain/flujo";
import { StepType } from "../interfaces/flujo";
import { StepAccessTokenPayload } from "../interfaces/step.token";
import { Injectable } from "@nestjs/common";



@Injectable()
export class FlujoHelpersService {
    constructor(
        private jwtService: JwtService,
    ) { }

    verifyStepAccesToken(token: string): null | StepAccessTokenPayload {
        try {
            const res = this.jwtService.verify(token);
            if (res === null) return null;

            return res;
        } catch (err) {
            return null;
        }
    }

    maskStepAsCompleted(f: Flujo, step: StepType): Flujo {
        const cleanedSteps = new Set([...f.completedSteps, step]);
        const updated: Flujo = {
            ...f,
            completedSteps: Array.from(cleanedSteps)
        }
        return updated;
    }


    sumCompletionTime(dateInMillis: number, timeString: string) {
        const value = parseInt(timeString);
        const unit = timeString.slice(-1);

        const date = new Date(dateInMillis);

        if (unit === 'h') {
            date.setHours(date.getHours() + value);
        } else if (unit === 'm') {
            date.setMinutes(date.getMinutes() + value);
        }

        return date.getTime();
    }

    calculateSecondsLeftFromDateToDate(currentTime: number, deadline: number) {
        // Calculate the difference between the deadline and current time in milliseconds
        const timeDiff = deadline - currentTime;

        // Check if the deadline has already passed
        if (timeDiff <= 0) {
            return 0; // Return 0 seconds if the deadline has passed
        }

        // Convert milliseconds to seconds
        const secondsLeft = Math.floor(timeDiff / 1000);

        return secondsLeft;
    }

    getSecondsLeft(startTime: number, completionTime: string): number {
        const deadline = this.sumCompletionTime(startTime, completionTime);
        return this.calculateSecondsLeftFromDateToDate(Date.now(), deadline)
    }
}
