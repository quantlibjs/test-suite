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
import { Actual360, ActualActual, BlackCapFloorEngine, BusinessDayConvention, Cap, CapFloor, Collar, DateExt, DateGeneration, DiscountingSwapEngine, Euribor6M, Floor, Frequency, Handle, IborLeg, Period, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, TimeUnit, VanillaSwap, VolatilityType, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2 } from '/test-suite/utilities.mjs';

class CommonVars {
    constructor() {
        this.termStructure = new RelinkableHandle();
        this.backup = new SavedSettings();
        this.nominals = [100];
        this.frequency = Frequency.Semiannual;
        this.index = new Euribor6M(this.termStructure);
        this.calendar = this.index.fixingCalendar();
        this.convention = BusinessDayConvention.ModifiedFollowing;
        const today = this.calendar.adjust(DateExt.UTC());
        Settings.evaluationDate.set(today);
        const settlementDays = 2;
        this.fixingDays = 2;
        this.settlement =
            this.calendar.advance1(today, settlementDays, TimeUnit.Days);
        this.termStructure.linkTo(flatRate2(this.settlement, 0.05, new ActualActual(ActualActual.Convention.ISDA)));
    }
    makeLeg(startDate, length) {
        const endDate = this.calendar.advance1(startDate, length, TimeUnit.Years, this.convention);
        const schedule = new Schedule().init2(startDate, endDate, new Period().init2(this.frequency), this.calendar, this.convention, this.convention, DateGeneration.Rule.Forward, false);
        return new IborLeg(schedule, this.index)
            .withNotionals2(this.nominals)
            .withPaymentDayCounter(this.index.dayCounter())
            .withPaymentAdjustment(this.convention)
            .withFixingDays1(this.fixingDays)
            .f();
    }
    makeEngine(volatility) {
        const vol = new Handle(new SimpleQuote(volatility));
        return new BlackCapFloorEngine().init2(this.termStructure, vol);
    }
    makeCapFloor(type, leg, strike, volatility) {
        let result;
        switch (type) {
            case CapFloor.Type.Cap:
                result = new Cap(leg, [strike]);
                break;
            case CapFloor.Type.Floor:
                result = new Floor(leg, [strike]);
                break;
            default:
                throw new Error('unknown cap/floor type');
        }
        result.setPricingEngine(this.makeEngine(volatility));
        return result;
    }
}

function checkAbsError(x1, x2, tolerance) {
    return Math.abs(x1 - x2) < tolerance;
}

describe(`Cap and floor tests ${version}`, () => {
    it('Testing cap/floor vega...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 4, 5, 6, 7, 10, 15, 20, 30];
        const vols = [0.01, 0.05, 0.10, 0.15, 0.20];
        const strikes = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09];
        const types = [CapFloor.Type.Cap, CapFloor.Type.Floor];
        const startDate = vars.termStructure.currentLink().referenceDate();
        const shift = 1e-8;
        const tolerance = 0.005;
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < vols.length; j++) {
                for (let k = 0; k < strikes.length; k++) {
                    for (let h = 0; h < types.length; h++) {
                        const leg = vars.makeLeg(startDate, lengths[i]);
                        const capFloor = vars.makeCapFloor(types[h], leg, strikes[k], vols[j]);
                        const shiftedCapFloor2 = vars.makeCapFloor(types[h], leg, strikes[k], vols[j] + shift);
                        const shiftedCapFloor1 = vars.makeCapFloor(types[h], leg, strikes[k], vols[j] - shift);
                        const value1 = shiftedCapFloor1.NPV();
                        const value2 = shiftedCapFloor2.NPV();
                        const numericalVega = (value2 - value1) / (2 * shift);
                        if (numericalVega > 1.0e-4) {
                            const analyticalVega = capFloor.result('vega');
                            let discrepancy = Math.abs(numericalVega - analyticalVega);
                            discrepancy /= numericalVega;
                            expect(discrepancy).toBeLessThan(tolerance);
                        }
                    }
                }
            }
        }
        vars.backup.dispose();
    });

    it('Testing cap/floor dependency on strike...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const vols = [0.01, 0.05, 0.10, 0.15, 0.20];
        const strikes = [0.03, 0.04, 0.05, 0.06, 0.07];
        const startDate = vars.termStructure.currentLink().referenceDate();
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < vols.length; j++) {
                const cap_values = [], floor_values = [];
                for (let k = 0; k < strikes.length; k++) {
                    const leg = vars.makeLeg(startDate, lengths[i]);
                    const cap = vars.makeCapFloor(CapFloor.Type.Cap, leg, strikes[k], vols[j]);
                    cap_values.push(cap.NPV());
                    const floor = vars.makeCapFloor(CapFloor.Type.Floor, leg, strikes[k], vols[j]);
                    floor_values.push(floor.NPV());
                }
                let found = false;
                let it = 1;
                for (; it < cap_values.length; it++) {
                    if (cap_values[it] > cap_values[it - 1]) {
                        found = true;
                    }
                }
                expect(found).toBeFalsy();
                it = 1;
                found = false;
                for (; it < floor_values.length; it++) {
                    if (floor_values[it] < floor_values[it - 1]) {
                        found = true;
                    }
                }
                expect(found).toBeFalsy();
            }
        }
        vars.backup.dispose();
    });

    it('Testing consistency between cap, floor and collar...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const cap_rates = [0.03, 0.04, 0.05, 0.06, 0.07];
        const floor_rates = [0.03, 0.04, 0.05, 0.06, 0.07];
        const vols = [0.01, 0.05, 0.10, 0.15, 0.20];
        const startDate = vars.termStructure.currentLink().referenceDate();
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < cap_rates.length; j++) {
                for (let k = 0; k < floor_rates.length; k++) {
                    for (let l = 0; l < vols.length; l++) {
                        const leg = vars.makeLeg(startDate, lengths[i]);
                        const cap = vars.makeCapFloor(CapFloor.Type.Cap, leg, cap_rates[j], vols[l]);
                        const floor = vars.makeCapFloor(CapFloor.Type.Floor, leg, floor_rates[k], vols[l]);
                        const collar = new Collar(leg, [cap_rates[j]], [floor_rates[k]]);
                        collar.setPricingEngine(vars.makeEngine(vols[l]));
                        expect(Math.abs((cap.NPV() - floor.NPV()) - collar.NPV())).toBeLessThan(1e-10);
                        if (Math.abs((cap.NPV() - floor.NPV()) - collar.NPV()) > 1e-10) {
                            expect(Math.abs((cap.NPV() - floor.NPV()) - collar.NPV()))
                                .toBeLessThan(1e-10);
                            let capletsNPV = 0.0;
                            const caplets = [];
                            for (let m = 0; m < lengths[i] * 2; m++) {
                                caplets.push(cap.optionlet(m));
                                caplets[m].setPricingEngine(vars.makeEngine(vols[l]));
                                capletsNPV += caplets[m].NPV();
                            }
                            expect(Math.abs(cap.NPV() - capletsNPV)).toBeLessThan(1e-10);
                            let floorletsNPV = 0.0;
                            const floorlets = [];
                            for (let m = 0; m < lengths[i] * 2; m++) {
                                floorlets.push(floor.optionlet(m));
                                floorlets[m].setPricingEngine(vars.makeEngine(vols[l]));
                                floorletsNPV += floorlets[m].NPV();
                            }
                            expect(Math.abs(floor.NPV() - floorletsNPV)).toBeLessThan(1e-10);
                            let collarletsNPV = 0.0;
                            const collarlets = [];
                            for (let m = 0; m < lengths[i] * 2; m++) {
                                collarlets.push(collar.optionlet(m));
                                collarlets[m].setPricingEngine(vars.makeEngine(vols[l]));
                                collarletsNPV += collarlets[m].NPV();
                            }
                            expect(Math.abs(collar.NPV() - collarletsNPV))
                                .toBeLessThan(1e-10);
                        }
                    }
                }
            }
        }
    });

    it('Testing cap/floor parity...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const strikes = [0., 0.03, 0.04, 0.05, 0.06, 0.07];
        const vols = [0.01, 0.05, 0.10, 0.15, 0.20];
        const startDate = vars.termStructure.currentLink().referenceDate();
        for (let i = 0; i < lengths.length; i++) {
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < vols.length; k++) {
                    const leg = vars.makeLeg(startDate, lengths[i]);
                    const cap = vars.makeCapFloor(CapFloor.Type.Cap, leg, strikes[j], vols[k]);
                    const floor = vars.makeCapFloor(CapFloor.Type.Floor, leg, strikes[j], vols[k]);
                    const maturity = vars.calendar.advance1(startDate, lengths[i], TimeUnit.Years, vars.convention);
                    const schedule = new Schedule().init2(startDate, maturity, new Period().init2(vars.frequency), vars.calendar, vars.convention, vars.convention, DateGeneration.Rule.Forward, false);
                    const swap = new VanillaSwap(VanillaSwap.Type.Payer, vars.nominals[0], schedule, strikes[j], vars.index.dayCounter(), schedule, vars.index, 0.0, vars.index.dayCounter());
                    swap.setPricingEngine(new DiscountingSwapEngine(vars.termStructure));
                    expect(Math.abs((cap.NPV() - floor.NPV()) - swap.NPV()))
                        .toBeLessThan(1.0e-10);
                }
            }
        }
    });

    it('Testing cap/floor ATM rate...', () => {
        const vars = new CommonVars();
        const lengths = [1, 2, 3, 5, 7, 10, 15, 20];
        const strikes = [0., 0.03, 0.04, 0.05, 0.06, 0.07];
        const vols = [0.01, 0.05, 0.10, 0.15, 0.20];
        const startDate = vars.termStructure.currentLink().referenceDate();
        for (let i = 0; i < lengths.length; i++) {
            const leg = vars.makeLeg(startDate, lengths[i]);
            const maturity = vars.calendar.advance1(startDate, lengths[i], TimeUnit.Years, vars.convention);
            const schedule = new Schedule().init2(startDate, maturity, new Period().init2(vars.frequency), vars.calendar, vars.convention, vars.convention, DateGeneration.Rule.Forward, false);
            for (let j = 0; j < strikes.length; j++) {
                for (let k = 0; k < vols.length; k++) {
                    const cap = vars.makeCapFloor(CapFloor.Type.Cap, leg, strikes[j], vols[k]);
                    const floor = vars.makeCapFloor(CapFloor.Type.Floor, leg, strikes[j], vols[k]);
                    const capATMRate = cap.atmRate(vars.termStructure.currentLink());
                    const floorATMRate = floor.atmRate(vars.termStructure.currentLink());
                    expect(!checkAbsError(floorATMRate, capATMRate, 1.0e-10));
                    const swap = new VanillaSwap(VanillaSwap.Type.Payer, vars.nominals[0], schedule, floorATMRate, vars.index.dayCounter(), schedule, vars.index, 0.0, vars.index.dayCounter());
                    swap.setPricingEngine(new DiscountingSwapEngine(vars.termStructure));
                    const swapNPV = swap.NPV();
                    expect(checkAbsError(swapNPV, 0, 1.0e-10)).toBeTruthy();
                }
            }
        }
    });

    it('Testing implied term volatility for cap and floor...', () => {
        const vars = new CommonVars();
        const maxEvaluations = 100;
        const tolerance = 1.0e-8;
        const types = [CapFloor.Type.Cap, CapFloor.Type.Floor];
        const strikes = [0.02, 0.03, 0.04];
        const lengths = [1, 5, 10];
        const rRates = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07];
        const vols = [0.01, 0.05, 0.10, 0.20, 0.30, 0.70, 0.90];
        for (let k = 0; k < lengths.length; k++) {
            const leg = vars.makeLeg(vars.settlement, lengths[k]);
            for (let i = 0; i < types.length; i++) {
                for (let j = 0; j < strikes.length; j++) {
                    const capfloor = vars.makeCapFloor(types[i], leg, strikes[j], 0.0);
                    for (let n = 0; n < rRates.length; n++) {
                        for (let m = 0; m < vols.length; m++) {
                            const r = rRates[n];
                            const v = vols[m];
                            vars.termStructure.linkTo(flatRate2(vars.settlement, r, new Actual360()));
                            capfloor.setPricingEngine(vars.makeEngine(v));
                            const value = capfloor.NPV();
                            let implVol = 0.0;
                            try {
                                implVol = capfloor.impliedVolatility(value, vars.termStructure, 0.10, tolerance, maxEvaluations, 10.0e-7, 4.0, VolatilityType.ShiftedLognormal, 0.0);
                            }
                            catch (e) {
                                capfloor.setPricingEngine(vars.makeEngine(0.0));
                                const value2 = capfloor.NPV();
                                if (Math.abs(value - value2) < tolerance) {
                                    continue;
                                }
                            }
                            if (Math.abs(implVol - v) > tolerance) {
                                capfloor.setPricingEngine(vars.makeEngine(implVol));
                                const value2 = capfloor.NPV();
                                expect(Math.abs(value - value2)).toBeLessThan(tolerance);
                            }
                        }
                    }
                }
            }
        }
    });

    it('Testing Black cap/floor price against cached values...', () => {
        const vars = new CommonVars();
        const cachedToday = DateExt.UTC('14-March-2002'), cachedSettlement = DateExt.UTC('18-March-2002');
        Settings.evaluationDate.set(cachedToday);
        vars.termStructure.linkTo(flatRate2(cachedSettlement, 0.05, new Actual360()));
        const startDate = vars.termStructure.currentLink().referenceDate();
        const leg = vars.makeLeg(startDate, 20);
        const cap = vars.makeCapFloor(CapFloor.Type.Cap, leg, 0.07, 0.20);
        const floor = vars.makeCapFloor(CapFloor.Type.Floor, leg, 0.03, 0.20);
        const cachedCapNPV = 6.87570026732, cachedFloorNPV = 2.65812927959;
        expect(Math.abs(cap.NPV() - cachedCapNPV)).toBeLessThan(1.0e-11);
        expect(Math.abs(floor.NPV() - cachedFloorNPV)).toBeLessThan(1.0e-11);
    });
});
