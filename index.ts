require('dotenv').config();
import * as fs from 'fs';
import * as glob from 'glob';

import { TezosConseilClient, TezosWalletUtil, TezosNodeWriter, BabylonDelegationHelper, setLogLevel, TezosParameterFormat, KeyStore, OperationKindType, TezosNodeReader, TezosContractIntrospector } from 'conseiljs';
import { ConseilQueryBuilder, ConseilOperator, ConseilSortDirection, ConseilDataClient } from 'conseiljs';

setLogLevel('debug');

const tezosNode = process.env.NAUTILUS_TEZOS_BABYLONNET_NODE_URL;
const conseilServer = {
  url: `${process.env.NAUTILUS_CONSEIL_BABYLONNET_NODE_URL}:${process.env.NAUTILUS_CONSEIL_BABYLONNET_NODE_PORT}`,
  apiKey: process.env.NAUTILUS_API_KEY,
  network: 'babylonnet'
};
const networkBlockTime = 30 + 1;

let faucetAccount = {};
let keystore: KeyStore;
let contractAddress: string;
let delegationContractAddress: string;
const bakerAddress = 'tz1LhS2WFCinpwUTdUb991ocL2D9Uk6FJGJK';
const anotherBakerAddress = 'tz1RR6wETy9BeXG3Fjk25YmkSMGHxTtKkhpX';
const accountAddress = 'tz1VzgBaYF9XpjnJzXhJ6JEg1fVghokQzRZW';
const anotherAccountAddress = 'tz1RVcUP9nUurgEJMDou8eW3bVDs6qmP5Lnc';

function clearRPCOperationGroupHash(hash: string) {
    return hash.replace(/\"/g, '').replace(/\n/, '');
}

async function initAccount(): Promise<KeyStore> {
    console.log('~~ initAccount');
    let faucetFiles: string[] = glob.sync('./faucet-account/tz1*.json');

    if (faucetFiles.length === 0) {
        throw new Error('Did not find any faucet files, please go to faucet.tzalpha.net to get one');
    }

    console.log(`loading ${faucetFiles[0]} faucet file`);
    faucetAccount = JSON.parse(fs.readFileSync(faucetFiles[0], 'utf8'));

    const keystore = await TezosWalletUtil.unlockFundraiserIdentity(faucetAccount['mnemonic'].join(' '), faucetAccount['email'], faucetAccount['password'], faucetAccount['pkh']);
    console.log(`public key: ${keystore.publicKey}`);
    // FIXME - rename privateKey to secretKey
    console.log(`secret key: ${keystore.privateKey}`);
    console.log(`account hash: ${keystore.publicKeyHash}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

    return keystore;
}

async function activateAccount(): Promise<string> {
    console.log(`~~ activateAccount`);
    const accountRecord = await TezosConseilClient.getAccount(conseilServer, conseilServer.network, keystore.publicKeyHash);
    if (accountRecord !== undefined) { return accountRecord['account_id']; }

    const nodeResult = await TezosNodeWriter.sendIdentityActivationOperation(tezosNode, keystore, faucetAccount['secret']);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected activation operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Activated account at ${conseilResult.pkh}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return conseilResult.pkh;
}

async function revealAccount(): Promise<string> {
    console.log(`~~ revealAccount`);
    // Check if it has been revealed
    if (await TezosNodeReader.isManagerKeyRevealedForAccount(tezosNode, keystore.publicKeyHash)) {
        return keystore.publicKeyHash;
    }

    const nodeResult = await TezosNodeWriter.sendKeyRevealOperation(tezosNode, keystore);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected reveal operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Revealed account at ${conseilResult.source}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return conseilResult.source;
}

async function sendTransaction() {
    console.log(`~~ sendTransaction: 500000µtz from ${keystore.publicKeyHash} into ${accountAddress}`);
    const nodeResult = await TezosNodeWriter.sendTransactionOperation(tezosNode, keystore, accountAddress, 500000, 1500, '');
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected transaction operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Completed transfer of ${conseilResult.amount}µtz`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

async function delegatePrimaryAccount() {
    console.log(`~~ delegatePrimaryAccount`);
    const nodeResult = await BabylonDelegationHelper.setDelegate(tezosNode, keystore, keystore.publicKeyHash, bakerAddress, 20000);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected delegation operation with ${groupid}`);

    await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

async function deployDelegationContract(): Promise<string> {
    console.log(`~~ deployDelegationContract: from ${keystore.publicKeyHash} to ${anotherBakerAddress} with 500000µtz`);
    const nodeResult = await BabylonDelegationHelper.deployManagerContract(tezosNode, keystore, anotherBakerAddress, 20000, 500000);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected origination operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Originated contract at ${conseilResult.originated_contracts}, delegated to ${conseilResult.delegate}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return conseilResult.originated_contracts;
}

async function depositDelegatedFunds() {
    console.log(`~~ depositDelegatedFunds: 5 xtz from ${keystore.publicKeyHash} into ${delegationContractAddress}`);
    const nodeResult = await BabylonDelegationHelper.depositDelegatedFunds(tezosNode, keystore, delegationContractAddress, 20000, 5000000);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected an operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Completed transfer of ${conseilResult.amount}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

async function sendDelegatedFunds() {
    console.log(`~~ sendDelegatedFunds: 500000µtz from ${delegationContractAddress} into ${anotherAccountAddress}`);
    const nodeResult = await BabylonDelegationHelper.sendDelegatedFunds(tezosNode, keystore, delegationContractAddress, 20000, 500000, undefined, anotherAccountAddress);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected an operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Completed transfer of ${conseilResult.amount}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

async function delegationContractWithdraw() {
    console.log(`~~ delegationContractWithdraw: 500000µtz from ${delegationContractAddress} into ${keystore.publicKeyHash}`);
    const nodeResult = await BabylonDelegationHelper.withdrawDelegatedFunds(tezosNode, keystore, delegationContractAddress, 20000, 500000);
    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected an operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Completed transfer of ${conseilResult.amount}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

async function deployMichelineContract(): Promise<string> {
    console.log(`~~ deployMichelineContract`);
    const contract = `[
        { "prim":"parameter", "args":[ { "prim":"string" } ] },
        { "prim":"storage", "args":[ { "prim":"string" } ] },
        {
           "prim":"code",
           "args":[
              [  
                 { "prim":"CAR" },
                 { "prim":"NIL", "args":[ { "prim":"operation" } ] },
                 { "prim":"PAIR" }
              ]
           ]
        }
     ]`;
    const storage = '{"string": "Sample"}';

    const storageCost = 1000;
    const gasCost = 100000;
    const nodeResult = await TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined, 100000, '', storageCost, gasCost, contract, storage, TezosParameterFormat.Micheline);
    const groupid = clearRPCOperationGroupHash(nodeResult['operationGroupID']);
    console.log(`Injected origination operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Originated contract at ${conseilResult.originated_contracts}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return conseilResult.originated_contracts;
}

async function deployMichelsonContract(): Promise<string> {
    console.log(`~~ deployMichelsonContract`);
    // Interface definition
    // Storage cost is not included in the transaction cost
    // Unit of gas is 1/10 of 1 microTez
    // Below is stack-based language
    const contract = `parameter string;
        storage string;
        code { DUP;
            DIP { CDR ; NIL string ; SWAP ; CONS } ;
            CAR ; CONS ;
            CONCAT;
            NIL operation; PAIR}`;
    // Initialise the state of the storage
    const storage = '"Sample"';

    const fee = Number((await TezosConseilClient.getFeeStatistics(conseilServer, conseilServer.network, OperationKindType.Origination))[0]['high']);

    const derivationPathForLedgerDevices = '';
    const storageCost = undefined;
    const nodeResult = await TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, storageCost, fee, derivationPathForLedgerDevices, 1000, 100000, contract, storage, TezosParameterFormat.Michelson);
    const groupid = clearRPCOperationGroupHash(nodeResult['operationGroupID']);
    console.log(`Injected origination operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Originated contract at ${conseilResult.originated_contracts}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
    return conseilResult.originated_contracts;
}

async function invokeContract(address: string, parameter: string, entrypoint: string = '') {
    console.log(`~~ invokeContract`);
    const fee = Number((await TezosConseilClient.getFeeStatistics(conseilServer, conseilServer.network, OperationKindType.Transaction))[0]['high']);

    let storageResult = await TezosNodeReader.getContractStorage(tezosNode, address);
    console.log(`initial storage: ${JSON.stringify(storageResult)}`);

    const derivationPathForLedgerDevices = '';
    const storageCost = 10000;
    const { gas, storageCost: freight } = await TezosNodeWriter.testContractInvocationOperation(tezosNode, 'main', keystore, address, storageCost, fee, derivationPathForLedgerDevices, 1000, 100000, entrypoint, parameter, TezosParameterFormat.Micheline);

    console.log(`cost: ${JSON.stringify(await TezosNodeWriter.testContractInvocationOperation(tezosNode, 'main', keystore, address, storageCost, fee, derivationPathForLedgerDevices, 1000, 100000, entrypoint, parameter, TezosParameterFormat.Micheline))}`)
    const nodeResult = await TezosNodeWriter.sendContractInvocationOperation(tezosNode, keystore, address, storageCost, fee, derivationPathForLedgerDevices, freight, gas, entrypoint, parameter, TezosParameterFormat.Micheline);

    const groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
    console.log(`Injected transaction(invocation) operation with ${groupid}`);

    const conseilResult = await TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime);
    console.log(`Completed invocation of ${conseilResult.destination}`);
    storageResult = await TezosNodeReader.getContractStorage(tezosNode, address);
    console.log(`modified storage: ${JSON.stringify(storageResult)}`);
    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

async function run() {
    // Account initialization
    keystore = await initAccount(); // TODO: read/write settings
    await activateAccount();
    await revealAccount();

    // Basic operations
    await sendTransaction();
    await delegatePrimaryAccount();

    // Delegation operations
    delegationContractAddress = await deployDelegationContract();
    await depositDelegatedFunds();
    await sendDelegatedFunds();
    await delegationContractWithdraw();

    // Basic contract operations
    await deployMichelineContract();
    contractAddress = await deployMichelsonContract();
    await invokeContract(contractAddress, 'new text');
}

run();
