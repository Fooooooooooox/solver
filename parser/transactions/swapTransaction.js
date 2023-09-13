const Axios = require('axios')
const { ethers } = require('ethers')
const SPENDER_1INCH = '0x1111111254eeb25477b68fb85ed929f73a960582' // by default approval would go to this address
const tokenAbi = require("../abi/USDCTokenAbi.json");

const approveUrl = (chain) => `https://api.1inch.io/v5.0/${chain}/approve/transaction`;
const swapUrl = (chain) => `https://api.1inch.dev/swap/v5.2/${chain}/swap`;

const {
  AxelarQueryAPI,
  AxelarAssetTransfer,
  CHAINS,
  Environment,
} = require("@axelar-network/axelarjs-sdk");

const isERC20 = (token) => token === 'USDC' || token === 'USDT';
const sdk = new AxelarAssetTransfer({
  environment: Environment.TESTNET
});

const constructSwapTransaction = (swapData) => {
  // console.log('this is swap data', swapData);
  const pair = swapData.pair;

  console.log("hhhhhh here constructSwapTransaction: ", swapData)

  if(isERC20(pair[0])) {
    console.log("hhhhhhhh 💩💩💩💩💩💩💩💩💩")
    return constructERC20SwapTransaction(swapData);
  }
  else return constructNormalSwapTransaction(swapData);
}

const constructNormalSwapTransaction = async (swapData) => {
  let transactions = [];
  console.log("swapData.tokenChain1: ", swapData.tokenChain1)
  console.log("swapData.tokenChain2: ", swapData.tokenChain2)

  if (swapData.tokenChain1 && swapData.tokenChain2) {
    console.log("=======🤯🤯🤯🤯🤯🤯========")
    const txs = [];
    const tokenChain1 = swapData.tokenChain1;
    const tokenChain2 = swapData.tokenChain2;

    // swap token on chain 1 first
    let swapTransactionResp1 = await Axios.get(swapUrl(5), {
      params: {
        src: "0x2f3A40A3db8a7e3D09B0adfEfbCe4f6F81927557",
        dst: "0x509Ee0d083DdF8AC028f2a56731412edD63223B9",
        amount: ethers.utils
        .parseUnits(swapData.amount, 18)
        .toString(),
        from: swapData.userAddress,
        slippage: 1, // hardcoding it for now
        disableEstimate: true,
      },
      headers: {
        accept: 'application/json',
        Authorization: 'Bearer RVGJIAYSkmSHXtIHVbSYls52MMCZu6sm',
      },
    });
    // console.log("here we are , this is swapTransactionResp data: ", swapTransactionResp.data)
  
    const swapTxn = {
      to: swapTransactionResp1.data.tx.to,
      value: swapTransactionResp1.data.tx.value,
      data: swapTransactionResp1.data.tx.data
    }
  
    transactions.push(swapTxn);
    
    // bridge token2 from chain1 to chain2
    // get deposit address
    const fromChain = CHAINS.TESTNET.ETHEREUM;
    const toChain = CHAINS.TESTNET.OPTIMISM;
    const destinationAddress = swapData.userAddress;
    asset = "uausdc";  // denom of asset. See note (2) below
    fromTokenAddress = "0x254d06f33bDc5b8ee05b2ea472107E300226659A"
    const depositAddress = await sdk.getDepositAddress({
      fromChain,
      toChain,
      destinationAddress,
      asset
    });

    console.log("this is deposit: ", depositAddress)
    // form a send transaction to the deposit address
    const transferCode = new ethers.utils.Interface(tokenAbi).encodeFunctionData('transfer', [depositAddress, ethers.utils.parseEther(swapData.amount)])
    transactions.push({
      to: depositAddress,
      data: transferCode,
      value: 0
    });
    return txs;
  } 

  console.log('this is chain ', chain);
  console.log("this is swap url: ", swapUrl(chain)) 
    // swap transction
  let swapTransactionResp = await Axios.get(swapUrl(chain), {
    params: {
      src: swapData.tokenAddress1,
      dst: swapData.tokenAddress2,
      amount: ethers.utils
      .parseUnits(swapData.amount, 18)
      .toString(),
      from: swapData.userAddress,
      slippage: 1, // hardcoding it for now
      disableEstimate: true,
    },
    headers: {
      accept: 'application/json',
      Authorization: 'Bearer RVGJIAYSkmSHXtIHVbSYls52MMCZu6sm',
    },
  });
  // console.log("here we are , this is swapTransactionResp data: ", swapTransactionResp.data)

  const swapTxn = {
    to: swapTransactionResp.data.tx.to,
    value: swapTransactionResp.data.tx.value,
    data: swapTransactionResp.data.tx.data
  }

  transactions.push(swapTxn);
  console.log("this is transactions: ", transactions)

  console.log("thesre are txns ", transactions)

  return {
    success: true,
    context: `This transactions would swap your ${swapData.amount} of matic token against ${swapData.pair[1]} token.`,
    transaction: transactions
  }
};

const constructERC20SwapTransaction = async (swapData) => {
  /**
   * Data we need
   * 1. token pair // default to USDC and USDT
   * 2. token amount // by user
   */
  let transactions = [];

  // first give approval to 1inch router for the transaction
  // todo: chain here is hardcoded to polygon
  let approvalTxnResp = await Axios.get(approveUrl(1), {
    params: {
      tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      amount: ethers.utils
      .parseUnits(swapData.amount, 6)
      .toString()
    }
  });

  transactions.push(approvalTxnResp.data);

  console.log("this is approval txn resp: ", approvalTxnResp.data)
  let swapTransactionResp = await Axios.get(swapUrl(1), {
    params: {
      fromTokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      toTokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      amount: ethers.utils
      .parseUnits(swapData.amount, 6)
      .toString(),
      fromAddress: swapData.userAddress,
      slippage: 40, // hardcoding it for now
      disableEstimate: true,
      // destReceiver: swapData.userAddress
    },
    headers: {
      'accept': 'application/json',
      'Authorization': 'Bearer RVGJIAYSkmSHXtIHVbSYls52MMCZu6sm'
    }
  })
  console.log("successfully got swap transaction resp: ", swapTransactionResp.data)

  console.log(swapTransactionResp)

  const swapTxns = {
    to: swapTransactionResp.data.tx.to,
    value: swapTransactionResp.data.tx.value,
    data: swapTransactionResp.data.tx.data,
    gasPrice: swapTransactionResp.data.tx.gasPrice
  }

  transactions.push(swapTxns);
  console.log("this is transactions length: ", transactions.length)

  // transactions.push({ 
  //   success: true,
  //   context: `The first transaction would take approval for ${swapData.amount} of ${swapData.pair[0]} token and then it would swap ${swapData.amount} of ${swapData.pair[0]} token for best rates`,
  //   transaction: transactions
  // })


  console.log("swapData.tokenChain1: ", swapData.tokenChain1)
  console.log("swapData.tokenChain2: ", swapData.tokenChain2)

  // if cross chain add a bridge transaction
  if (swapData.tokenChain1 && swapData.tokenChain2) {
    console.log("=======🤡🤡🤡🤡🤡🤡🤡🤡======== adding cross chain tx")
    const tokenChain1 = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const tokenChain2 = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
    // use axelar to bridge token from chain1 to chain2
    console.log("getting bridge tx for token... ")
    
    const fromChain = CHAINS.TESTNET.ETHEREUM,
    toChain = CHAINS.TESTNET.OPTIMISM,
    destinationAddress = "0xb15115A15d5992A756D003AE74C0b832918fAb75",
    asset = "uausdc";  // denom of asset. See note (2) below

    const depositAddress = await sdk.getDepositAddress({
        fromChain,
        toChain,
        destinationAddress,
        asset
    });
    console.log("this is deposit address: ", destinationAddress)
    // note: next swap should wait util the bridge is done(bundler should do the check)
    // form a send transaction to the deposit address
    const transferCode = new ethers.utils.Interface(tokenAbi).encodeFunctionData('transfer', [destinationAddress, ethers.utils.parseEther(swapData.amount)])
    transactions.push({
      to: depositAddress,
      data: transferCode,
      value: 0
    });

  } 
  return transactions;
  // swap transaction

}

module.exports = { constructSwapTransaction }