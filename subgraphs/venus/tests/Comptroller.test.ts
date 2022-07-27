import { Address, BigInt } from '@graphprotocol/graph-ts';
import {
  afterEach,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from 'matchstick-as/assembly/index';

import { handleMarketListed } from '../src/mappings/comptroller';
import { createMarketListedEvent } from './events';
import { createVBep20AndUnderlyingMock } from './mocks';

const vUsdcAddress = Address.fromString('0xecA88125a5ADbe82614ffC12D0DB554E2e2867C8');
const usdcAddress = Address.fromString('0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d');
const vBnbAddress = Address.fromString('0xA07c5b74C9B40447a954e1466938b865b6BBea36');

const interestRateModelAddress = Address.fromString('0x594942C0e62eC577889777424CD367545C796A74');
const nullAddress = Address.fromString('0x0000000000000000000000000000000000000000');
// vBNBAddress

const cleanup = (): void => {
  clearStore();
};

afterEach(() => {
  cleanup();
});
// reserveFactorMantissa: new BigInt(1e18), interestRateModelAddress
beforeAll(() => {
  // Mock USDC
  createVBep20AndUnderlyingMock(
    vUsdcAddress,
    usdcAddress,
    'USD Coin',
    'USDC',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );
  // Mock BNB
  createVBep20AndUnderlyingMock(
    vBnbAddress,
    nullAddress,
    'BNB',
    'BNB',
    BigInt.fromI32(18),
    BigInt.fromI32(100),
    interestRateModelAddress,
  );
});
// Created vBnBMarket creates other market
describe('handleMarketListing', () => {
  test('lists vUSDC market correctly with underlyingPriceUSD === 1', () => {
    const marketListedEvent = createMarketListedEvent(vUsdcAddress);

    handleMarketListed(marketListedEvent);
    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vUsdcAddress.toHex(), key, value);
    };
    assertMarketDocument('id', vUsdcAddress.toHex());
    assertMarketDocument('underlyingAddress', usdcAddress.toHex());
    assertMarketDocument('underlyingDecimals', '18');
    assertMarketDocument('underlyingName', 'USD Coin');
    assertMarketDocument('underlyingSymbol', 'USDC');
    assertMarketDocument('underlyingPriceUSD', '1');
    assertMarketDocument('underlyingPrice', '0');
    assertMarketDocument('borrowRate', '0');
    assertMarketDocument('cash', '0');
    assertMarketDocument('collateralFactor', '0');
    assertMarketDocument('exchangeRate', '0');
    assertMarketDocument('interestRateModelAddress', interestRateModelAddress.toHex());
    assertMarketDocument('name', 'Venus USD Coin');
    assertMarketDocument('reserves', '0');
    assertMarketDocument('supplyRate', '0');
    assertMarketDocument('symbol', 'vUSDC');
    assertMarketDocument('totalBorrows', '0');
    assertMarketDocument('totalSupply', '0');
    assertMarketDocument('accrualBlockNumber', '0');
    assertMarketDocument('blockTimestamp', '0');
    assertMarketDocument('borrowIndex', '0');
    assertMarketDocument('reserveFactor', '100');
  });

  test('lists vBNB market correctly', () => {
    const marketListedEvent = createMarketListedEvent(vBnbAddress);

    handleMarketListed(marketListedEvent);
    const assertMarketDocument = (key: string, value: string): void => {
      assert.fieldEquals('Market', vBnbAddress.toHex(), key, value);
    };
    assertMarketDocument('id', vBnbAddress.toHex());
    assertMarketDocument('underlyingAddress', nullAddress.toHex());
    assertMarketDocument('underlyingDecimals', '18');
    assertMarketDocument('underlyingName', 'Binance Coin');
    assertMarketDocument('underlyingSymbol', 'BNB');
    assertMarketDocument('underlyingPriceUSD', '0');
    assertMarketDocument('underlyingPrice', '1');
    assertMarketDocument('borrowRate', '0');
    assertMarketDocument('cash', '0');
    assertMarketDocument('collateralFactor', '0');
    assertMarketDocument('exchangeRate', '0');
    assertMarketDocument('interestRateModelAddress', interestRateModelAddress.toHex());
    assertMarketDocument('name', 'Venus BNB');
    assertMarketDocument('reserves', '0');
    assertMarketDocument('supplyRate', '0');
    assertMarketDocument('symbol', 'vBNB');
    assertMarketDocument('totalBorrows', '0');
    assertMarketDocument('totalSupply', '0');
    assertMarketDocument('accrualBlockNumber', '0');
    assertMarketDocument('blockTimestamp', '0');
    assertMarketDocument('borrowIndex', '0');
    assertMarketDocument('reserveFactor', '100');
  });
});