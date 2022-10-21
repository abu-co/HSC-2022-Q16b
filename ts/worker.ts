/* 
 * Main Worker Script. 
 * ©abuco 2022
 */

import * as WorkerHelper from "./workerHelper.js";



export class Simulation {

    private readonly params: WorkerHelper.Parameters;

    constructor(params: WorkerHelper.Parameters) {
        this.params = params;
    }

    run() {
        const trialParams = {
            vInit: this.params.initialVInit,
            leap: this.params.initialLeap
        };

        // let lastTimeOfFlight = 0;
        let currentTimeOfFlight = 0;
        let lastTimeOffset = 0;
        let currentUncertainty = Infinity;
        let lastVInit = 0;

        do {
            currentTimeOfFlight = this.runProjectile(trialParams.vInit);
            const timeOffset = currentTimeOfFlight - this.params.targetTime;

            if(Math.sign(lastTimeOffset) !== Math.sign(timeOffset)) {
                // Reduce leap * switch direction...
                trialParams.leap *= -this.params.leapReductionFactor;
            }

            if(Math.sign(trialParams.leap) !== -Math.sign(timeOffset)) {
                trialParams.leap = -trialParams.leap;
            }

            currentUncertainty = Math.abs(lastVInit - trialParams.vInit);
            // lastTimeOfFlight = currentTimeOfFlight;
            lastTimeOffset = timeOffset;
            lastVInit = trialParams.vInit;

            trialParams.vInit += trialParams.leap;
        } while (currentUncertainty > this.params.maxResultRange);

        this.postMessage({
            type: "done",
            timeOfFlight: currentTimeOfFlight,
            uncertainty: currentUncertainty,
            finalLeap: trialParams.leap,
            vInit: trialParams.vInit
        });
    }

    runProjectile(vInit: number): number {
        let x = 0, v = vInit, a = -0;
        const g = 10, ag = -g;

        let timeElapsed = 0;
        let stepCounter = 0;

        const postUpdateMessage = () => this.postMessage({
            type: "update",
            vInit,
            result: {
                t: timeElapsed, x
            }
        });

        do {
            step(this.params.delta);
            ++stepCounter;

            if (stepCounter >= this.params.stepsPerTick) {
                postUpdateMessage();
            }
        } while (x > 0);

        if (stepCounter < this.params.stepsPerTick) {
            postUpdateMessage();
        }

        return timeElapsed;

        function step(delta: number) {
            /* a = -g + -0.1v */
            a = ag - 0.1 * v;

            /* v = u + at */
            v += delta * a;

            /* x += vt */
            x += delta * v;

            // Add delta to total time of flight...
            timeElapsed += delta;
        }
    }

    postMessage(message: WorkerHelper.Message): void {
        return WorkerHelper.postWorkerMessage(globalThis, message);
    }
}

(function () {

    WorkerHelper.addWorkerMessageListener(
        globalThis,
        function (message) {
            if(message.type === "start") {
                new Simulation(message.parameters).run();
            }
        }
    );

})();

