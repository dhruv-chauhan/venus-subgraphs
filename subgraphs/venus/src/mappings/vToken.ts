/* eslint-disable prefer-const */
// to satisfy AS compiler
import { Address, BigInt } from '@graphprotocol/graph-ts';

import {
  AccrueInterest,
  Borrow,
  LiquidateBorrow,
  MintBehalf as MintBehalfV1,
  Mint as MintV1,
  NewMarketInterestRateModel,
  NewReserveFactor,
  Redeem as RedeemV1,
  RepayBorrow,
  Transfer,
} from '../../generated/templates/VToken/VToken';
import { VToken as VTokenContract } from '../../generated/templates/VToken/VToken';
import {
  Mint,
  MintBehalf,
  Redeem,
} from '../../generated/templates/VTokenUpdatedEvents/VTokenUpdatedEvents';
import { DUST_THRESHOLD, oneBigInt, zeroBigInt32 } from '../constants';
import {
  createBorrowEvent,
  createLiquidationEvent,
  createMintBehalfEvent,
  createMintEvent,
  createRedeemEvent,
  createRepayEvent,
  createTransferEvent,
} from '../operations/create';
import {
  getOrCreateAccount,
  getOrCreateAccountVToken,
  getOrCreateAccountVTokenTransaction,
  getOrCreateMarket,
} from '../operations/getOrCreate';
import { exponentToBigInt } from '../utilities/exponentToBigInt';

/* Account supplies assets into market and receives vTokens in exchange
 *
 * event.mintAmount is the underlying asset
 * event.mintTokens is the amount of vTokens minted
 * event.minter is the account
 *
 * Notes
 *    Transfer event will always get emitted with this
 *    Mints originate from the vToken address, not 0x000000, which is typical of ERC-20s
 *    No need to update AccountVToken, handleTransfer() will
 *    No need to update vTokenBalance, handleTransfer() will
 */
export function handleMint(event: Mint): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.mintTokens.equals(event.params.totalSupply)) {
    market.supplierCount = market.supplierCount.plus(oneBigInt);
    market.save();
  }
  createMintEvent<Mint>(event);
}

export function handleMintBehalf(event: MintBehalf): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.mintTokens.equals(event.params.totalSupply)) {
    market.supplierCount = market.supplierCount.plus(oneBigInt);
    market.save();
  }
  createMintBehalfEvent<MintBehalf>(event);
}

/*  Account supplies vTokens into market and receives underlying asset in exchange
 *
 *  event.redeemAmount is the underlying asset
 *  event.redeemTokens is the vTokens
 *  event.redeemer is the account
 *
 *  Notes
 *    Transfer event will always get emitted with this
 *    No need to update AccountVToken, handleTransfer() will
 *    No need to update vTokenBalance, handleTransfer() will
 */
export function handleRedeem(event: Redeem): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.totalSupply.equals(zeroBigInt32)) {
    // if the current balance is 0 then the user has withdrawn all their assets from this market
    market.supplierCount = market.supplierCount.minus(oneBigInt);
    market.save();
  }
  createRedeemEvent<Redeem>(event);
}

/* Borrow assets from the protocol. All values either BNB or BEP20
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account
 * event.params.borrowAmount = that was added in this event
 * event.params.borrower = the account
 * Notes
 */
export function handleBorrow(event: Borrow): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.accountBorrows == event.params.borrowAmount) {
    // if both the accountBorrows and the borrowAmount are the same, it means the account is a new borrower
    market.borrowerCount = market.borrowerCount.plus(oneBigInt);
    market.borrowerCountAdjusted = market.borrowerCountAdjusted.plus(oneBigInt);
    market.save();
  }

  const account = getOrCreateAccount(event.params.borrower.toHex());
  account.hasBorrowed = true;
  account.save();

  const accountVToken = getOrCreateAccountVToken(market.id, market.symbol, account.id, event);
  accountVToken.storedBorrowBalanceMantissa = event.params.accountBorrows;
  accountVToken.accountBorrowIndexMantissa = market.borrowIndexMantissa;
  accountVToken.totalUnderlyingBorrowedMantissa =
    accountVToken.totalUnderlyingBorrowedMantissa.plus(event.params.borrowAmount);
  accountVToken.save();

  getOrCreateAccountVTokenTransaction(accountVToken.id, event);
  createBorrowEvent<Borrow>(event, market.underlyingAddress);
}

/* Repay some amount borrowed. Anyone can repay anyones balance
 *
 * event.params.totalBorrows = of the whole market (not used right now)
 * event.params.accountBorrows = total of the account (not used right now)
 * event.params.repayAmount = that was added in this event
 * event.params.borrower = the borrower
 * event.params.payer = the payer
 *
 * Notes
 *    Once a account totally repays a borrow, it still has its account interest index set to the
 *    markets value. We keep this, even though you might think it would reset to 0 upon full
 *    repay.
 */
export function handleRepayBorrow(event: RepayBorrow): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.accountBorrows.equals(zeroBigInt32)) {
    market.borrowerCount = market.borrowerCount.minus(oneBigInt);
    market.borrowerCountAdjusted = market.borrowerCountAdjusted.minus(oneBigInt);
    market.save();
  } else if (event.params.accountBorrows.le(DUST_THRESHOLD)) {
    // Sometimes a liquidator will leave dust behind. If this happens we'll adjust count
    // because the position only exists due to a technicality
    market.borrowerCountAdjusted = market.borrowerCountAdjusted.minus(oneBigInt);
    market.save();
  }

  const account = getOrCreateAccount(event.params.borrower.toHex());

  const accountVToken = getOrCreateAccountVToken(market.id, market.symbol, account.id, event);
  accountVToken.storedBorrowBalanceMantissa = event.params.accountBorrows;
  accountVToken.accountBorrowIndexMantissa = market.borrowIndexMantissa;
  accountVToken.totalUnderlyingRepaidMantissa = accountVToken.totalUnderlyingRepaidMantissa.plus(
    event.params.repayAmount,
  );
  accountVToken.save();

  getOrCreateAccountVTokenTransaction(accountVToken.id, event);
  createRepayEvent<RepayBorrow>(event, market.underlyingAddress);
}

/*
 * Liquidate an account who has fell below the collateral factor.
 *
 * event.params.borrower - the borrower who is getting liquidated of their vTokens
 * event.params.vTokenCollateral - the market ADDRESS of the vtoken being liquidated
 * event.params.liquidator - the liquidator
 * event.params.repayAmount - the amount of underlying to be repaid
 * event.params.seizeTokens - vTokens seized (transfer event should handle this)
 *
 * Notes
 *    When calling this const, event RepayBorrow, and event Transfer will be called every
 *    time. This means we can ignore repayAmount. Seize tokens only changes state
 *    of the vTokens, which is covered by transfer. Therefore we only
 *    add liquidation counts in this handler.
 */
export function handleLiquidateBorrow(event: LiquidateBorrow): void {
  const market = getOrCreateMarket(event.address, event);

  const liquidator = getOrCreateAccount(event.params.liquidator.toHex());
  liquidator.countLiquidator = liquidator.countLiquidator + 1;
  liquidator.save();

  const borrower = getOrCreateAccount(event.params.borrower.toHex());
  borrower.countLiquidated = borrower.countLiquidated + 1;
  borrower.save();

  // For a liquidation, the liquidator pays down the borrow of the underlying
  // asset. They seize one of potentially many types of vToken collateral of
  // the underwater borrower. So we must get that address from the event, and
  // the repay token is the event.address
  createLiquidationEvent<LiquidateBorrow>(event, market.underlyingAddress);
}

/* Transferring of vTokens
 *
 * event.params.from = sender of vTokens
 * event.params.to = receiver of vTokens
 * event.params.amount = amount sent
 *
 * Notes
 *    Possible ways to emit Transfer:
 *      seize() - i.e. a Liquidation Transfer (does not emit anything else)
 *      redeemFresh() - i.e. redeeming your vTokens for underlying asset
 *      mintFresh() - i.e. you are lending underlying assets to create vtokens
 *      transfer() - i.e. a basic transfer
 *    This const handles all 4 cases. Transfer is emitted alongside the mint, redeem, and seize
 *    events. So for those events, we do not update vToken balances.
 */
export function handleTransfer(event: Transfer): void {
  // We only updateMarket() if accrual block number is not up to date. This will only happen
  // with normal transfers, since mint, redeem, and seize transfers will already run updateMarket()
  let market = getOrCreateMarket(event.address, event);

  const amountUnderlying = market.exchangeRateMantissa
    .times(event.params.amount)
    .div(exponentToBigInt(18));

  // Checking if the tx is FROM the vToken contract (i.e. this will not run when minting)
  // If so, it is a mint, and we don't need to run these calculations
  let accountFromAddress = event.params.from;
  if (accountFromAddress != Address.fromString(market.id)) {
    const accountFrom = getOrCreateAccount(accountFromAddress.toHex());
    const accountFromVToken = getOrCreateAccountVToken(
      market.id,
      market.symbol,
      accountFrom.id,
      event,
    );
    accountFromVToken.vTokenBalanceMantissa = accountFromVToken.vTokenBalanceMantissa.minus(
      event.params.amount,
    );
    accountFromVToken.totalUnderlyingRedeemedMantissa =
      accountFromVToken.totalUnderlyingRedeemedMantissa.plus(amountUnderlying);
    accountFromVToken.save();

    getOrCreateAccountVTokenTransaction(accountFromVToken.id, event);
  }

  // Checking if the tx is TO the vToken contract (i.e. this will not run when redeeming)
  // If so, we ignore it. this leaves an edge case, where someone who accidentally sends
  // vTokens to a vToken contract, where it will not get recorded. Right now it would
  // be messy to include, so we are leaving it out for now TODO fix this in future
  let accountToAddress = event.params.to;
  if (accountToAddress != Address.fromString(market.id)) {
    const accountTo = getOrCreateAccount(accountToAddress.toHex());
    const accountToVToken = getOrCreateAccountVToken(market.id, market.symbol, accountTo.id, event);
    accountToVToken.vTokenBalanceMantissa = accountToVToken.vTokenBalanceMantissa.plus(
      event.params.amount,
    );
    accountToVToken.totalUnderlyingSuppliedMantissa =
      accountToVToken.totalUnderlyingSuppliedMantissa.plus(amountUnderlying);
    accountToVToken.save();

    getOrCreateAccountVTokenTransaction(accountToVToken.id, event);
  }
  createTransferEvent<Transfer>(event);
}

export function handleAccrueInterest(event: AccrueInterest): void {
  // updates market.accrualBlockNumber and rates
  getOrCreateMarket(event.address, event);
}

export function handleNewReserveFactor(event: NewReserveFactor): void {
  const market = getOrCreateMarket(event.address, event);
  market.reserveFactor = event.params.newReserveFactorMantissa;
  market.save();
}

export function handleNewMarketInterestRateModel(event: NewMarketInterestRateModel): void {
  const market = getOrCreateMarket(event.address, event);
  market.interestRateModelAddress = event.params.newInterestRateModel;
  market.save();
}

function getVTokenBalance(vTokenAddress: Address, accountAddress: Address): BigInt {
  const vTokenContract = VTokenContract.bind(vTokenAddress);
  return vTokenContract.balanceOf(accountAddress);
}

export function handleMintV1(event: MintV1): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.mintTokens.equals(getVTokenBalance(event.address, event.params.minter))) {
    market.supplierCount = market.supplierCount.plus(oneBigInt);
    market.save();
  }
  createMintEvent<MintV1>(event);
}

export function handleMintBehalfV1(event: MintBehalfV1): void {
  const market = getOrCreateMarket(event.address, event);
  if (event.params.mintTokens.equals(getVTokenBalance(event.address, event.params.receiver))) {
    market.supplierCount = market.supplierCount.plus(oneBigInt);
    market.save();
  }
  createMintBehalfEvent<MintBehalfV1>(event);
}

export function handleRedeemV1(event: RedeemV1): void {
  const market = getOrCreateMarket(event.address, event);
  if (getVTokenBalance(event.address, event.params.redeemer).equals(zeroBigInt32)) {
    // if the current balance is 0 then the user has withdrawn all their assets from this market
    market.supplierCount = market.supplierCount.minus(oneBigInt);
    market.save();
  }
  createRedeemEvent<RedeemV1>(event);
}
