const Axios = require('axios')
const { ethers } = require('ethers')
const SPENDER_1INCH = '0x1111111254eeb25477b68fb85ed929f73a960582' // by default approval would go to this address

const approveUrl = (chain) => `https://api.1inch.io/v5.0/${chain}/approve/transaction`;
const swapUrl = (chain) => `https://api.1inch.dev/swap/v5.2/${chain}/swap`;

const isERC20 = (token) => token === 'USDC' || token === 'USDT';

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

    // swap token1 into gas token on chain1
    console.log("getting swap tx for gas token... ")
    let swap2GasTransactionResp = await Axios.get(swapUrl(tokenChain1), {
      params: {
        src: swapData.tokenAddress1,
        dst: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
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
    console.log("ok got swap tx for gas token...: ", swap2GasTransactionResp.data)

    // txs.push(swap2GasTransactionResp.data.tx);
    txs.push({
      success: true,
      context: `This transactions would swap your ${swapData.amount} of {matic} token against gas token.`,
      transaction: transactions
    });
    

    // bridge gas token from chain1 to chain2
    let swapTransactionResp = await Axios.get(swapUrl(chain), {
      params: {
        src: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
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

    txs.push({
      success: true,
      context: `This transactions would swap your gas token against ${swapData.pair[1]}.`,
      transaction: transactions
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

  const chain = swapData.chain;

  console.log("swapData.tokenChain1: ", swapData.tokenChain1)
  console.log("swapData.tokenChain2: ", swapData.tokenChain2)

  if (swapData.tokenChain1 && swapData.tokenChain2) {
    console.log("=======🤡🤡🤡🤡🤡🤡🤡🤡========")
    const txs = [];
    const tokenChain1 = swapData.tokenChain1;
    const tokenChain2 = swapData.tokenChain2;

    // use axelar to bridge token from chain1 to chain2
    console.log("getting bridge tx for token... ")
    
    // 
    

    return txs;
  } 

  let transactions = [];
  console.log('this is swap data ', swapData);

  // first give approval to 1inch router for the transaction
  let approvalTxnResp = await Axios.get(approveUrl(chain), {
    params: {
      tokenAddress: swapData.tokenAddress1,
      amount: ethers.utils
      .parseUnits(swapData.amount, 6)
      .toString()
    }
  });

  transactions.push(approvalTxnResp.data);
  // console.log(approvalTxnResp.data);
  console.log('these are params ', {
    fromTokenAddress: swapData.tokenAddress1,
    toTokenAddress: swapData.tokenAddress2,
    amount: ethers.utils
    .parseUnits(swapData.amount, 6)
    .toString(),
    fromAddress: swapData.userAddress,
    slippage: 40, // hardcoding it for now
    disableEstimate: true,
    // destReceiver: swapData.userAddress
  })
  // swap transction
  let swapTransactionResp = await Axios.get(swapUrl(chain), {
    params: {
      fromTokenAddress: swapData.tokenAddress1,
      toTokenAddress: swapData.tokenAddress2,
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

  console.log(swapTransactionResp)

  const swapTxns = {
    to: swapTransactionResp.data.tx.to,
    value: swapTransactionResp.data.tx.value,
    data: swapTransactionResp.data.tx.data,
    gasPrice: swapTransactionResp.data.tx.gasPrice
  }

  transactions.push(swapTxns);
  console.log("this is transactions length: ", transactions.length)

  return {
    success: true,
    context: `The first transaction would take approval for ${swapData.amount} of ${swapData.pair[0]} token and then it would swap ${swapData.amount} of ${swapData.pair[0]} token for best rates`,
    transaction: transactions
  }
}

module.exports = { constructSwapTransaction }