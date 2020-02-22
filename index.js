"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
require('dotenv').config();
var fs = require("fs");
var glob = require("glob");
var conseiljs_1 = require("conseiljs");
conseiljs_1.setLogLevel('debug');
var tezosNode = process.env.NAUTILUS_TEZOS_BABYLONNET_NODE_URL;
var conseilServer = {
    url: process.env.NAUTILUS_CONSEIL_BABYLONNET_NODE_URL + ":" + process.env.NAUTILUS_CONSEIL_BABYLONNET_NODE_PORT,
    apiKey: process.env.NAUTILUS_API_KEY,
    network: 'babylonnet'
};
var networkBlockTime = 30 + 1;
var faucetAccount = {};
var keystore;
var contractAddress;
var delegationContractAddress;
var bakerAddress = 'tz1LhS2WFCinpwUTdUb991ocL2D9Uk6FJGJK';
var anotherBakerAddress = 'tz1RR6wETy9BeXG3Fjk25YmkSMGHxTtKkhpX';
var accountAddress = 'tz1VzgBaYF9XpjnJzXhJ6JEg1fVghokQzRZW';
var anotherAccountAddress = 'tz1RVcUP9nUurgEJMDou8eW3bVDs6qmP5Lnc';
function clearRPCOperationGroupHash(hash) {
    return hash.replace(/\"/g, '').replace(/\n/, '');
}
function initAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var faucetFiles, keystore;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('~~ initAccount');
                    faucetFiles = glob.sync('./faucet-account/tz1*.json');
                    if (faucetFiles.length === 0) {
                        throw new Error('Did not find any faucet files, please go to faucet.tzalpha.net to get one');
                    }
                    console.log("loading " + faucetFiles[0] + " faucet file");
                    faucetAccount = JSON.parse(fs.readFileSync(faucetFiles[0], 'utf8'));
                    return [4 /*yield*/, conseiljs_1.TezosWalletUtil.unlockFundraiserIdentity(faucetAccount['mnemonic'].join(' '), faucetAccount['email'], faucetAccount['password'], faucetAccount['pkh'])];
                case 1:
                    keystore = _a.sent();
                    console.log("public key: " + keystore.publicKey);
                    // FIXME - rename privateKey to secretKey
                    console.log("secret key: " + keystore.privateKey);
                    console.log("account hash: " + keystore.publicKeyHash);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/, keystore];
            }
        });
    });
}
function activateAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var accountRecord, nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ activateAccount");
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.getAccount(conseilServer, conseilServer.network, keystore.publicKeyHash)];
                case 1:
                    accountRecord = _a.sent();
                    if (accountRecord !== undefined) {
                        return [2 /*return*/, accountRecord['account_id']];
                    }
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.sendIdentityActivationOperation(tezosNode, keystore, faucetAccount['secret'])];
                case 2:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected activation operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 3:
                    conseilResult = _a.sent();
                    console.log("Activated account at " + conseilResult.pkh);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/, conseilResult.pkh];
            }
        });
    });
}
function revealAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ revealAccount");
                    return [4 /*yield*/, conseiljs_1.TezosNodeReader.isManagerKeyRevealedForAccount(tezosNode, keystore.publicKeyHash)];
                case 1:
                    // Check if it has been revealed
                    if (_a.sent()) {
                        return [2 /*return*/, keystore.publicKeyHash];
                    }
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.sendKeyRevealOperation(tezosNode, keystore)];
                case 2:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected reveal operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 3:
                    conseilResult = _a.sent();
                    console.log("Revealed account at " + conseilResult.source);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/, conseilResult.source];
            }
        });
    });
}
function sendTransaction() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ sendTransaction: 500000\u00B5tz from " + keystore.publicKeyHash + " into " + accountAddress);
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.sendTransactionOperation(tezosNode, keystore, accountAddress, 500000, 1500, '')];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected transaction operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    conseilResult = _a.sent();
                    console.log("Completed transfer of " + conseilResult.amount + "\u00B5tz");
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/];
            }
        });
    });
}
function delegatePrimaryAccount() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ delegatePrimaryAccount");
                    return [4 /*yield*/, conseiljs_1.BabylonDelegationHelper.setDelegate(tezosNode, keystore, keystore.publicKeyHash, bakerAddress, 20000)];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected delegation operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    _a.sent();
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/];
            }
        });
    });
}
function deployDelegationContract() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ deployDelegationContract: from " + keystore.publicKeyHash + " to " + anotherBakerAddress + " with 500000\u00B5tz");
                    return [4 /*yield*/, conseiljs_1.BabylonDelegationHelper.deployManagerContract(tezosNode, keystore, anotherBakerAddress, 20000, 500000)];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected origination operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    conseilResult = _a.sent();
                    console.log("Originated contract at " + conseilResult.originated_contracts + ", delegated to " + conseilResult.delegate);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/, conseilResult.originated_contracts];
            }
        });
    });
}
function depositDelegatedFunds() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ depositDelegatedFunds: 5 xtz from " + keystore.publicKeyHash + " into " + delegationContractAddress);
                    return [4 /*yield*/, conseiljs_1.BabylonDelegationHelper.depositDelegatedFunds(tezosNode, keystore, delegationContractAddress, 20000, 5000000)];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected an operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    conseilResult = _a.sent();
                    console.log("Completed transfer of " + conseilResult.amount);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/];
            }
        });
    });
}
function sendDelegatedFunds() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ sendDelegatedFunds: 500000\u00B5tz from " + delegationContractAddress + " into " + anotherAccountAddress);
                    return [4 /*yield*/, conseiljs_1.BabylonDelegationHelper.sendDelegatedFunds(tezosNode, keystore, delegationContractAddress, 20000, 500000, undefined, anotherAccountAddress)];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected an operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    conseilResult = _a.sent();
                    console.log("Completed transfer of " + conseilResult.amount);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/];
            }
        });
    });
}
function delegationContractWithdraw() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ delegationContractWithdraw: 500000\u00B5tz from " + delegationContractAddress + " into " + keystore.publicKeyHash);
                    return [4 /*yield*/, conseiljs_1.BabylonDelegationHelper.withdrawDelegatedFunds(tezosNode, keystore, delegationContractAddress, 20000, 500000)];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected an operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    conseilResult = _a.sent();
                    console.log("Completed transfer of " + conseilResult.amount);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/];
            }
        });
    });
}
function deployMichelineContract() {
    return __awaiter(this, void 0, void 0, function () {
        var contract, storage, storageCost, gasCost, nodeResult, groupid, conseilResult;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("~~ deployMichelineContract");
                    contract = "[\n        { \"prim\":\"parameter\", \"args\":[ { \"prim\":\"string\" } ] },\n        { \"prim\":\"storage\", \"args\":[ { \"prim\":\"string\" } ] },\n        {\n           \"prim\":\"code\",\n           \"args\":[\n              [  \n                 { \"prim\":\"CAR\" },\n                 { \"prim\":\"NIL\", \"args\":[ { \"prim\":\"operation\" } ] },\n                 { \"prim\":\"PAIR\" }\n              ]\n           ]\n        }\n     ]";
                    storage = '{"string": "Sample"}';
                    storageCost = 1000;
                    gasCost = 100000;
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined, 100000, '', storageCost, gasCost, contract, storage, conseiljs_1.TezosParameterFormat.Micheline)];
                case 1:
                    nodeResult = _a.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult['operationGroupID']);
                    console.log("Injected origination operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 2:
                    conseilResult = _a.sent();
                    console.log("Originated contract at " + conseilResult.originated_contracts);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/, conseilResult.originated_contracts];
            }
        });
    });
}
function deployMichelsonContract() {
    return __awaiter(this, void 0, void 0, function () {
        var contract, storage, fee, _a, nodeResult, groupid, conseilResult;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("~~ deployMichelsonContract");
                    contract = "parameter string;\n        storage string;\n        code { DUP;\n            DIP { CDR ; NIL string ; SWAP ; CONS } ;\n            CAR ; CONS ;\n            CONCAT;\n            NIL operation; PAIR}";
                    storage = '"Sample"';
                    _a = Number;
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.getFeeStatistics(conseilServer, conseilServer.network, conseiljs_1.OperationKindType.Origination)];
                case 1:
                    fee = _a.apply(void 0, [(_b.sent())[0]['high']]);
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.sendContractOriginationOperation(tezosNode, keystore, 0, undefined, fee, '', 1000, 100000, contract, storage, conseiljs_1.TezosParameterFormat.Michelson)];
                case 2:
                    nodeResult = _b.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult['operationGroupID']);
                    console.log("Injected origination operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 3:
                    conseilResult = _b.sent();
                    console.log("Originated contract at " + conseilResult.originated_contracts);
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/, conseilResult.originated_contracts];
            }
        });
    });
}
function invokeContract(address, parameter, entrypoint) {
    if (entrypoint === void 0) { entrypoint = ''; }
    return __awaiter(this, void 0, void 0, function () {
        var fee, _a, storageResult, _b, gas, freight, _c, _d, _e, _f, _g, nodeResult, groupid, conseilResult;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    console.log("~~ invokeContract");
                    _a = Number;
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.getFeeStatistics(conseilServer, conseilServer.network, conseiljs_1.OperationKindType.Transaction)];
                case 1:
                    fee = _a.apply(void 0, [(_h.sent())[0]['high']]);
                    return [4 /*yield*/, conseiljs_1.TezosNodeReader.getContractStorage(tezosNode, address)];
                case 2:
                    storageResult = _h.sent();
                    console.log("initial storage: " + JSON.stringify(storageResult));
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.testContractInvocationOperation(tezosNode, 'main', keystore, address, 10000, fee, '', 1000, 100000, entrypoint, parameter, conseiljs_1.TezosParameterFormat.Micheline)];
                case 3:
                    _b = _h.sent(), gas = _b.gas, freight = _b.storageCost;
                    _d = (_c = console).log;
                    _e = "cost: ";
                    _g = (_f = JSON).stringify;
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.testContractInvocationOperation(tezosNode, 'main', keystore, address, 10000, fee, '', 1000, 100000, entrypoint, parameter, conseiljs_1.TezosParameterFormat.Micheline)];
                case 4:
                    _d.apply(_c, [_e + _g.apply(_f, [_h.sent()])]);
                    return [4 /*yield*/, conseiljs_1.TezosNodeWriter.sendContractInvocationOperation(tezosNode, keystore, address, 10000, fee, '', freight, gas, entrypoint, parameter, conseiljs_1.TezosParameterFormat.Micheline)];
                case 5:
                    nodeResult = _h.sent();
                    groupid = clearRPCOperationGroupHash(nodeResult.operationGroupID);
                    console.log("Injected transaction(invocation) operation with " + groupid);
                    return [4 /*yield*/, conseiljs_1.TezosConseilClient.awaitOperationConfirmation(conseilServer, conseilServer.network, groupid, 5, networkBlockTime)];
                case 6:
                    conseilResult = _h.sent();
                    console.log("Completed invocation of " + conseilResult.destination);
                    return [4 /*yield*/, conseiljs_1.TezosNodeReader.getContractStorage(tezosNode, address)];
                case 7:
                    storageResult = _h.sent();
                    console.log("modified storage: " + JSON.stringify(storageResult));
                    console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
                    return [2 /*return*/];
            }
        });
    });
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initAccount()];
                case 1:
                    // Account initialization
                    keystore = _a.sent(); // TODO: read/write settings
                    return [4 /*yield*/, activateAccount()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, revealAccount()];
                case 3:
                    _a.sent();
                    // Basic operations
                    return [4 /*yield*/, sendTransaction()];
                case 4:
                    // Basic operations
                    _a.sent();
                    return [4 /*yield*/, delegatePrimaryAccount()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, deployDelegationContract()];
                case 6:
                    // Delegation operations
                    delegationContractAddress = _a.sent();
                    return [4 /*yield*/, depositDelegatedFunds()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, sendDelegatedFunds()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, delegationContractWithdraw()];
                case 9:
                    _a.sent();
                    // Basic contract operations
                    return [4 /*yield*/, deployMichelineContract()];
                case 10:
                    // Basic contract operations
                    _a.sent();
                    return [4 /*yield*/, deployMichelsonContract()];
                case 11:
                    contractAddress = _a.sent();
                    return [4 /*yield*/, invokeContract(contractAddress, 'new text')];
                case 12:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run();
