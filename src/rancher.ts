#! /usr/bin/env node

import { RancherJs } from './rancher-js';
import * as commander from 'commander';

commander
  .version('0.0.2')
  .option('-s, --server <str>', 'Rancher server URL. ex: https://my.rancher.com')
  .option('-u, --user <str>', 'Rancher Api User name')
  .option('-p, --password <str>', 'Rancher Api key')
  .option('-t, --timeout <n>', 'Overrides the default timeout of 60 seconds on CLI commands', parseInt)

commander
   .command('upgrade <service> [otherServices...]')
   .description('run remote upgrade of one of multiple services by name')
   .action((service: string, otherServices?: Array<string>) => {
     let services: Array<string> = [];
     services.push(service);
     if (otherServices) services = services.concat(otherServices);
     
     console.log(`Starting the upgrade of these services: ${JSON.stringify(services)}`);
     const rancher = initRancher();
     console.log(JSON.stringify(rancher));
     services.forEach(service => {
       rancher.upgrade(service).then(result => {
        console.log(`Upgrade success: ${result}`);
      }, error => {
        console.log(`Upgrade failed: ${error}`);
      });
     });
   });

commander.parse(process.argv);

function initRancher(): RancherJs {
  const rancher = new RancherJs(commander['server'], commander['user'], commander['password']);
  if (commander['timeout']) rancher.timeout = commander['timeout'];
  return rancher;
}
