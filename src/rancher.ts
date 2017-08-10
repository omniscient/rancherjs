#! /usr/bin/env node

import { RancherJs } from './rancher-js';
import * as commander from 'commander';

function multiValueHandler(val: string, memo: string[]) {
  memo.push(val);
  return memo;
}

commander
  .version('0.0.1')
  .option('-r, --rancher <str>', 'Rancher server URL')
  .option('-u, --user <str>', 'Rancher Api User name')
  .option('-p, --password <str>', 'Rancher Api key')
  .option('-s, --service [value]', 'Rancher Service to be upgraded', multiValueHandler, [])
  .parse(process.argv);

const rancher = new RancherJs(commander['rancher'], commander['user'], commander['password']);
for (let index = 0; index < commander['service'].length; index++) {
  rancher.upgrade(commander['service'][index]).then(result => {
    console.log(`Upgrade success: ${result}`);
  }, error => {
    console.log(`Upgrade failed: ${error}`);
  });
}
