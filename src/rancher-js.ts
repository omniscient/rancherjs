import fetch from 'node-fetch';

export class RancherJs {
  public apiVersion: string;

  private base64encodedData: string;
  private url: string;
  private commonHeaders: any;

  constructor(rancherUrl: string, user: string, password: string) {
    this.apiVersion = '/v2-beta';
    // basic auth token
    this.base64encodedData = new Buffer(user + ':' + password).toString('base64');
    this.url = rancherUrl + this.apiVersion;
    this.commonHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Basic ' + this.base64encodedData
    };
  }

  public async getEnvironment(environmentName: string): Promise<any> {
    const getEnvironmentUrl: string = this.url + '/environments?name=' + environmentName;
    const response = await fetch(getEnvironmentUrl, {
      method: 'get',
      headers: this.commonHeaders,
    });
    const data = await response.json();
    return Promise.resolve(data['data'][0]);
  }

  /**
   * Gets the definition of service within the Rancher server
   * @param serviceName The rancher service name that you see in the UI
   */
  public async getService(serviceName: string): Promise<any> {
    const getServiceUrl: string = this.url + '/services?name=' + serviceName;
    const response = await fetch(getServiceUrl, {
      method: 'get',
      headers: this.commonHeaders,
    });

    const data = await response.json();
    return Promise.resolve(data['data'][0]);
  }

  /**
   * Upgrades the service within the Rancher server
   * @param serviceName The rancher service name that you see in the UI that needs to be upgraded
   */
  public async upgrade(serviceName: string): Promise<any> {
    let service = await this.getService(serviceName);
    const baseServiceUrl: string = this.url + '/services/' + service.id;
    const currentLaunchConfig = service.launchConfig;
    const payload = {
      inServiceStrategy: {
        batchSize: 1,
        intervalMillis: 2000,
        startFirst: true,
        launchConfig: currentLaunchConfig
      }
    };

    // We are trying to upgrade but the service state is 'upgraded' indicating an unfinish upgrade, finish it
    if (service.state === 'upgraded') {
      try {
        const upgradeStatus = await this.completeUpgrade(baseServiceUrl, serviceName);
        if (upgradeStatus !== 'active') {
          return Promise.reject(`${serviceName} - Could not complete Service upgrade. It ended with state ${upgradeStatus}`);
        }
        this.log(serviceName, `Last unfinished upgrade was completed succcesfully`);

      } catch (e) {
        return Promise.reject(`${serviceName} - There was a problem completing the upgrade. Error: ${e}`);
      }
    } else if (service.state !== 'active') {
      return Promise.reject(`${serviceName} - Cannot be updated due to its current state ${service.state}`);
    }

    const upgradeServiceUrl: string = this.url + '/services/' + service.id + '?action=upgrade';
    await fetch(upgradeServiceUrl, {
      method: 'post',
      headers: this.commonHeaders,
      body: JSON.stringify(payload)
    });

    service = await this.getService(serviceName);
    if (service.state !== 'upgrading') {
      return Promise.reject(`${serviceName} - Upgrade request for didn\'t work. The current status is : ${service.state}`);
    }

    await this.waitForStatus(serviceName, 'upgraded');

    return Promise.resolve(`Service ${serviceName} upgraded`);
  };

  private async completeUpgrade(baseServiceUrl: string, serviceName: string): Promise<string> {
    this.log(serviceName, `Previous service upgrade wasn\'t completed. Completing it now...`);
    const finishServiceUpgradeUrl = baseServiceUrl + '?action=finishupgrade';
    await fetch(finishServiceUpgradeUrl, {
      method: 'post',
      headers: this.commonHeaders
    });

    return await this.waitForStatus(serviceName, 'active');
  }

  private async waitForStatus(serviceName: string, statusToWaitFor: string): Promise<string> {
    let state = '';
    let retry = 15;

    this.log(serviceName, `Waiting for status ${statusToWaitFor}`);
    while (state !== statusToWaitFor) {
      const service = await this.getService(serviceName);
      state = service.state;
      retry -= 1;
      if (retry <= 0) {
        return Promise.reject(`${serviceName} - Took too long to upgrade`);
      }
      this.log(serviceName, `...`);
      await this.sleep(5000);
    }

    return Promise.resolve(state);
  }

  private sleep(ms: number): Promise<any> {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  }

  private log(serviceName: string, message: string) {
    console.log(`${serviceName} - ` + message);
  }
}
