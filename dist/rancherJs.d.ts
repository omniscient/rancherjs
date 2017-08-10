export declare class Rancher {
    apiVersion: string;
    private base64encodedData;
    private url;
    private commonHeaders;
    constructor(rancherUrl: string, user: string, password: string);
    getEnvironment(environmentName: string): Promise<any>;
    getService(serviceName: string): Promise<any>;
    upgrade(serviceName: string): Promise<any>;
    private completeUpgrade(baseServiceUrl, serviceName);
    private waitForStatus(serviceName, statusToWaitFor);
    private sleep(ms);
    private log(serviceName, message);
}
