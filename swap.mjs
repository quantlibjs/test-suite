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
import '/test-suite/quantlibtestsuite.mjs';
import { Actual365Fixed, BlackIborCouponPricer, BusinessDayConvention, ConstantOptionletVolatility, DateExt, DateGeneration, DiscountingSwapEngine, EURCurrency, Euribor, FixedRateLeg, Frequency, Handle, IborIndex, IborLeg, NullCalendar, Period, RelinkableHandle, Schedule, setCouponPricer, SavedSettings, Settings, SimpleDayCounter, Swap, Thirty360, TimeUnit, VanillaSwap, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.type = VanillaSwap.Type.Payer;
        this.settlementDays = 2;
        this.nominal = 100.0;
        this.fixedConvention = BusinessDayConvention.Unadjusted;
        this.floatingConvention = BusinessDayConvention.ModifiedFollowing;
        this.fixedFrequency = Frequency.Annual;
        this.floatingFrequency = Frequency.Semiannual;
        this.fixedDayCount = new Thirty360();
        this.index = new Euribor(new Period().init2(this.floatingFrequency), this.termStructure);
        this.calendar = this.index.fixingCalendar();
        this.today = this.calendar.adjust(Settings.evaluationDate.f());
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
        this.termStructure.linkTo(flatRate2(this.settlement, 0.05, new Actual365Fixed()));
    }
    makeSwap(length, fixedRate, floatingSpread) {
        const maturity = this.calendar.advance1(this.settlement, length, TimeUnit.Years, this.floatingConvention);
        const fixedSchedule = new Schedule().init2(this.settlement, maturity, new Period().init2(this.fixedFrequency), this.calendar, this.fixedConvention, this.fixedConvention, DateGeneration.Rule.Forward, false);
        const floatSchedule = new Schedule().init2(this.settlement, maturity, new Period().init2(this.floatingFrequency), this.calendar, this.floatingConvention, this.floatingConvention, DateGeneration.Rule.Forward, false);
        const swap = new VanillaSwap(this.type, this.nominal, fixedSchedule, fixedRate, this.fixedDayCount, floatSchedule, this.index, floatingSpread, this.index.dayCounter());
        swap.setPricingEngine(new DiscountingSwapEngine(this.termStructure));
        return swap;
    }
}

describe(`Swap tests ${version}`, () => {
    it('Testing vanilla-swap calculation of fair fixed rate...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 5, 10, 20];
        const spreads = [-0.001, -0.01, 0.0, 0.01, 0.001];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < spreads.length; j++) {
                let swap = vars.makeSwap(lengths[i], 0.0, spreads[j]);
                swap = vars.makeSwap(lengths[i], swap.fairRate(), spreads[j]);
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
            }
        }
        vars.backup.dispose();
    });

    it('Testing vanilla-swap calculation of fair floating spread...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 5, 10, 20];
        const rates = [0.04, 0.05, 0.06, 0.07];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < rates.length; j++) {
                let swap = vars.makeSwap(lengths[i], rates[j], 0.0);
                swap = vars.makeSwap(lengths[i], rates[j], swap.fairSpread());
                expect(Math.abs(swap.NPV())).toBeLessThan(1.0e-10);
            }
        }
        vars.backup.dispose();
    });

    it('Testing vanilla-swap dependency on fixed rate...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 5, 10, 20];
        const spreads = [-0.001, -0.01, 0.0, 0.01, 0.001];
        const rates = [0.03, 0.04, 0.05, 0.06, 0.07];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < spreads.length; j++) {
                const swap_values = [];
                for (let k = 0; k < rates.length; k++) {
                    const swap = vars.makeSwap(lengths[i], rates[k], spreads[j]);
                    swap_values.push(swap.NPV());
                }
                for (let i = 1; i < swap_values.length; i++) {
                    expect(swap_values[i]).toBeLessThan(swap_values[i - 1]);
                }
            }
        }
        vars.backup.dispose();
    });

    it('Testing vanilla-swap dependency on floating spread...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 5, 10, 20];
        const rates = [0.04, 0.05, 0.06, 0.07];
        const spreads = [-0.01, -0.002, -0.001, 0.0, 0.001, 0.002, 0.01];
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < rates.length; j++) {
                const swap_values = [];
                for (let k = 0; k < spreads.length; k++) {
                    const swap = vars.makeSwap(lengths[i], rates[j], spreads[k]);
                    swap_values.push(swap.NPV());
                }
                for (let i = 1; i < swap_values.length; i++) {
                    expect(swap_values[i]).toBeGreaterThan(swap_values[i - 1]);
                }
            }
        }
        vars.backup.dispose();
    });

    it('Testing in-arrears swap calculation...', () => {
        const vars = new CommonVars();
        const maturity = DateExt.advance(vars.today, 5, TimeUnit.Years);
        const calendar = new NullCalendar();
        const schedule = new Schedule().init2(vars.today, maturity, new Period().init2(Frequency.Annual), calendar, BusinessDayConvention.Following, BusinessDayConvention.Following, DateGeneration.Rule.Forward, false);
        const dayCounter = new SimpleDayCounter();
        const nominals = [100000000.0];
        const index = new IborIndex('dummy', new Period().init1(1, TimeUnit.Years), 0, new EURCurrency(), calendar, BusinessDayConvention.Following, false, dayCounter, vars.termStructure);
        const oneYear = 0.05;
        const r = Math.log(1.0 + oneYear);
        vars.termStructure.linkTo(flatRate2(vars.today, r, dayCounter));
        const coupons = [oneYear];
        const fixedLeg = new FixedRateLeg(schedule)
            .withNotionals2(nominals)
            .withCouponRates3(coupons, dayCounter)
            .f();
        const gearings = [];
        const spreads = [];
        const fixingDays = 0;
        const capletVolatility = 0.22;
        const vol = new Handle(new ConstantOptionletVolatility().covInit4(vars.today, new NullCalendar(), BusinessDayConvention.Following, capletVolatility, dayCounter));
        const pricer = new BlackIborCouponPricer(vol);
        const floatingLeg = new IborLeg(schedule, index)
            .withNotionals2(nominals)
            .withPaymentDayCounter(dayCounter)
            .withFixingDays1(fixingDays)
            .withGearings2(gearings)
            .withSpreads2(spreads)
            .inArrears()
            .f();
        setCouponPricer(floatingLeg, pricer);
        const swap = new Swap().init1(floatingLeg, fixedLeg);
        swap.setPricingEngine(new DiscountingSwapEngine(vars.termStructure));
        const storedValue = -144813.0;
        const tolerance = 1.0;
        expect(Math.abs(swap.NPV() - storedValue)).toBeLessThan(tolerance);
        vars.backup.dispose();
    });

    it('Testing vanilla-swap calculation against cached value...', () => {
        const vars = new CommonVars();
        vars.today = DateExt.UTC('17,June,2002');
        Settings.evaluationDate.set(vars.today);
        vars.settlement =
            vars.calendar.advance1(vars.today, vars.settlementDays, TimeUnit.Days);
        vars.termStructure.linkTo(flatRate2(vars.settlement, 0.05, new Actual365Fixed()));
        const swap = vars.makeSwap(10, 0.06, 0.001);
        let cachedNPV;
        if (!Settings.QL_USE_INDEXED_COUPON) {
            cachedNPV = -5.872863313209;
        }
        else {
            cachedNPV = -5.872342992212;
        }
        expect(Math.abs(swap.NPV() - cachedNPV)).toBeLessThan(1.0e-11);
        vars.backup.dispose();
    });
});