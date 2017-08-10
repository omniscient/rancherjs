"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = require("node-fetch");
class RancherJs {
    constructor(rancherUrl, user, password) {
        this.apiVersion = '/v2-beta';
        this.base64encodedData = new Buffer(user + ':' + password).toString('base64');
        this.url = rancherUrl + this.apiVersion;
        this.commonHeaders = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + this.base64encodedData
        };
    }
    getEnvironment(environmentName) {
        return __awaiter(this, void 0, void 0, function* () {
            const getEnvironmentUrl = this.url + '/environments?name=' + environmentName;
            const response = yield node_fetch_1.default(getEnvironmentUrl, {
                method: 'get',
                headers: this.commonHeaders,
            });
            const data = yield response.json();
            return Promise.resolve(data['data'][0]);
        });
    }
    getService(serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            const getServiceUrl = this.url + '/services?name=' + serviceName;
            const response = yield node_fetch_1.default(getServiceUrl, {
                method: 'get',
                headers: this.commonHeaders,
            });
            const data = yield response.json();
            return Promise.resolve(data['data'][0]);
        });
    }
    upgrade(serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            let service = yield this.getService(serviceName);
            const baseServiceUrl = this.url + '/services/' + service.id;
            const currentLaunchConfig = service.launchConfig;
            const payload = {
                inServiceStrategy: {
                    batchSize: 1,
                    intervalMillis: 2000,
                    startFirst: true,
                    launchConfig: currentLaunchConfig
                }
            };
            if (service.state === 'upgraded') {
                try {
                    const upgradeStatus = yield this.completeUpgrade(baseServiceUrl, serviceName);
                    if (upgradeStatus !== 'active') {
                        return Promise.reject(`${serviceName} - Could not complete Service upgrade. It ended with state ${upgradeStatus}`);
                    }
                    this.log(serviceName, `Last unfinished upgrade was completed succcesfully`);
                }
                catch (e) {
                    return Promise.reject(`${serviceName} - There was a problem completing the upgrade. Error: ${e}`);
                }
            }
            else if (service.state !== 'active') {
                return Promise.reject(`${serviceName} - Cannot be updated due to its current state ${service.state}`);
            }
            const upgradeServiceUrl = this.url + '/services/' + service.id + '?action=upgrade';
            yield node_fetch_1.default(upgradeServiceUrl, {
                method: 'post',
                headers: this.commonHeaders,
                body: JSON.stringify(payload)
            });
            service = yield this.getService(serviceName);
            if (service.state !== 'upgrading') {
                return Promise.reject(`${serviceName} - Upgrade request for didn\'t work. The current status is : ${service.state}`);
            }
            yield this.waitForStatus(serviceName, 'upgraded');
            return Promise.resolve(`Service ${serviceName} upgraded`);
        });
    }
    ;
    completeUpgrade(baseServiceUrl, serviceName) {
        return __awaiter(this, void 0, void 0, function* () {
            this.log(serviceName, `Previous service upgrade wasn\'t completed. Completing it now...`);
            const finishServiceUpgradeUrl = baseServiceUrl + '?action=finishupgrade';
            yield node_fetch_1.default(finishServiceUpgradeUrl, {
                method: 'post',
                headers: this.commonHeaders
            });
            return yield this.waitForStatus(serviceName, 'active');
        });
    }
    waitForStatus(serviceName, statusToWaitFor) {
        return __awaiter(this, void 0, void 0, function* () {
            let state = '';
            let retry = 15;
            this.log(serviceName, `Waiting for status ${statusToWaitFor}`);
            while (state !== statusToWaitFor) {
                const service = yield this.getService(serviceName);
                state = service.state;
                retry -= 1;
                if (retry <= 0) {
                    return Promise.reject(`${serviceName} - Took too long to upgrade`);
                }
                this.log(serviceName, `...`);
                yield this.sleep(5000);
            }
            return Promise.resolve(state);
        });
    }
    sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }
    log(serviceName, message) {
        console.log(`${serviceName} - ` + message);
    }
}
exports.RancherJs = RancherJs;
