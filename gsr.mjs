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
import { Actual365Fixed, Array1D, DateExt, EuriborSwapIsdaFixA, EuropeanExercise, FlatForward, Gaussian1dJamshidianSwaptionEngine, Gaussian1dNonstandardSwaptionEngine, Gaussian1dSwaptionEngine, Gsr, GsrProcess, Handle, HullWhite, HullWhiteForwardProcess, JamshidianSwaptionEngine, MakeVanillaSwap, NonstandardSwaption, Period, Settings, Swaption, TARGET, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`GSR model tests ${version}`, () => {
    it('Testing GSR process...', () => {
        const refDate = Settings.evaluationDate.f();
        const tol = 1E-8;
        const reversion = 0.01;
        const modelvol = 0.01;
        const yts0 = new Handle(new FlatForward().ffInit4(0, new TARGET(), 0.00, new Actual365Fixed()));
        const stepDates0 = [];
        const vols0 = [modelvol];
        const reversions0 = [reversion];
        const stepDates1 = [];
        for (let i = 1; i < 60; i++) {
            stepDates1.push(DateExt.advance(refDate, i * 6, TimeUnit.Months));
        }
        const vols1 = Array1D.fromSizeValue(stepDates1.length + 1, modelvol);
        const reversions1 = Array1D.fromSizeValue(stepDates1.length + 1, reversion);
        let T = 10.0;
        do {
            const model = new Gsr().gsrInit2(yts0, stepDates0, vols0, reversions0, T);
            const gsrProcess = model.stateProcess();
            const model2 = new Gsr().gsrInit2(yts0, stepDates1, vols1, reversions1, T);
            const gsrProcess2 = model2.stateProcess();
            const hwProcess = new HullWhiteForwardProcess(yts0, reversion, modelvol);
            hwProcess.setForwardMeasureTime(T);
            let w, t, xw, hwVal, gsrVal, gsr2Val;
            t = 0.5;
            do {
                w = 0.0;
                do {
                    xw = -0.1;
                    do {
                        hwVal = hwProcess.expectation2(w, xw, t - w);
                        gsrVal = gsrProcess.expectation2(w, xw, t - w);
                        gsr2Val = gsrProcess2.expectation2(w, xw, t - w);
                        expect(Math.abs(hwVal - gsrVal)).toBeLessThan(tol);
                        expect(Math.abs(hwVal - gsr2Val)).toBeLessThan(tol);
                        hwVal = hwProcess.variance(w, xw, t - w);
                        gsrVal = gsrProcess.variance(w, xw, t - w);
                        gsr2Val = gsrProcess2.variance(w, xw, t - w);
                        expect(Math.abs(hwVal - gsrVal)).toBeLessThan(tol);
                        expect(Math.abs(hwVal - gsr2Val)).toBeLessThan(tol);
                        xw += 0.01;
                    } while (xw <= 0.1);
                    w += t / 5.0;
                } while (w <= t - 0.1);
                t += T / 20.0;
            } while (t <= T - 0.1);
            T += 10.0;
        } while (T <= 30.0);
        const times = new Array(2);
        const vols = new Array(3);
        const reversions = new Array(3);
        times[0] = 1.0;
        times[1] = 2.0;
        vols[0] = 0.2;
        vols[1] = 0.3;
        vols[2] = 0.4;
        reversions[0] = 0.50;
        reversions[1] = 0.80;
        reversions[2] = 1.30;
        const p = new GsrProcess(times, vols, reversions);
        p.setForwardMeasureTime(10.0);
    });

    it('Testing GSR model...', () => {
        const refDate = Settings.evaluationDate.f();
        const modelvol = 0.01;
        const reversion = 0.01;
        const stepDates = [];
        const vols = [modelvol];
        const reversions = [reversion];
        const stepDates1 = [];
        for (let i = 1; i < 60; i++) {
            stepDates1.push(DateExt.advance(refDate, i * 6, TimeUnit.Months));
        }
        const vols1 = Array1D.fromSizeValue(stepDates1.length + 1, modelvol);
        const reversions1 = Array1D.fromSizeValue(stepDates1.length + 1, reversion);
        const yts = new Handle(new FlatForward().ffInit4(0, new TARGET(), 0.03, new Actual365Fixed()));
        const model = new Gsr().gsrInit2(yts, stepDates, vols, reversions, 50.0);
        const model2 = new Gsr().gsrInit2(yts, stepDates1, vols1, reversions1, 50.0);
        const hw = new HullWhite(yts, reversion, modelvol);
        const tol0 = 1E-8;
        let w, t, xw;
        w = 0.1;
        do {
            t = w + 0.1;
            do {
                xw = -0.10;
                do {
                    const yw = (xw - model.stateProcess().expectation2(0.0, 0.0, w)) /
                        model.stateProcess().stdDeviation2(0.0, 0.0, w);
                    const rw = xw + 0.03;
                    const gsrVal = model.zerobond1(t, w, yw);
                    const gsr2Val = model2.zerobond1(t, w, yw);
                    const hwVal = hw.discountBond2(w, t, rw);
                    expect(Math.abs(gsrVal - hwVal)).toBeLessThan(tol0);
                    expect(Math.abs(gsr2Val - hwVal)).toBeLessThan(tol0);
                    xw += 0.01;
                } while (xw <= 0.10);
                t += 2.5;
            } while (t <= 50.0);
            w += 5.0;
        } while (w <= 50.0);
        const expiry = new TARGET().advance1(refDate, 5, TimeUnit.Years);
        const tenor = new Period().init1(10, TimeUnit.Years);
        const swpIdx = new EuriborSwapIsdaFixA().esInit1(tenor, yts);
        const forward = swpIdx.fixing(expiry);
        const underlyingFixed = new MakeVanillaSwap(new Period().init1(10, TimeUnit.Years), swpIdx.iborIndex(), forward)
            .withEffectiveDate(swpIdx.valueDate(expiry))
            .withFixedLegCalendar(swpIdx.fixingCalendar())
            .withFixedLegDayCount(swpIdx.dayCounter())
            .withFixedLegTenor(swpIdx.fixedLegTenor())
            .withFixedLegConvention(swpIdx.fixedLegConvention())
            .withFixedLegTerminationDateConvention(swpIdx.fixedLegConvention())
            .f();
        const exercise = new EuropeanExercise(expiry);
        const stdswaption = new Swaption(underlyingFixed, exercise);
        const nonstdswaption = new NonstandardSwaption().nssInit1(stdswaption);
        stdswaption.setPricingEngine(new JamshidianSwaptionEngine(hw, yts));
        const HwJamNpv = stdswaption.NPV();
        nonstdswaption.setPricingEngine(new Gaussian1dNonstandardSwaptionEngine().g1dnsseInit1(model, 64, 7.0, true, false));
        stdswaption.setPricingEngine(new Gaussian1dSwaptionEngine().g1dseInit1(model, 64, 7.0, true, false));
        const GsrNonStdNpv = nonstdswaption.NPV();
        const GsrStdNpv = stdswaption.NPV();
        stdswaption.setPricingEngine(new Gaussian1dJamshidianSwaptionEngine(model));
        const GsrJamNpv = stdswaption.NPV();
        expect(Math.abs(HwJamNpv - GsrNonStdNpv)).toBeLessThan(0.00005);
        expect(Math.abs(HwJamNpv - GsrStdNpv)).toBeLessThan(0.00005);
        expect(Math.abs(HwJamNpv - GsrJamNpv)).toBeLessThan(0.00005);
    });
});
