import * as ccfapp from "@microsoft/ccf-app";
import { ccf } from "@microsoft/ccf-app/global";

// TODO: Fix `any`s
type DepositRequest = any;
type DepositResponse = any;

interface LogItem {
  balance: number;
}

interface LogEntry extends LogItem {
  id: string;
}

// TODO: is this private?
const logMap = ccfapp.typedKv("accounts", ccfapp.string, ccfapp.json<LogItem>());

function validateUserId (userId: any): boolean {
  // TODO: Check type
  // TODO: Check if user exists
  return true;
}

export function deposit(
  request: ccfapp.Request<DepositRequest>
): ccfapp.Response<DepositResponse> {
  if (!validateUserId(request.params.user_id)) {
    return {
      statusCode: 404,
    };
  }

  // TODO: Need validate body (e.g. parse failed, is value integer?)
  let body = request.body.json();
  const value = parseInt(body.value);

  const userId = request.params.user_id;

  // TODO: Check if this is the good way to do transaction with read and write
  let balance = 0;
  if (logMap.has(userId))
  {
    balance += logMap.get(userId).balance;
  }

  // Add deposit value to balance
  balance += value;
  

  logMap.set(userId, { balance });

  // DELETE_ME: debug
  // return { body: { userId, balance } };

  return { body: "OK" };
}

// TODO: Fix `any`s
type BalanceRequest = any;
type BalanceResponse = any;

interface Caller {
  id: string
}

export function balance(
  request: ccfapp.Request<BalanceRequest>
): ccfapp.Response<BalanceResponse> {
  // TODO: Do it in a proper way
  const caller = request.caller as unknown as Caller;
  const userId = caller.id as string;

  // TODO: Duplicated 'Read current balance'
  let balance = 0;
  if (logMap.has(userId))
  {
    balance += logMap.get(userId).balance;
  }

  // DELETEME
  // return { body: { balance, userId } };
  return { body: { balance } };
}

// TODO: Fix `any`s
type TransferRequest = any;
type TransferResponse = any;

interface Caller {
  id: string
}

export function transfer(
  request: ccfapp.Request<BalanceRequest>
): ccfapp.Response<BalanceResponse> {
  // TODO: Do it in a proper way
  const caller = request.caller as unknown as Caller;
  const userId = caller.id as string;

  if (!validateUserId(request.params.user_id)) {
    return {
      statusCode: 404,
    };
  }
  const userIdTo = request.params.user_id;

  // TODO: Need validate body (e.g. parse failed, is value integer?)
  let body = request.body.json();
  const value = parseInt(body.value);

  if (body.claim != undefined)
  {
    let transfer_claim = userId + ":" + userIdTo + value;
    ccf.rpc.setClaimsDigest(ccf.digest("SHA-256", ccf.strToBuf(transfer_claim)));
  }

  // TODO: Duplicated 'Read current balance'
  let balance = 0;
  if (logMap.has(userId))
  {
    balance += logMap.get(userId).balance;
  }

  if (value > balance)
  {
    return { statusCode: 400, body: "Balance is not enough" };
  }

  logMap.set(userId, { balance: balance - value });

  let balanceTo = 0;
  if (logMap.has(userIdTo))
  {
    balanceTo += logMap.get(userIdTo).balance;
  }

  balanceTo += value;

  logMap.set(userIdTo, { balance: balanceTo });

  return { body: "OK" };
}

type ReceiptRequest = any;
type ReceiptResponse = any;

export function get_receipt(
  request: ccfapp.Request<ReceiptRequest>
  ): ccfapp.Response<ReceiptResponse> {
  let id = request.params.user_id;
  const kv = ccf.historicalState.kv["accounts"];
  let msg = kv.get(ccf.strToBuf(id));
  let result = { body: { msg: ccf.bufToStr(msg), receipt: {} } };
  result.body.receipt = ccf.historicalState.receipt;
  return result;
}