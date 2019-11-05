/**
 * Copyright 2019 Jin Yang. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import { EURCurrency, ExchangeRate, ExchangeRateManager, GBPCurrency, Money, USDCurrency, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Money tests ${version}`, () => {
    it('Testing money arithmetic without conversions...', () => {
        const EUR = new EURCurrency();
        const m1 = new Money().init2(EUR, 50000.0);
        const m2 = new Money().init2(EUR, 100000.0);
        const m3 = new Money().init2(EUR, 500000.0);
        Money.conversionType = Money.ConversionType.NoConversion;
        const calculated = Money.sub(Money.add(Money.mul(m1, 3.0), Money.mul(m2,2.5)), Money.divx(m3, 5.0));
        const x = m1.value() * 3.0 + 2.5 * m2.value() - m3.value() / 5.0;
        const expected = new Money().init3(x, EUR);
        expect(Money.equal(calculated, expected)).toBeTruthy();
    });

    it('Testing money arithmetic with conversion to base currency...', () => {
        const EUR = new EURCurrency();
        const GBP = new GBPCurrency();
        const USD = new USDCurrency();
        const m1 = new Money().init2(GBP, 50000.0);
        const m2 = new Money().init2(EUR, 100000.0);
        const m3 = new Money().init2(USD, 500000.0);
        ExchangeRateManager.clear();
        const eur_usd = new ExchangeRate().init(EUR, USD, 1.2042);
        const eur_gbp = new ExchangeRate().init(EUR, GBP, 0.6612);
        ExchangeRateManager.add(eur_usd);
        ExchangeRateManager.add(eur_gbp);
        Money.conversionType = Money.ConversionType.BaseCurrencyConversion;
        Money.baseCurrency = EUR;

        //RangeError: Maximum call stack size exceeded
        const calculated = Money.sub(Money.add(Money.mul(m1, 3.0), Money.mul(m2,2.5)), Money.divx(m3, 5.0));
        const round = Money.baseCurrency.rounding();
        const x = round.f(m1.value() * 3.0 / eur_gbp.rate()) +
            2.5 * m2.value() - round.f(m3.value() / (5.0 * eur_usd.rate()));
        const expected = new Money().init3(x, EUR);
        Money.conversionType = Money.ConversionType.NoConversion;
        expect(Money.equal(calculated, expected)).toBeTruthy();
    });

    it('Testing money arithmetic with automated conversion...', () => {
        const EUR = new EURCurrency();
        const GBP = new GBPCurrency();
        const USD = new USDCurrency();
        const m1 = new Money().init2(GBP, 50000.0);
        const m2 = new Money().init2(EUR, 100000.0);
        const m3 = new Money().init2(USD, 500000.0);
        ExchangeRateManager.clear();
        const eur_usd = new ExchangeRate().init(EUR, USD, 1.2042);
        const eur_gbp = new ExchangeRate().init(EUR, GBP, 0.6612);
        ExchangeRateManager.add(eur_usd);
        ExchangeRateManager.add(eur_gbp);
        Money.conversionType = Money.ConversionType.AutomatedConversion;
        const calculated = Money.sub(Money.add(Money.mul(m1, 3.0), Money.mul(m2,2.5)), Money.divx(m3, 5.0));
        const round = m1.currency().rounding();
        const x = m1.value() * 3.0 +
            round.f(2.5 * m2.value() * eur_gbp.rate()) -
            round.f((m3.value() / 5.0) * eur_gbp.rate() / eur_usd.rate());
        const expected = new Money().init3(x, GBP);
        Money.conversionType = Money.ConversionType.NoConversion;
        expect(Money.equal(calculated, expected)).toBeTruthy();
    });
});
