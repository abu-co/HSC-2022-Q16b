/*
 * Main Worker Helper Module.
 * ©abuco 2022
 */
;
export function postWorkerMessage(worker, message) {
    return worker.postMessage(message);
}
export function addWorkerMessageListener(target, listener) {
    return target.addEventListener("message", (ev) => {
        const e = ev;
        listener(e.data, e);
    });
}
//# sourceMappingURL=workerHelper.js.map