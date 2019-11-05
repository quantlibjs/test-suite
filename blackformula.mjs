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
import { Actual365Fixed, bachelierBlackFormula1, bachelierBlackFormulaImpliedVol, blackFormula1, blackFormula2, blackFormulaImpliedStdDevApproximationRS1, blackFormulaImpliedStdDevApproximationRS2, blackFormulaImpliedStdDevChambers1, blackFormulaImpliedStdDevLiRS2, DateExt, Option, PlainVanillaPayoff, QL_NULL_REAL, SavedSettings, Settings, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate4 } from '/test-suite/utilities.mjs';

describe(`Black formula tests ${version}`, () => {
    it('Testing Bachelier implied vol...', () => {
        const forward = 1.0;
        const bpvol = 0.01;
        const tte = 10.0;
        const stdDev = bpvol * Math.sqrt(tte);
        const optionType = Option.Type.Call;
        const discount = 0.95;
        const d = [-3.0, -2.0, -1.0, -0.5, 0.0, 0.5, 1.0, 2.0, 3.0];
        for (let i = 0; i < d.length; ++i) {
            const strike = forward - d[i] * bpvol * Math.sqrt(tte);
            const callPrem = bachelierBlackFormula1(optionType, strike, forward, stdDev, discount);
            const impliedBpVol = bachelierBlackFormulaImpliedVol(optionType, strike, forward, tte, callPrem, discount);
            expect(Math.abs(bpvol - impliedBpVol)).toBeLessThan(1.0e-12);
        }
    });

    it('Testing Chambers-Nawalkha implied vol approximation...', () => {
        const types = [Option.Type.Call, Option.Type.Put];
        const displacements = [0.0000, 0.0010, 0.0050, 0.0100, 0.0200];
        const forwards = [-0.0010, 0.0000, 0.0050, 0.0100, 0.0200, 0.0500];
        const strikes = [
            -0.0100, -0.0050, -0.0010, 0.0000, 0.0010, 0.0050, 0.0100, 0.0200, 0.0500,
            0.1000
        ];
        const stdDevs = [0.10, 0.15, 0.20, 0.30, 0.50, 0.60, 0.70, 0.80, 1.00, 1.50, 2.00];
        const discounts = [1.00, 0.95, 0.80, 1.10];
        const tol = 5.0E-4;
        for (let i1 = 0; i1 < types.length; ++i1) {
            for (let i2 = 0; i2 < displacements.length; ++i2) {
                for (let i3 = 0; i3 < forwards.length; ++i3) {
                    for (let i4 = 0; i4 < strikes.length; ++i4) {
                        for (let i5 = 0; i5 < stdDevs.length; ++i5) {
                            for (let i6 = 0; i6 < discounts.length; ++i6) {
                                if (forwards[i3] + displacements[i2] > 0.0 &&
                                    strikes[i4] + displacements[i2] > 0.0) {
                                    const premium = blackFormula1(types[i1], strikes[i4], forwards[i3], stdDevs[i5], discounts[i6], displacements[i2]);
                                    const atmPremium = blackFormula1(types[i1], forwards[i3], forwards[i3], stdDevs[i5], discounts[i6], displacements[i2]);
                                    const iStdDev = blackFormulaImpliedStdDevChambers1(types[i1], strikes[i4], forwards[i3], premium, atmPremium, discounts[i6], displacements[i2]);
                                    let moneyness = (strikes[i4] + displacements[i2]) /
                                        (forwards[i3] + displacements[i2]);
                                    if (moneyness > 1.0) {
                                        moneyness = 1.0 / moneyness;
                                    }
                                    const error = (iStdDev - stdDevs[i5]) / stdDevs[i5] * moneyness;
                                    expect(error).toBeLessThan(tol);
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    it('Testing Radoicic-Stefanica implied vol approximation...', () => {
        const T = 1.7;
        const r = 0.1;
        const df = Math.exp(-r * T);
        const forward = 100;
        const vol = 0.3;
        const stdDev = vol * Math.sqrt(T);
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50, 60, 70, 80, 90, 100, 110, 125, 150, 200, 300];
        const tol = 0.02;
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            for (let j = 0; j < types.length; ++j) {
                const type = types[j];
                const payoff = new PlainVanillaPayoff(type, strike);
                const marketValue = blackFormula2(payoff, forward, stdDev, df);
                const estVol = blackFormulaImpliedStdDevApproximationRS2(payoff, forward, marketValue, df) /
                    Math.sqrt(T);
                const error = Math.abs(estVol - vol);
                expect(error).toBeLessThan(tol);
            }
        }
    });

    it('Testing Radoicic-Stefanica lower bound...', () => {
        const forward = 1.0;
        const k = 1.2;
        for (let s = 0.17; s < 2.9; s += 0.01) {
            const strike = Math.exp(k) * forward;
            const c = blackFormula1(Option.Type.Call, strike, forward, s);
            const estimate = blackFormulaImpliedStdDevApproximationRS1(Option.Type.Call, strike, forward, c);
            const error = s - estimate;
            expect(estimate).not.toEqual(NaN);
            expect(Math.abs(error)).toBeLessThan(0.05);
            expect(c > 1e-6 && error < 0.0).toBeFalsy();
        }
    });
    
    it('Testing implied volatility calculation via ' +
        'adaptive successive over-relaxation...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date('12-July-2017');
        Settings.evaluationDate.set(today);
        const exerciseDate = DateExt.advance(today, 15, TimeUnit.Months);
        const exerciseTime = dc.yearFraction(today, exerciseDate);
        const rTS = flatRate4(0.10, dc);
        const qTS = flatRate4(0.06, dc);
        const df = rTS.discount1(exerciseDate);
        const vol = 0.20;
        const stdDev = vol * Math.sqrt(exerciseTime);
        const s0 = 100;
        const forward = s0 * qTS.discount1(exerciseDate) / df;
        const types = [Option.Type.Call, Option.Type.Put];
        const strikes = [50, 60, 70, 80, 90, 100, 110, 125, 150, 200];
        const displacements = [0, 25, 50, 100];
        const tol = 1e-8;
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            for (let j = 0; j < types.length; ++j) {
                const type = types[j];
                const payoff = new PlainVanillaPayoff(type, strike);
                for (let k = 0; k < displacements.length; ++k) {
                    const displacement = displacements[k];
                    const marketValue = blackFormula2(payoff, forward, stdDev, df, displacement);
                    const impliedStdDev = blackFormulaImpliedStdDevLiRS2(payoff, forward, marketValue, df, displacement, QL_NULL_REAL, 1.0, tol, 100);
                    const error = Math.abs(impliedStdDev - stdDev);
                    expect(error).toBeLessThan(10 * tol);
                }
            }
        }
        backup.dispose();
    });
});