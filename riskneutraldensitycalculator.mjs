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
import { Actual365Fixed, AnalyticHestonEngine, Array1D, BlackCalculator, BlackScholesMertonProcess, BlackVolatilityTermStructure, BSMRNDCalculator, BusinessDayConvention, CumulativeNormalDistribution, DateExt, EuropeanExercise, FdBlackScholesVanillaEngine, FdmSchemeDesc, GaussLobattoIntegral, GBSMRNDCalculator, Handle, HestonBlackVolSurface, HestonModel, HestonProcess, HestonRNDCalculator, LocalConstantVol, LocalVolRNDCalculator, NoExceptLocalVolSurface, NormalDistribution, NullCalendar, Option, PlainVanillaPayoff, QL_EPSILON, QL_MAX_REAL, SavedSettings, Settings, SimpleQuote, SquareRootProcessRNDCalculator, TimeGrid, TimeUnit, VanillaOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatVol4 } from '/test-suite/utilities.mjs';

class DumasParametricVolSurface extends BlackVolatilityTermStructure {
    constructor(b1, b2, b3, b4, b5, spot, rTS, qTS) {
        super();
        this._b1 = b1;
        this._b2 = b2;
        this._b3 = b3;
        this._b4 = b4;
        this._b5 = b5;
        this._spot = spot;
        this._rTS = rTS;
        this._qTS = qTS;
        this.bvtsInit3(0, new NullCalendar(), BusinessDayConvention.Following, rTS.dayCounter());
    }
    maxDate() {
        return DateExt.maxDate();
    }
    minStrike() {
        return 0.0;
    }
    maxStrike() {
        return QL_MAX_REAL;
    }
    blackVolImpl(t, strike) {
        if (t < 0.0) {
            throw new Error('t must be >= 0');
        }
        if (t < QL_EPSILON) {
            return this._b1;
        }
        const fwd = this._spot.value() * this._qTS.discount2(t) / this._rTS.discount2(t);
        const mn = Math.log(fwd / strike) / Math.sqrt(t);
        return this._b1 + this._b2 * mn + this._b3 * mn * mn + this._b4 * t +
            this._b5 * mn * t;
    }
}

class ProbWeightedPayoff {
    constructor(t, payoff, calc) {
        this._t = t;
        this._payoff = payoff;
        this._calc = calc;
    }
    f(x) {
        return this._calc.pdf(x, this._t) * this._payoff.f(Math.exp(x));
    }
}

function adaptiveTimeGrid(maxStepsPerYear, minStepsPerYear, decay, endTime) {
    const maxDt = 1.0 / maxStepsPerYear;
    const minDt = 1.0 / minStepsPerYear;
    let t = 0.0;
    const times = [t];
    while (t < endTime) {
        const dt = maxDt * Math.exp(-decay * t) + minDt * (1.0 - Math.exp(-decay * t));
        t += dt;
        times.push(Math.min(endTime, t));
    }
    return times;
}

class SquareRootProcessParams {
    constructor(v0, kappa, theta, sigma) {
        this.v0 = v0;
        this.kappa = kappa;
        this.theta = theta;
        this.sigma = sigma;
    }
}

describe(`Risk neutral density calculator tests ${version}`, () => {
    it('Testing density against option prices...', () => {
        const backup = new SavedSettings();
        const dayCounter = new Actual365Fixed();
        const todaysDate = Settings.evaluationDate.f();
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.075;
        const q = 0.04;
        const v = 0.27;
        const rTS = new Handle(flatRate2(todaysDate, r, dayCounter));
        const qTS = new Handle(flatRate2(todaysDate, q, dayCounter));
        const bsmProcess = new BlackScholesMertonProcess(spot, qTS, rTS, new Handle(flatVol4(v, dayCounter)));
        const bsm = new BSMRNDCalculator(bsmProcess);
        const times = [0.5, 1.0, 2.0];
        const strikes = [75.0, 100.0, 150.0];
        for (let i = 0; i < times.length; ++i) {
            const t = times[i];
            const stdDev = v * Math.sqrt(t);
            const df = rTS.currentLink().discount2(t);
            const fwd = s0 * qTS.currentLink().discount2(t) / df;
            for (let j = 0; j < strikes.length; ++j) {
                const strike = strikes[j];
                const xs = Math.log(strike);
                const blackCalc = new BlackCalculator().init2(Option.Type.Put, strike, fwd, stdDev, df);
                const tol = Math.sqrt(QL_EPSILON);
                const calculatedCDF = bsm.cdf(xs, t);
                const expectedCDF = blackCalc.strikeSensitivity() / df;
                expect(Math.abs(calculatedCDF - expectedCDF)).toBeLessThan(tol);
                const deltaStrike = strike * Math.sqrt(QL_EPSILON);
                const calculatedPDF = bsm.pdf(xs, t);
                const expectedPDF = strike / df *
                    (new BlackCalculator()
                        .init2(Option.Type.Put, strike + deltaStrike, fwd, stdDev, df)
                        .strikeSensitivity() -
                        new BlackCalculator()
                            .init2(Option.Type.Put, strike - deltaStrike, fwd, stdDev, df)
                            .strikeSensitivity()) /
                    (2 * deltaStrike);
                expect(Math.abs(calculatedPDF - expectedPDF)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing Black-Scholes-Merton and Heston densities...', () => {
        const backup = new SavedSettings();
        const dayCounter = new Actual365Fixed();
        const todaysDate = Settings.evaluationDate.f();
        const s0 = 10;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.155;
        const q = 0.0721;
        const v = 0.27;
        const kappa = 1.0;
        const theta = v * v;
        const rho = -0.75;
        const v0 = v * v;
        const sigma = 0.0001;
        const rTS = new Handle(flatRate2(todaysDate, r, dayCounter));
        const qTS = new Handle(flatRate2(todaysDate, q, dayCounter));
        const bsmProcess = new BlackScholesMertonProcess(spot, qTS, rTS, new Handle(flatVol4(v, dayCounter)));
        const bsm = new BSMRNDCalculator(bsmProcess);
        const heston = new HestonRNDCalculator(new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho), 1e-8);
        const times = [0.5, 1.0, 2.0];
        const strikes = [7.5, 10, 15];
        const probs = [1e-6, 0.01, 0.5, 0.99, 1.0 - 1e-6];
        for (let i = 0; i < times.length; ++i) {
            const t = times[i];
            for (let j = 0; j < strikes.length; ++j) {
                const strike = strikes[j];
                const xs = Math.log(strike);
                const expectedPDF = bsm.pdf(xs, t);
                const calculatedPDF = heston.pdf(xs, t);
                const tol = 1e-4;
                expect(Math.abs(expectedPDF - calculatedPDF)).toBeLessThan(tol);
                const expectedCDF = bsm.cdf(xs, t);
                const calculatedCDF = heston.cdf(xs, t);
                expect(Math.abs(expectedCDF - calculatedCDF)).toBeLessThan(tol);
            }
            for (let j = 0; j < probs.length; ++j) {
                const prob = probs[j];
                const expectedInvCDF = bsm.invcdf(prob, t);
                const calculatedInvCDF = heston.invcdf(prob, t);
                const tol = 1e-3;
                expect(Math.abs(expectedInvCDF - calculatedInvCDF)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing Fokker-Planck forward equation for local volatility' +
        ' process to calculate risk neutral densities...', () => {
        const backup = new SavedSettings();
        const dayCounter = new Actual365Fixed();
        const todaysDate = DateExt.UTC('28,Dec,2012');
        Settings.evaluationDate.set(todaysDate);
        const r = 0.015;
        const q = 0.025;
        const s0 = 100;
        const v = 0.25;
        const spot = new SimpleQuote(s0);
        const rTS = flatRate2(todaysDate, r, dayCounter);
        const qTS = flatRate2(todaysDate, q, dayCounter);
        const timeGrid = new TimeGrid().init1(1.0, 101);
        const constVolCalc = new LocalVolRNDCalculator().lvrndcInit2(spot, rTS, qTS, new LocalConstantVol().lcvInit1(todaysDate, v, dayCounter), timeGrid, 201);
        const rTol = 0.01, atol = 0.005;
        for (let t = 0.1; t < 0.99; t += 0.015) {
            const stdDev = v * Math.sqrt(t);
            const xm = -0.5 * stdDev * stdDev +
                Math.log(s0 * qTS.discount2(t) / rTS.discount2(t));
            const gaussianPDF = new NormalDistribution(xm, stdDev);
            const gaussianCDF = new CumulativeNormalDistribution(xm, stdDev);
            for (let x = xm - 3 * stdDev; x < xm + 3 * stdDev; x += 0.05) {
                const expectedPDF = gaussianPDF.f(x);
                const calculatedPDF = constVolCalc.pdf(x, t);
                const absDiffPDF = Math.abs(expectedPDF - calculatedPDF);
                expect(absDiffPDF).toBeLessThan(atol);
                expect(absDiffPDF / expectedPDF).toBeLessThan(rTol);
                const expectedCDF = gaussianCDF.f(x);
                const calculatedCDF = constVolCalc.cdf(x, t);
                const absDiffCDF = Math.abs(expectedCDF - calculatedCDF);
                expect(absDiffCDF).toBeLessThan(atol);
                const expectedX = x;
                const calculatedX = constVolCalc.invcdf(expectedCDF, t);
                const absDiffX = Math.abs(expectedX - calculatedX);
                expect(absDiffX).toBeLessThan(atol);
                expect(absDiffX / expectedX).toBeLessThan(rTol);
            }
        }
        const tl = timeGrid.at(timeGrid.size() - 5);
        const xl = constVolCalc.mesher(tl).locations()[0];
        expect(constVolCalc.pdf(xl + 0.0001, tl)).toBeGreaterThan(0.0);
        expect(constVolCalc.pdf(xl - 0.0001, tl)).toEqual(0.0);
        const b1 = 0.25;
        const b2 = 0.03;
        const b3 = 0.005;
        const b4 = -0.02;
        const b5 = -0.005;
        const dumasVolSurface = new DumasParametricVolSurface(b1, b2, b3, b4, b5, spot, rTS, qTS);
        const bsmProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(dumasVolSurface));
        const localVolSurface = new NoExceptLocalVolSurface().nelvsInit1(new Handle(dumasVolSurface), new Handle(rTS), new Handle(qTS), new Handle(spot), b1);
        const adaptiveGrid = adaptiveTimeGrid(400, 50, 5.0, 3.0);
        const dumasTimeGrid = new TimeGrid().init2(adaptiveGrid, 0, adaptiveGrid.length);
        const dumasVolCalc = new LocalVolRNDCalculator().lvrndcInit2(spot, rTS, qTS, localVolSurface, dumasTimeGrid, 401, 0.1, 1e-8);
        const strikes = [25, 50, 95, 100, 105, 150, 200, 400];
        const maturityDates = [
            DateExt.advance(todaysDate, 1, TimeUnit.Weeks),
            DateExt.advance(todaysDate, 1, TimeUnit.Months),
            DateExt.advance(todaysDate, 3, TimeUnit.Months),
            DateExt.advance(todaysDate, 6, TimeUnit.Months),
            DateExt.advance(todaysDate, 12, TimeUnit.Months),
            DateExt.advance(todaysDate, 18, TimeUnit.Months),
            DateExt.advance(todaysDate, 2, TimeUnit.Years),
            DateExt.advance(todaysDate, 3, TimeUnit.Years)
        ];
        const maturities = Array.from(maturityDates);
        for (let i = 0; i < maturities.length; ++i) {
            const expiry = rTS.dayCounter().yearFraction(todaysDate, maturities[i]);
            const engine = new FdBlackScholesVanillaEngine(bsmProcess, Math.max(51, (expiry * 101)), 201, 0, FdmSchemeDesc.Douglas(), true, b1);
            const exercise = new EuropeanExercise(maturities[i]);
            for (let k = 0; k < strikes.length; ++k) {
                const strike = strikes[k];
                const payoff = new PlainVanillaPayoff((strike > spot.value()) ? Option.Type.Call : Option.Type.Put, strike);
                const option = new VanillaOption(payoff, exercise);
                option.setPricingEngine(engine);
                const expected = option.NPV();
                const tx = Math.max(dumasTimeGrid.at(1), dumasTimeGrid.closestTime(expiry));
                const x = dumasVolCalc.mesher(tx).locations();
                const probWeightedPayoff = new ProbWeightedPayoff(expiry, payoff, dumasVolCalc);
                const df = rTS.discount2(expiry);
                const calculated = new GaussLobattoIntegral(10000, 1e-10)
                    .f(probWeightedPayoff, x[0], Array1D.back(x)) *
                    df;
                const absDiff = Math.abs(expected - calculated);
                expect(absDiff).toBeLessThan(0.5 * atol);
            }
        }
        backup.dispose();
    });

    it('Testing probability density for a square root process...', () => {
        const params = [
            new SquareRootProcessParams(0.17, 1.0, 0.09, 0.5),
            new SquareRootProcessParams(1.0, 0.6, 0.1, 0.75),
            new SquareRootProcessParams(0.005, 0.6, 0.1, 0.05)
        ];
        for (let i = 0; i < params.length; ++i) {
            const rndCalculator = new SquareRootProcessRNDCalculator(params[i].v0, params[i].kappa, params[i].theta, params[i].sigma);
            const t = 0.75;
            const tInfty = 60.0 / params[i].kappa;
            const tol = 1e-10;
            for (let v = 1e-5; v < 1.0; v += (v < params[i].theta) ? 0.005 : 0.1) {
                const cdfCalculated = rndCalculator.cdf(v, t);
                const cdfExpected = new GaussLobattoIntegral(10000, 0.01 * tol)
                    .f({ f: (_1) => rndCalculator.pdf(_1, t) }, 0, v);
                expect(Math.abs(cdfCalculated - cdfExpected)).toBeLessThan(tol);
                if (cdfExpected < (1 - 1e-6) && cdfExpected > 1e-6) {
                    const vCalculated = rndCalculator.invcdf(cdfCalculated, t);
                    expect(Math.abs(v - vCalculated)).toBeLessThan(tol);
                    const statPdfCalculated = rndCalculator.pdf(v, tInfty);
                    const statPdfExpected = rndCalculator.stationary_pdf(v);
                    expect(Math.abs(statPdfCalculated - statPdfExpected))
                        .toBeLessThan(tol);
                    const statCdfCalculated = rndCalculator.cdf(v, tInfty);
                    const statCdfExpected = rndCalculator.stationary_cdf(v);
                    expect(Math.abs(statCdfCalculated - statCdfExpected))
                        .toBeLessThan(tol);
                }
                for (let q = 1e-5; q < 1.0; q += 0.001) {
                    const statInvCdfCalculated = rndCalculator.invcdf(q, tInfty);
                    const statInvCdfExpected = rndCalculator.stationary_invcdf(q);
                    expect(Math.abs(statInvCdfCalculated - statInvCdfExpected))
                        .toBeLessThan(tol);
                }
            }
        }
    });

    it('Testing probability density for a BSM process with strike' +
        ' dependent volatility vs local volatility...', () => {
        const backup = new SavedSettings();
        const todaysDate = DateExt.UTC('3,Oct,2016');
        Settings.evaluationDate.set(todaysDate);
        const dc = new Actual365Fixed();
        const maturityDate = DateExt.advance(todaysDate, 3, TimeUnit.Months);
        const maturity = dc.yearFraction(todaysDate, maturityDate);
        const r = 0.08;
        const q = 0.03;
        const s0 = 100;
        const v0 = 0.06;
        const kappa = 1.0;
        const theta = 0.06;
        const sigma = 0.4;
        const rho = -0.75;
        const rTS = new Handle(flatRate2(todaysDate, r, dc));
        const qTS = new Handle(flatRate2(todaysDate, q, dc));
        const spot = new Handle(new SimpleQuote(s0));
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonSurface = new Handle(new HestonBlackVolSurface(new Handle(new HestonModel(hestonProcess)), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.discreteTrapezoid(32)));
        const timeGrid = new TimeGrid().init1(maturity, 51);
        const localVol = new NoExceptLocalVolSurface().nelvsInit1(hestonSurface, rTS, qTS, spot, Math.sqrt(theta));
        const localVolCalc = new LocalVolRNDCalculator().lvrndcInit2(spot.currentLink(), rTS.currentLink(), qTS.currentLink(), localVol, timeGrid, 151, 0.25);
        const hestonCalc = new HestonRNDCalculator(hestonProcess);
        const gbsmCalc = new GBSMRNDCalculator(new BlackScholesMertonProcess(spot, qTS, rTS, hestonSurface));
        const strikes = [85, 75, 90, 110, 125, 150];
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            const logStrike = Math.log(strike);
            const expected = hestonCalc.cdf(logStrike, maturity);
            const calculatedGBSM = gbsmCalc.cdf(strike, maturity);
            const gbsmTol = 1e-5;
            expect(Math.abs(expected - calculatedGBSM)).toBeLessThan(gbsmTol);
            const calculatedLocalVol = localVolCalc.cdf(logStrike, maturity);
            const localVolTol = 1e-3;
            expect(Math.abs(expected - calculatedLocalVol))
                .toBeLessThan(localVolTol);
        }
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            const logStrike = Math.log(strike);
            const expected = hestonCalc.pdf(logStrike, maturity) / strike;
            const calculatedGBSM = gbsmCalc.pdf(strike, maturity);
            const gbsmTol = 1e-5;
            expect(Math.abs(expected - calculatedGBSM)).toBeLessThan(gbsmTol);
            const calculatedLocalVol = localVolCalc.pdf(logStrike, maturity) / strike;
            const localVolTol = 1e-4;
            expect(Math.abs(expected - calculatedLocalVol))
                .toBeLessThan(localVolTol);
        }
        const quantiles = [0.05, 0.25, 0.5, 0.75, 0.95];
        for (let i = 0; i < quantiles.length; ++i) {
            const quantile = quantiles[i];
            const expected = Math.exp(hestonCalc.invcdf(quantile, maturity));
            const calculatedGBSM = gbsmCalc.invcdf(quantile, maturity);
            const gbsmTol = 1e-3;
            expect(Math.abs(expected - calculatedGBSM)).toBeLessThan(gbsmTol);
            const calculatedLocalVol = Math.exp(localVolCalc.invcdf(quantile, maturity));
            const localVolTol = 0.1;
            expect(Math.abs(expected - calculatedLocalVol))
                .toBeLessThan(localVolTol);
        }
        backup.dispose();
    });
});
