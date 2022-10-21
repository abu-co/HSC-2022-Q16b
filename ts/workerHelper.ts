/* 
 * Main Worker Helper Module. 
 * ©abuco 2022
 */

export interface Parameters {
    delta: number;
    targetTime: number;
    stepsPerTick: number;
    initialVInit: number;
    maxResultRange: number;
    initialLeap: number;
    leapReductionFactor: number;
}

export interface MessageBase {
    type: "start" | "update" | "done";
};

export interface StartMessage extends MessageBase {
    type: "start";
    parameters: Parameters;
}

export interface UpdateMessage extends MessageBase {
    type: "update";
    vInit: number;
    result: {
        t: number;
        x: number;
    };
}

export interface DoneMessage extends MessageBase {
    type: "done";
    timeOfFlight: number;
    uncertainty: number;
    vInit: number;
    finalLeap: number;
}

export type Message = StartMessage | UpdateMessage | DoneMessage;

export function postWorkerMessage(
    worker: Worker | typeof globalThis,
    message: Message,
): void {
    return worker.postMessage(message);
}

export function addWorkerMessageListener(
    target: EventTarget,
    listener: (message: Message, ev: MessageEvent<Message>) => void
): void {
    return target.addEventListener("message", (ev) => {
        const e = ev as MessageEvent<Message>;
        listener(e.data, e);
    });
}

