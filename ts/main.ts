/* 
 * Main Script File. 
 * ©abuco 2022
 */

import * as WorkerHelper from "./workerHelper.js";

(function () {

    const paramsForm = document.getElementById("params") as HTMLFormElement;
    const startButton = document.getElementById('start') as HTMLButtonElement;

    const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
    const canvasContext = canvas.getContext("2d")!;

    const output = document.getElementById("output") as HTMLElement;

    const worker = new Worker("js/worker.js", { type: "module" });


    class SimulationSession {
        readonly lineColour = { r: 0, g: 0, b: 0xff, a: 0.2 };
        private trialCount = 0;
        
        private readonly scale = { x: 100, y: 8 } as const;

        init(): void {
            const cxt = canvasContext;
            const targetX = this.scale.x * 7;

            cxt.strokeStyle = "orangered"
            cxt.lineWidth = 2;

            cxt.beginPath();
            cxt.moveTo(targetX, 0);
            cxt.lineTo(targetX, canvas.height);
            cxt.stroke();

            cxt.font = "12px Arial";
            cxt.fillText("t = 7", targetX + 5, 24);
        }

        processMessage(message: WorkerHelper.Message): void {
            if (message.type === "update") {
                return this.updateCanvas(message);
            }
            if (message.type === "done") {
                return this.completeSimulation(message);
            }
        }

        updateCanvas(message: WorkerHelper.UpdateMessage): void {
            const cxt = canvasContext;

            const plot = {
                x: message.result.t * this.scale.x,
                y: canvas.height - message.result.x * this.scale.y,
            } as const;

            cxt.lineTo(plot.x, plot.y);

            if (message.result.x < 0) {
                cxt.stroke();
                cxt.beginPath();
                cxt.moveTo(0, canvas.height);
                this.trialCount++;
                log(`Trial #${this.trialCount}: ` +
                    `v0 = ${message.vInit} m/s, time = ${message.result.t} s.`);
            }
        }

        completeSimulation(message: WorkerHelper.DoneMessage): void {
            canvasContext.beginPath();
            canvasContext.moveTo(0, 0);
            log(`[Simulation completed at ${new Date()}]`);
            log("Result: -------------------------------")
            log(`Initial Velocity = ${message.vInit}±${message.uncertainty} m/s`);
            log(`Time of Flight: ${message.timeOfFlight} s`);
            log(`Final Step Leap: |${message.finalLeap}| m/s`);
        }

        reset() {
            const c = this.lineColour;
            const ctx = canvasContext;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            this.trialCount = 0;

            this.init();

            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;

            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
        }
    }

    const simulationSession = new SimulationSession();

    paramsForm.onsubmit = ((e) => {
        e.preventDefault();
        return false;
    });

    startButton.addEventListener("click", (e) => {
        e.preventDefault();

        if(!paramsForm.reportValidity()) {
            return false;
        }
        
        function getFormElement<
            T extends HTMLElement = HTMLInputElement
        >(name: string): T | null {
            return paramsForm.elements.namedItem(name) as T | null;
        };

        const parameters: WorkerHelper.Parameters = {
            delta: parseFloat(getFormElement("dt")!.value),
            targetTime: parseFloat(getFormElement("t")!.value),
            stepsPerTick: parseInt(getFormElement("steps-per-tick")!.value),
            initialVInit: parseFloat(getFormElement("v-init")!.value),
            maxResultRange: parseFloat(getFormElement("max-v-range")!.value),
            initialLeap: parseFloat(getFormElement("initial-leap")!.value),
            leapReductionFactor: parseFloat(getFormElement("leap-factor")!.value)
        }

        for(const key in parameters) {
            if(Object.prototype.hasOwnProperty.call(parameters, key)) {
                const value: unknown = (<any>parameters)[key];
                if(!value) {
                    // Zero or falsey...
                    alert(`Invalid value for [${key}]: ${value}!`);
                    return false;
                }
            }
        }

        if (parameters.delta > 0.1 && parameters.maxResultRange < parameters.delta * 4) {
            alert("Too small an uncertainty range for this delta t value!");
            return false;
        }

        start(parameters);
    });

    WorkerHelper.addWorkerMessageListener(
        worker,
        (message) => void simulationSession.processMessage(message)
    );
    
    simulationSession.init();

    return;

    function log(message: string): void {
        output.appendChild(document.createTextNode(message + '\n'));
    }

    function start(parameters: WorkerHelper.Parameters): void {
        log(`[Started simulation at ${new Date()}]`);

        simulationSession.reset();

        WorkerHelper.postWorkerMessage(worker, {
            type: "start",
            parameters
        });
    }

})();

