const {  sdkCache, util } = require('@defillama/sdk');
const { getLogs } = require('../helper/cache/getLogs');
const { default: BigNumber } = require('bignumber.js');

const config = {
  arbitrum: {
    dsu: '0x52c64b8998eb7c80b6f526e99e29abdcc86b841b',
    usdc: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    factory: '0xDaD8A103473dfd47F90168A0E46766ed48e26EC7',
    fromBlock: 135921706,
  },
};

Object.keys(config).forEach((chain) => {
  const { factory, fromBlock, dsu, usdc } = config[chain];
  module.exports[chain] = {
    tvl: async (api) => {
      const logs = await getLogs({
        api,
        target: factory,
        eventAbi: 'event InstanceRegistered (address indexed instance)',
        onlyArgs: true,
        fromBlock,
      });

      // Context: 
      // DSU is a wrapper for USDC. Redeemable from its reserve.
      // It doesn't have trading volume so Coingecko won't list it. 

      // Get DSU balance in all instances
      const sum = await api.sumTokens({
        tokensAndOwners: logs.map((log) => [dsu, log.instance]),
      });

      // Normalize DSU balance to USDC decimals
      const normalizedBalance =  BigNumber(sum[`${chain}:${dsu}`]).div(10 ** 12)

      const balances = {};
      // Convert DSU balance to DSU's underlying reserve asset (USDC)
      util.sumSingleBalance(balances, `${chain}:${usdc}`, Number(normalizedBalance));
      return balances
    },
  };
});
