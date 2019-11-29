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
import { Actual365Fixed, BlackStyleSwaptionEngine, BlackSwaptionEngine, BusinessDayConvention, Compounding, DateExt, DateGeneration, DiscountingSwapEngine, Euribor6M, EuropeanExercise, FlatForward, Frequency, Handle, MakeVanillaSwap, Period, RelinkableHandle, SavedSettings, Schedule, Settings, Settlement, SimpleQuote, Swaption, Thirty360, TimeUnit, VanillaSwap, VolatilityType, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

const exercises = [
    new Period().init1(1, TimeUnit.Years), new Period().init1(2, TimeUnit.Years),
    new Period().init1(3, TimeUnit.Years), new Period().init1(5, TimeUnit.Years),
    new Period().init1(7, TimeUnit.Years), new Period().init1(10, TimeUnit.Years)
];

const lengths = [
    new Period().init1(1, TimeUnit.Years), new Period().init1(2, TimeUnit.Years),
    new Period().init1(3, TimeUnit.Years), new Period().init1(5, TimeUnit.Years),
    new Period().init1(7, TimeUnit.Years), new Period().init1(10, TimeUnit.Years),
    new Period().init1(15, TimeUnit.Years), new Period().init1(20, TimeUnit.Years)
];

const type = [VanillaSwap.Type.Receiver, VanillaSwap.Type.Payer];

class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.settlementDays = 2;
        this.nominal = 1000000.0;
        this.fixedConvention = BusinessDayConvention.Unadjusted;
        this.fixedFrequency = Frequency.Annual;
        this.fixedDayCount = new Thirty360();
        this.index = new Euribor6M(this.termStructure);
        this.floatingConvention = this.index.businessDayConvention();
        this.floatingTenor = this.index.tenor();
        this.calendar = this.index.fixingCalendar();
        this.today = this.calendar.adjust(DateExt.UTC());
        Settings.evaluationDate.set(this.today);
        this.settlement =
            this.calendar.advance1(this.today, this.settlementDays, TimeUnit.Days);
        this.termStructure.linkTo(flatRate2(this.settlement, 0.05, new Actual365Fixed()));
    }
    makeSwaption(swap, exercise, volatility, settlementType = Settlement.Type.Physical, settlementMethod = Settlement.Method.PhysicalOTC, model = BlackStyleSwaptionEngine.CashAnnuityModel.SwapRate) {
        const vol = new Handle(new SimpleQuote(volatility));
        const engine = new BlackSwaptionEngine().bseInit2(this.termStructure, vol, new Actual365Fixed(), 0.0, model);
        const result = new Swaption(swap, new EuropeanExercise(exercise), settlementType, settlementMethod);
        result.setPricingEngine(engine);
        return result;
    }
    makeEngine(volatility, model = BlackSwaptionEngine.CashAnnuityModel.SwapRate) {
        const h = new Handle(new SimpleQuote(volatility));
        return new BlackSwaptionEngine().bseInit2(this.termStructure, h, new Actual365Fixed(), 0.0, model);
    }
    dispose() {
        this.backup.dispose();
    }
}

describe(`Swaption tests ${version}`, () => {
    it('Testing swaption dependency on strike...', () => {
        const vars = new CommonVars();
        const strikes = [0.03, 0.04, 0.05, 0.06, 0.07];
        for (let i = 0; i < exercises.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                for (let k = 0; k < type.length; k++) {
                    const exerciseDate = vars.calendar.advance2(vars.today, exercises[i]);
                    const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
                    const values = [];
                    const values_cash = [];
                    const vol = 0.20;
                    for (let l = 0; l < strikes.length; l++) {
                        const swap = new MakeVanillaSwap(lengths[j], vars.index, strikes[l])
                            .withEffectiveDate(startDate)
                            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
                            .withFixedLegDayCount(vars.fixedDayCount)
                            .withFloatingLegSpread(0.0)
                            .withType(type[k])
                            .f();
                        const swaption = vars.makeSwaption(swap, exerciseDate, vol);
                        values.push(swaption.NPV());
                        const swaption_cash = vars.makeSwaption(swap, exerciseDate, vol, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                        values_cash.push(swaption_cash.NPV());
                    }
                    if (type[k] === VanillaSwap.Type.Payer) {
                        for (let i = 1; i < values.length; ++i) {
                            expect(values[i]).toBeLessThan(values[i - 1]);
                        }
                        for (let i = 1; i < values_cash.length; ++i) {
                            expect(values_cash[i]).toBeLessThan(values_cash[i - 1]);
                        }
                    }
                    else {
                        for (let i = 1; i < values.length; ++i) {
                            expect(values[i]).toBeGreaterThan(values[i - 1]);
                        }
                        for (let i = 1; i < values_cash.length; ++i) {
                            expect(values_cash[i]).toBeGreaterThan(values_cash[i - 1]);
                        }
                    }
                }
            }
        }
        vars.dispose();
    });

    it('Testing swaption dependency on spread...', () => {
        const vars = new CommonVars();
        const spreads = [-0.002, -0.001, 0.0, 0.001, 0.002];
        for (let i = 0; i < exercises.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                for (let k = 0; k < type.length; k++) {
                    const exerciseDate = vars.calendar.advance2(vars.today, exercises[i]);
                    const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
                    const values = [];
                    const values_cash = [];
                    for (let l = 0; l < spreads.length; l++) {
                        const swap = new MakeVanillaSwap(lengths[j], vars.index, 0.06)
                            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
                            .withFixedLegDayCount(vars.fixedDayCount)
                            .withEffectiveDate(startDate)
                            .withFloatingLegSpread(spreads[l])
                            .withType(type[k])
                            .f();
                        const swaption = vars.makeSwaption(swap, exerciseDate, 0.20);
                        values.push(swaption.NPV());
                        const swaption_cash = vars.makeSwaption(swap, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                        values_cash.push(swaption_cash.NPV());
                    }
                    if (type[k] === VanillaSwap.Type.Payer) {
                        for (let i = 1; i < values.length; ++i) {
                            expect(values[i]).toBeGreaterThan(values[i - 1]);
                        }
                        for (let i = 1; i < values_cash.length; ++i) {
                            expect(values_cash[i]).toBeGreaterThan(values_cash[i - 1]);
                        }
                    }
                    else {
                        for (let i = 1; i < values.length; ++i) {
                            expect(values[i]).toBeLessThan(values[i - 1]);
                        }
                        for (let i = 1; i < values_cash.length; ++i) {
                            expect(values_cash[i]).toBeLessThan(values_cash[i - 1]);
                        }
                    }
                }
            }
        }
        vars.dispose();
    });

    it('Testing swaption treatment of spread...', () => {
        const vars = new CommonVars();
        const spreads = [-0.002, -0.001, 0.0, 0.001, 0.002];
        for (let i = 0; i < exercises.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                for (let k = 0; k < type.length; k++) {
                    const exerciseDate = vars.calendar.advance2(vars.today, exercises[i]);
                    const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
                    for (let l = 0; l < spreads.length; l++) {
                        const swap = new MakeVanillaSwap(lengths[j], vars.index, 0.06)
                            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
                            .withFixedLegDayCount(vars.fixedDayCount)
                            .withEffectiveDate(startDate)
                            .withFloatingLegSpread(spreads[l])
                            .withType(type[k])
                            .f();
                        const correction = spreads[l] * swap.floatingLegBPS() / swap.fixedLegBPS();
                        const equivalentSwap = new MakeVanillaSwap(lengths[j], vars.index, 0.06 + correction)
                            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
                            .withFixedLegDayCount(vars.fixedDayCount)
                            .withEffectiveDate(startDate)
                            .withFloatingLegSpread(0.0)
                            .withType(type[k])
                            .f();
                        const swaption1 = vars.makeSwaption(swap, exerciseDate, 0.20);
                        const swaption2 = vars.makeSwaption(equivalentSwap, exerciseDate, 0.20);
                        const swaption1_cash = vars.makeSwaption(swap, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                        const swaption2_cash = vars.makeSwaption(equivalentSwap, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                        expect(Math.abs(swaption1.NPV() - swaption2.NPV()))
                            .toBeLessThan(1.0e-6);
                        expect(Math.abs(swaption1_cash.NPV() - swaption2_cash.NPV()))
                            .toBeLessThan(1.0e-6);
                    }
                }
            }
        }
        vars.dispose();
    });

    it('Testing swaption value against cached value...', () => {
        const vars = new CommonVars();
        vars.today = DateExt.UTC('13,March,2002');
        vars.settlement = DateExt.UTC('15,March,2002');
        Settings.evaluationDate.set(vars.today);
        vars.termStructure.linkTo(flatRate2(vars.settlement, 0.05, new Actual365Fixed()));
        const exerciseDate = vars.calendar.advance1(vars.settlement, 5, TimeUnit.Years);
        const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
        const swap = new MakeVanillaSwap(new Period().init1(10, TimeUnit.Years), vars.index, 0.06)
            .withEffectiveDate(startDate)
            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
            .withFixedLegDayCount(vars.fixedDayCount)
            .f();
        const swaption = vars.makeSwaption(swap, exerciseDate, 0.20);
        let cachedNPV;
        if (Settings.QL_USE_INDEXED_COUPON) {
            cachedNPV = 0.036418158579;
        }
        else {
            cachedNPV = 0.036421429684;
        }
        expect(Math.abs(swaption.NPV() - cachedNPV)).toBeLessThan(1.0e-12);
        vars.dispose();
    });

    it('Testing swaption vega...', () => {
        const vars = new CommonVars();
        const types = [Settlement.Type.Physical, Settlement.Type.Cash];
        const methods = [Settlement.Method.PhysicalOTC, Settlement.Method.ParYieldCurve];
        const strikes = [0.03, 0.04, 0.05, 0.06, 0.07];
        const vols = [0.01, 0.20, 0.30, 0.70, 0.90];
        const shift = 1e-8;
        for (let i = 0; i < exercises.length; i++) {
            const exerciseDate = vars.calendar.advance2(vars.today, exercises[i]);
            const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
            for (let j = 0; j < lengths.length; j++) {
                for (let t = 0; t < strikes.length; t++) {
                    for (let h = 0; h < type.length; h++) {
                        const swap = new MakeVanillaSwap(lengths[j], vars.index, strikes[t])
                            .withEffectiveDate(startDate)
                            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
                            .withFixedLegDayCount(vars.fixedDayCount)
                            .withFloatingLegSpread(0.0)
                            .withType(type[h])
                            .f();
                        for (let u = 0; u < vols.length; u++) {
                            const swaption = vars.makeSwaption(swap, exerciseDate, vols[u], types[h], methods[h]);
                            const swaption1 = vars.makeSwaption(swap, exerciseDate, vols[u] - shift, types[h], methods[h]);
                            const swaption2 = vars.makeSwaption(swap, exerciseDate, vols[u] + shift, types[h], methods[h]);
                            const swaptionNPV = swaption.NPV();
                            const numericalVegaPerPoint = (swaption2.NPV() - swaption1.NPV()) / (200.0 * shift);
                            if (numericalVegaPerPoint / swaptionNPV > 1.0e-7) {
                                const analyticalVegaPerPoint = swaption.result('vega') / 100.0;
                                let discrepancy = Math.abs(analyticalVegaPerPoint - numericalVegaPerPoint);
                                discrepancy /= numericalVegaPerPoint;
                                const tolerance = 0.015;
                                expect(discrepancy).toBeLessThan(tolerance);
                            }
                        }
                    }
                }
            }
        }
        vars.dispose();
    });

    it('Testing cash settled swaptions modified annuity...', () => {
        const vars = new CommonVars();
        const strike = 0.05;
        for (let k = 0; k < exercises.length; k++) {
            for (let j = 0; j < lengths.length; j++) {
                const exerciseDate = vars.calendar.advance2(vars.today, exercises[k]);
                const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
                const maturity = vars.calendar.advance2(startDate, lengths[j], vars.floatingConvention);
                const floatSchedule = new Schedule().init2(startDate, maturity, vars.floatingTenor, vars.calendar, vars.floatingConvention, vars.floatingConvention, DateGeneration.Rule.Forward, false);
                const fixedSchedule_u = new Schedule().init2(startDate, maturity, new Period().init2(vars.fixedFrequency), vars.calendar, BusinessDayConvention.Unadjusted, BusinessDayConvention.Unadjusted, DateGeneration.Rule.Forward, true);
                const swap_u360 = new VanillaSwap(type[0], vars.nominal, fixedSchedule_u, strike, new Thirty360(), floatSchedule, vars.index, 0.0, vars.index.dayCounter());
                const swap_u365 = new VanillaSwap(type[0], vars.nominal, fixedSchedule_u, strike, new Actual365Fixed(), floatSchedule, vars.index, 0.0, vars.index.dayCounter());
                const fixedSchedule_a = new Schedule().init2(startDate, maturity, new Period().init2(vars.fixedFrequency), vars.calendar, BusinessDayConvention.ModifiedFollowing, BusinessDayConvention.ModifiedFollowing, DateGeneration.Rule.Forward, true);
                const swap_a360 = new VanillaSwap(type[0], vars.nominal, fixedSchedule_a, strike, new Thirty360(), floatSchedule, vars.index, 0.0, vars.index.dayCounter());
                const swap_a365 = new VanillaSwap(type[0], vars.nominal, fixedSchedule_a, strike, new Actual365Fixed(), floatSchedule, vars.index, 0.0, vars.index.dayCounter());
                const swapEngine = new DiscountingSwapEngine(vars.termStructure);
                swap_u360.setPricingEngine(swapEngine);
                swap_a360.setPricingEngine(swapEngine);
                swap_u365.setPricingEngine(swapEngine);
                swap_a365.setPricingEngine(swapEngine);
                const swapFixedLeg_u360 = swap_u360.fixedLeg();
                const swapFixedLeg_a360 = swap_a360.fixedLeg();
                const swapFixedLeg_u365 = swap_u365.fixedLeg();
                const swapFixedLeg_a365 = swap_a365.fixedLeg();
                const termStructure_u360 = new Handle(new FlatForward().ffInit2(vars.settlement, swap_u360.fairRate(), new Thirty360(), Compounding.Compounded, vars.fixedFrequency));
                const termStructure_a360 = new Handle(new FlatForward().ffInit2(vars.settlement, swap_a360.fairRate(), new Thirty360(), Compounding.Compounded, vars.fixedFrequency));
                const termStructure_u365 = new Handle(new FlatForward().ffInit2(vars.settlement, swap_u365.fairRate(), new Actual365Fixed(), Compounding.Compounded, vars.fixedFrequency));
                const termStructure_a365 = new Handle(new FlatForward().ffInit2(vars.settlement, swap_a365.fairRate(), new Actual365Fixed(), Compounding.Compounded, vars.fixedFrequency));
                let annuity_u360 = swap_u360.fixedLegBPS() / 0.0001;
                annuity_u360 = swap_u360.type() === VanillaSwap.Type.Payer ?
                    -annuity_u360 :
                    annuity_u360;
                let annuity_a365 = swap_a365.fixedLegBPS() / 0.0001;
                annuity_a365 = swap_a365.type() === VanillaSwap.Type.Payer ?
                    -annuity_a365 :
                    annuity_a365;
                let annuity_a360 = swap_a360.fixedLegBPS() / 0.0001;
                annuity_a360 = swap_a360.type() === VanillaSwap.Type.Payer ?
                    -annuity_a360 :
                    annuity_a360;
                let annuity_u365 = swap_u365.fixedLegBPS() / 0.0001;
                annuity_u365 = swap_u365.type() === VanillaSwap.Type.Payer ?
                    -annuity_u365 :
                    annuity_u365;
                let cashannuity_u360 = 0.;
                let i;
                for (i = 0; i < swapFixedLeg_u360.length; i++) {
                    cashannuity_u360 += swapFixedLeg_u360[i].amount1() / strike *
                        termStructure_u360.currentLink().discount1(swapFixedLeg_u360[i].date());
                }
                let cashannuity_u365 = 0.;
                for (i = 0; i < swapFixedLeg_u365.length; i++) {
                    cashannuity_u365 += swapFixedLeg_u365[i].amount1() / strike *
                        termStructure_u365.currentLink().discount1(swapFixedLeg_u365[i].date());
                }
                let cashannuity_a360 = 0.;
                for (i = 0; i < swapFixedLeg_a360.length; i++) {
                    cashannuity_a360 += swapFixedLeg_a360[i].amount1() / strike *
                        termStructure_a360.currentLink().discount1(swapFixedLeg_a360[i].date());
                }
                let cashannuity_a365 = 0.;
                for (i = 0; i < swapFixedLeg_a365.length; i++) {
                    cashannuity_a365 += swapFixedLeg_a365[i].amount1() / strike *
                        termStructure_a365.currentLink().discount1(swapFixedLeg_a365[i].date());
                }
                const swaption_p_u360 = vars.makeSwaption(swap_u360, exerciseDate, 0.20);
                const value_p_u360 = swaption_p_u360.NPV();
                const swaption_c_u360 = vars.makeSwaption(swap_u360, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                const value_c_u360 = swaption_c_u360.NPV();
                const npv_ratio_u360 = value_c_u360 / value_p_u360;
                const annuity_ratio_u360 = cashannuity_u360 / annuity_u360;
                const swaption_p_a365 = vars.makeSwaption(swap_a365, exerciseDate, 0.20);
                const value_p_a365 = swaption_p_a365.NPV();
                const swaption_c_a365 = vars.makeSwaption(swap_a365, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                const value_c_a365 = swaption_c_a365.NPV();
                const npv_ratio_a365 = value_c_a365 / value_p_a365;
                const annuity_ratio_a365 = cashannuity_a365 / annuity_a365;
                const swaption_p_a360 = vars.makeSwaption(swap_a360, exerciseDate, 0.20);
                const value_p_a360 = swaption_p_a360.NPV();
                const swaption_c_a360 = vars.makeSwaption(swap_a360, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                const value_c_a360 = swaption_c_a360.NPV();
                const npv_ratio_a360 = value_c_a360 / value_p_a360;
                const annuity_ratio_a360 = cashannuity_a360 / annuity_a360;
                const swaption_p_u365 = vars.makeSwaption(swap_u365, exerciseDate, 0.20);
                const value_p_u365 = swaption_p_u365.NPV();
                const swaption_c_u365 = vars.makeSwaption(swap_u365, exerciseDate, 0.20, Settlement.Type.Cash, Settlement.Method.ParYieldCurve);
                const value_c_u365 = swaption_c_u365.NPV();
                const npv_ratio_u365 = value_c_u365 / value_p_u365;
                const annuity_ratio_u365 = cashannuity_u365 / annuity_u365;
                expect(Math.abs(annuity_ratio_u360 - npv_ratio_u360))
                    .toBeLessThan(1e-10);
                expect(Math.abs(annuity_ratio_a365 - npv_ratio_a365))
                    .toBeLessThan(1e-10);
                expect(Math.abs(annuity_ratio_a360 - npv_ratio_a360))
                    .toBeLessThan(1e-10);
                expect(Math.abs(annuity_ratio_u365 - npv_ratio_u365))
                    .toBeLessThan(1e-10);
            }
        }
        vars.dispose();
    });

    it('Testing implied volatility for swaptions...', () => {
        const vars = new CommonVars();
        const maxEvaluations = 100;
        const tolerance = 1.0e-08;
        const types = [Settlement.Type.Physical, Settlement.Type.Cash];
        const methods = [Settlement.Method.PhysicalOTC, Settlement.Method.ParYieldCurve];
        const strikes = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07];
        const vols = [0.01, 0.05, 0.10, 0.20, 0.30, 0.70, 0.90];
        for (let i = 0; i < exercises.length; i++) {
            for (let j = 0; j < lengths.length; j++) {
                const exerciseDate = vars.calendar.advance2(vars.today, exercises[i]);
                const startDate = vars.calendar.advance1(exerciseDate, vars.settlementDays, TimeUnit.Days);
                for (let t = 0; t < strikes.length; t++) {
                    for (let k = 0; k < type.length; k++) {
                        const swap = new MakeVanillaSwap(lengths[j], vars.index, strikes[t])
                            .withEffectiveDate(startDate)
                            .withFixedLegTenor(new Period().init1(1, TimeUnit.Years))
                            .withFixedLegDayCount(vars.fixedDayCount)
                            .withFloatingLegSpread(0.0)
                            .withType(type[k])
                            .f();
                        for (let h = 0; h < types.length; h++) {
                            for (let u = 0; u < vols.length; u++) {
                                const swaption = vars.makeSwaption(swap, exerciseDate, vols[u], types[h], methods[h], BlackStyleSwaptionEngine.CashAnnuityModel.DiscountCurve);
                                const value = swaption.NPV();
                                let implVol = 0.0;
                                try {
                                    implVol = swaption.impliedVolatility(value, vars.termStructure, 0.10, tolerance, maxEvaluations, 1.0e-7, 4.0, VolatilityType.ShiftedLognormal, 0.0);
                                }
                                catch (e) {
                                    swaption.setPricingEngine(vars.makeEngine(0.0, BlackStyleSwaptionEngine.CashAnnuityModel.DiscountCurve));
                                    const value2 = swaption.NPV();
                                    expect(Math.abs(value - value2)).toBeLessThan(tolerance);
                                }
                                if (Math.abs(implVol - vols[u]) > tolerance) {
                                    swaption.setPricingEngine(vars.makeEngine(implVol, BlackStyleSwaptionEngine.CashAnnuityModel.DiscountCurve));
                                    const value2 = swaption.NPV();
                                    expect(Math.abs(value - value2)).toBeLessThan(tolerance);
                                }
                            }
                        }
                    }
                }
            }
        }
        vars.dispose();
    });
});
