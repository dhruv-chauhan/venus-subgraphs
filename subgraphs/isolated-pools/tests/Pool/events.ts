import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';

import {
  ActionPaused1 as MarketActionPausedEvent,
  MarketEntered as MarketEnteredEvent,
  MarketExited as MarketExitedEvent,
  MarketListed as MarketListedEvent,
  NewBorrowCap as NewBorrowCapEvent,
  NewCloseFactor as NewCloseFactorEvent,
  NewCollateralFactor as NewCollateralFactorEvent,
  NewLiquidationIncentive as NewLiquidationIncentiveEvent,
  NewMinLiquidatableAmount as NewMinLiquidatableAmountEvent,
  NewPauseGuardian as NewPauseGuardianEvent,
  NewPriceOracle as NewPriceOracleEvent,
  ActionPaused as PoolActionPausedEvent,
} from '../../generated/PoolRegistry/Comptroller';

export const createMarketListedEvent = (vTokenAddress: Address): MarketListedEvent => {
  const event = changetype<MarketListedEvent>(newMockEvent());

  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  return event;
};

export const createMarketEnteredEvent = (
  vTokenAddress: Address,
  accountAddress: Address,
): MarketEnteredEvent => {
  const event = changetype<MarketEnteredEvent>(newMockEvent());

  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);
  const accountAddressParam = new ethereum.EventParam(
    'account',
    ethereum.Value.fromAddress(accountAddress),
  );
  event.parameters.push(accountAddressParam);

  return event;
};

export const createMarketExitedEvent = (
  vTokenAddress: Address,
  accountAddress: Address,
): MarketExitedEvent => {
  const event = changetype<MarketExitedEvent>(newMockEvent());

  event.parameters = [];
  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);
  const accountAddressParam = new ethereum.EventParam(
    'account',
    ethereum.Value.fromAddress(accountAddress),
  );
  event.parameters.push(accountAddressParam);

  return event;
};

export const createNewCloseFactorEvent = (
  poolAddress: Address,
  oldCloseFactor: BigInt,
  newCloseFactor: BigInt,
): NewCloseFactorEvent => {
  const event = changetype<NewCloseFactorEvent>(newMockEvent());
  event.address = poolAddress;
  event.parameters = [];

  const oldCloseFactorMantissa = new ethereum.EventParam(
    'oldCloseFactorMantissa',
    ethereum.Value.fromSignedBigInt(oldCloseFactor),
  );
  event.parameters.push(oldCloseFactorMantissa);

  const newCloseFactorMantissa = new ethereum.EventParam(
    'newCloseFactorMantissa',
    ethereum.Value.fromSignedBigInt(newCloseFactor),
  );
  event.parameters.push(newCloseFactorMantissa);

  return event;
};

export const createNewCollateralFactorEvent = (
  vTokenAddress: Address,
  oldCollateralFactorMantissa: BigInt,
  newCollateralFactorMantissa: BigInt,
): NewCollateralFactorEvent => {
  const event = changetype<NewCollateralFactorEvent>(newMockEvent());

  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const oldCollateralFactorMantissaParam = new ethereum.EventParam(
    'oldCollateralFactorMantissa',
    ethereum.Value.fromSignedBigInt(oldCollateralFactorMantissa),
  );
  event.parameters.push(oldCollateralFactorMantissaParam);

  const newCollateralFactorMantissaParam = new ethereum.EventParam(
    'newCollateralFactorMantissa',
    ethereum.Value.fromSignedBigInt(newCollateralFactorMantissa),
  );
  event.parameters.push(newCollateralFactorMantissaParam);

  return event;
};

export const createNewLiquidationIncentiveEvent = (
  poolAddress: Address,
  oldLiquidationIncentiveMantissa: BigInt,
  newLiquidationIncentiveMantissa: BigInt,
): NewLiquidationIncentiveEvent => {
  const event = changetype<NewLiquidationIncentiveEvent>(newMockEvent());
  event.address = poolAddress;
  event.parameters = [];

  const oldLiquidationIncentiveMantissaParam = new ethereum.EventParam(
    'oldLiquidationIncentiveMantissa',
    ethereum.Value.fromSignedBigInt(oldLiquidationIncentiveMantissa),
  );
  event.parameters.push(oldLiquidationIncentiveMantissaParam);

  const newLiquidationIncentiveMantissaParam = new ethereum.EventParam(
    'newLiquidationIncentiveMantissa',
    ethereum.Value.fromSignedBigInt(newLiquidationIncentiveMantissa),
  );
  event.parameters.push(newLiquidationIncentiveMantissaParam);

  return event;
};

export const createNewPriceOracleEvent = (
  comptrollerAddress: Address,
  oldPriceOracle: Address,
  newPriceOracle: Address,
): NewPriceOracleEvent => {
  const event = changetype<NewPriceOracleEvent>(newMockEvent());
  event.address = comptrollerAddress;
  event.parameters = [];

  const oldPriceOracleParam = new ethereum.EventParam(
    'oldPriceOracle',
    ethereum.Value.fromAddress(oldPriceOracle),
  );
  event.parameters.push(oldPriceOracleParam);

  const newPriceOracleParam = new ethereum.EventParam(
    'newPriceOracle',
    ethereum.Value.fromAddress(newPriceOracle),
  );
  event.parameters.push(newPriceOracleParam);

  return event;
};

export const createNewPauseGuardianEvent = (
  comptrollerAddress: Address,
  oldPauseGuardian: Address,
  newPauseGuardian: Address,
): NewPauseGuardianEvent => {
  const event = changetype<NewPauseGuardianEvent>(newMockEvent());
  event.address = comptrollerAddress;
  event.parameters = [];

  const oldPauseGuardianParam = new ethereum.EventParam(
    'oldPauseGuardian',
    ethereum.Value.fromAddress(oldPauseGuardian),
  );
  event.parameters.push(oldPauseGuardianParam);

  const newPauseGuardianParam = new ethereum.EventParam(
    'newPauseGuardian',
    ethereum.Value.fromAddress(newPauseGuardian),
  );
  event.parameters.push(newPauseGuardianParam);

  return event;
};

export const createPoolActionPausedEvent = (
  poolAddress: Address,
  action: string,
  pauseState: boolean,
): PoolActionPausedEvent => {
  const event = changetype<PoolActionPausedEvent>(newMockEvent());
  event.address = poolAddress;
  event.parameters = [];

  const actionParam = new ethereum.EventParam('action', ethereum.Value.fromString(action));
  event.parameters.push(actionParam);

  const pauseStateParam = new ethereum.EventParam(
    'pauseState',
    ethereum.Value.fromBoolean(pauseState),
  );
  event.parameters.push(pauseStateParam);

  return event;
};

export const createMarketActionPausedEvent = (
  vTokenAddress: Address,
  action: string,
  pauseState: boolean,
): MarketActionPausedEvent => {
  const event = changetype<MarketActionPausedEvent>(newMockEvent());
  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const actionParam = new ethereum.EventParam('action', ethereum.Value.fromString(action));
  event.parameters.push(actionParam);

  const pauseStateParam = new ethereum.EventParam(
    'pauseState',
    ethereum.Value.fromBoolean(pauseState),
  );
  event.parameters.push(pauseStateParam);

  return event;
};

export const createNewBorrowCapEvent = (
  vTokenAddress: Address,
  newBorrowCap: BigInt,
): NewBorrowCapEvent => {
  const event = changetype<NewBorrowCapEvent>(newMockEvent());
  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newBorrowCapParam = new ethereum.EventParam(
    'newBorrowCap',
    ethereum.Value.fromUnsignedBigInt(newBorrowCap),
  );
  event.parameters.push(newBorrowCapParam);

  return event;
};

export const createNewMinLiquidatableAmountEvent = (
  vTokenAddress: Address,
  newMinLiquidatableAmount: BigInt,
): NewMinLiquidatableAmountEvent => {
  const event = changetype<NewMinLiquidatableAmountEvent>(newMockEvent());
  event.parameters = [];

  const vTokenParam = new ethereum.EventParam('cToken', ethereum.Value.fromAddress(vTokenAddress));
  event.parameters.push(vTokenParam);

  const newMinLiquidatableAmountParam = new ethereum.EventParam(
    'newMinLiquidatableAmount',
    ethereum.Value.fromUnsignedBigInt(newMinLiquidatableAmount),
  );
  event.parameters.push(newMinLiquidatableAmountParam);

  return event;
};