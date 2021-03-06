/**
 * Copyright 2019 - 2020 Jin Yang. All Rights Reserved.
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
import { Actual360, BlackCdsOptionEngine, BusinessDayConvention, CdsOption, CreditDefaultSwap, DateExt, DateGeneration, EuropeanExercise, FlatForward, FlatHazardRate, Frequency, Handle, MidPointCdsEngine, Period, Protection, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, TARGET, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`CDS Option tests ${version}`, () => {
    it('Testing CDS-option value against cached values...', () => {
        const backup = new SavedSettings();
        const cachedToday = DateExt.UTC('10,December,2007');
        Settings.evaluationDate.set(cachedToday);
        const calendar = new TARGET();
        const riskFree = new RelinkableHandle();
        riskFree.linkTo(new FlatForward().ffInit2(cachedToday, 0.02, new Actual360()));
        const expiry = calendar.advance1(cachedToday, 9, TimeUnit.Months);
        const startDate = calendar.advance1(expiry, 1, TimeUnit.Months);
        const maturity = calendar.advance1(startDate, 7, TimeUnit.Years);
        const dayCounter = new Actual360();
        const convention = BusinessDayConvention.ModifiedFollowing;
        const notional = 1000000.0;
        const hazardRate = new Handle(new SimpleQuote(0.001));
        const schedule = new Schedule().init2(startDate, maturity, new Period().init2(Frequency.Quarterly), calendar, convention, convention, DateGeneration.Rule.Forward, false);
        const recoveryRate = 0.4;
        const defaultProbability = new Handle(new FlatHazardRate().fhrInit3(0, calendar, hazardRate, dayCounter));
        const swapEngine = new MidPointCdsEngine(defaultProbability, recoveryRate, riskFree);
        const swap = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, 0.001, schedule, convention, dayCounter);
        swap.setPricingEngine(swapEngine);
        const strike = swap.fairSpread();
        const cdsVol = new Handle(new SimpleQuote(0.20));
        let underlying = new CreditDefaultSwap().init1(Protection.Side.Seller, notional, strike, schedule, convention, dayCounter);
        underlying.setPricingEngine(swapEngine);
        const exercise = new EuropeanExercise(expiry);
        const option1 = new CdsOption(underlying, exercise);
        option1.setPricingEngine(new BlackCdsOptionEngine(defaultProbability, recoveryRate, riskFree, cdsVol));
        let cachedValue = 270.976348;
        expect(Math.abs(option1.NPV() - cachedValue)).toBeLessThan(1.0e-5);
        underlying = new CreditDefaultSwap().init1(Protection.Side.Buyer, notional, strike, schedule, convention, dayCounter);
        underlying.setPricingEngine(swapEngine);
        const option2 = new CdsOption(underlying, exercise);
        option2.setPricingEngine(new BlackCdsOptionEngine(defaultProbability, recoveryRate, riskFree, cdsVol));
        cachedValue = 270.976348;
        expect(Math.abs(option2.NPV() - cachedValue)).toBeLessThan(1.0e-5);
        backup.dispose();
    });
});
