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
import { Actual365Fixed, ActualActual, AnalyticDoubleBarrierBinaryEngine, AnalyticEuropeanEngine, AnalyticHestonEngine, Array1D, Array2D, BlackCalculator, CashOrNothingPayoff, CostFunction, DateExt, DoubleBarrier, DoubleBarrierOption, EuropeanExercise, FdHestonDoubleBarrierEngine, FdmHestonGreensFct, FdmSchemeDesc, FdmSquareRootFwdOp, ForwardVanillaEngine, ForwardVanillaOption, GaussLobattoIntegral, GeneralizedBlackScholesProcess, Handle, HestonBlackVolSurface, HestonModel, HestonProcess, HestonSLVFDMModel, HestonSLVFokkerPlanckFdmParams, HestonSLVProcess, ImpliedVolatilityHelper, InverseCumulativeNonCentralChiSquare, LagrangeInterpolation, MersenneTwisterUniformRng, MultiPathGenerator, NoExceptLocalVolSurface, NonCentralChiSquareDistribution, Option, PlainVanillaPayoff, RandomSequenceGenerator, SABRVolTermStructure, SavedSettings, Settings, SimpleQuote, SobolBrownianBridgeRsg, SobolRsg, SquareRootCLVModel, SquareRootProcess, TimeGrid, TimeUnit, VanillaOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate4, flatVol1, flatVol2, flatVol4 } from '/test-suite/utilities.mjs';

class CLVModelPayoff extends PlainVanillaPayoff {
    constructor(type, strike, g) {
        super(type, strike);
        this._g = g;
    }
    f(x) {
        return super.f(this._g.f(x));
    }
}

class SquareRootCLVCalibrationFunction extends CostFunction {
    constructor(strikes, resetDates, maturityDates, bsProcess, refVols, nScenarios = 10000) {
        super();
        this._strikes = Array.from(strikes);
        this._resetDates = Array.from(resetDates);
        this._maturityDates = Array.from(maturityDates);
        this._bsProcess = bsProcess;
        this._refVols = Array.from(refVols);
        this._nScenarios = nScenarios;
        const c = new Set(resetDates);
        for (let i = 0; i < maturityDates.length; i++) {
            c.add(maturityDates[i]);
        }
        this._calibrationDates = Array.from(c);
    }
    value(params) {
        const diff = this.values(params);
        let retVal = 0.0;
        for (let i = 0; i < diff.length; ++i) {
            retVal += diff[i] * diff[i];
        }
        return retVal;
    }
    values(params) {
        const theta = params[0];
        const kappa = params[1];
        const sigma = params[2];
        const x0 = params[3];
        const vol = new SimpleQuote(0.1);
        const rTS = this._bsProcess.riskFreeRate();
        const qTS = this._bsProcess.dividendYield();
        const spot = new Handle(new SimpleQuote(this._bsProcess.x0()));
        const fwdEngine = new ForwardVanillaEngine(new AnalyticEuropeanEngine())
            .init1(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol1(rTS.currentLink().referenceDate(), vol, rTS.currentLink().dayCounter()))));
        const sqrtProcess = new SquareRootProcess(theta, kappa, sigma, x0);
        const clvSqrtModel = new SquareRootCLVModel(this._bsProcess, sqrtProcess, this._calibrationDates, 14, 1 - 1e-14, 1e-14);
        const gSqrt = clvSqrtModel.g();
        const retVal = new Array(this._resetDates.length * this._strikes.length);
        for (let i = 0, n = this._resetDates.length; i < n; ++i) {
            const resetDate = this._resetDates[i];
            const maturityDate = this._maturityDates[i];
            const t0 = this._bsProcess.time(resetDate);
            const t1 = this._bsProcess.time(maturityDate);
            const df = 4 * theta * kappa / (sigma * sigma);
            const ncp = 4 * kappa * Math.exp(-kappa * t0) /
                (sigma * sigma * (1 - Math.exp(-kappa * t0))) * x0;
            const ncp1 = 4 * kappa * Math.exp(-kappa * (t1 - t0)) /
                (sigma * sigma * (1 - Math.exp(-kappa * (t1 - t0))));
            const ursg = new SobolRsg().init(2, 1235);
            const stats = new Array(this._strikes.length);
            for (let j = 0; j < this._nScenarios; ++j) {
                const path = ursg.nextSequence().value;
                const x1 = new InverseCumulativeNonCentralChiSquare(df, ncp).f(path[0]);
                const u1 = sigma * sigma * (1 - Math.exp(-kappa * t0)) / (4 * kappa) * x1;
                const x2 = new InverseCumulativeNonCentralChiSquare(df, ncp1 * u1).f(path[1]);
                const u2 = sigma * sigma * (1 - Math.exp(-kappa * (t1 - t0))) /
                    (4 * kappa) * x2;
                const X2 = u2 * 4 * kappa / (sigma * sigma * (1 - Math.exp(-kappa * t1)));
                const s1 = gSqrt.f(t0, x1);
                const s2 = gSqrt.f(t1, X2);
                for (let k = 0; k < this._strikes.length; ++k) {
                    const strike = this._strikes[k];
                    const payoff = (strike < 1.0) ?
                        s1 * Math.max(0.0, strike - s2 / s1) :
                        s1 * Math.max(0.0, s2 / s1 - strike);
                    stats[k].add(payoff);
                }
            }
            const exercise = new EuropeanExercise(maturityDate);
            const dF = this._bsProcess.riskFreeRate().currentLink().discount1(maturityDate);
            for (let k = 0; k < this._strikes.length; ++k) {
                const strike = this._strikes[k];
                const npv = stats[k].mean() * dF;
                const payoff = new PlainVanillaPayoff((strike < 1.0) ? Option.Type.Put : Option.Type.Call, strike);
                const fwdOption = new ForwardVanillaOption(strike, resetDate, payoff, exercise);
                const implVol = ImpliedVolatilityHelper.calculate(fwdOption, fwdEngine, vol, npv, 1e-8, 200, 1e-4, 2.0);
                const idx = k + i * this._strikes.length;
                retVal[idx] = implVol - this._refVols[idx];
            }
        }
        return retVal;
    }
}

describe(`Square-root CLV Model tests ${version}`, () => {
    it('Testing vanilla option pricing with square root kernel process...', () => {
        const backup = new SavedSettings();
        const todaysDate = DateExt.UTC('5,Oct,2016');
        Settings.evaluationDate.set(todaysDate);
        const dc = new ActualActual();
        const maturityDate = DateExt.advance(todaysDate, 3, TimeUnit.Months);
        const maturity = dc.yearFraction(todaysDate, maturityDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.08;
        const q = 0.03;
        const vol = 0.3;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const volTS = new Handle(flatVol2(todaysDate, vol, dc));
        const fwd = s0 * qTS.currentLink().discount2(maturity) /
            rTS.currentLink().discount2(maturity);
        const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, volTS);
        const kappa = 1.0;
        const theta = 0.06;
        const sigma = 0.2;
        const x0 = 0.09;
        const sqrtProcess = new SquareRootProcess(theta, kappa, sigma, x0);
        const maturityDates = [maturityDate];
        const model = new SquareRootCLVModel(bsProcess, sqrtProcess, maturityDates, 14, 1 - 1e-14, 1e-14);
        const x = model.collocationPointsX(maturityDate);
        const y = model.collocationPointsY(maturityDate);
        const g = new LagrangeInterpolation(x, 0, x.length, y, 0);
        const df = 4 * theta * kappa / (sigma * sigma);
        const ncp = 4 * kappa * Math.exp(-kappa * maturity) /
            (sigma * sigma * (1 - Math.exp(-kappa * maturity))) *
            sqrtProcess.x0();
        const strikes = [50, 75, 100, 125, 150, 200];
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            const optionType = (strike > fwd) ? Option.Type.Call : Option.Type.Put;
            const expected = new BlackCalculator()
                .init2(optionType, strike, fwd, Math.sqrt(volTS.currentLink().blackVariance2(maturity, strike)), rTS.currentLink().discount2(maturity))
                .value();
            const clvModelPayoff = new CLVModelPayoff(optionType, strike, g);
            const f = {
                f: (_1) => clvModelPayoff.f(_1) *
                    new NonCentralChiSquareDistribution(df, ncp).f(_1)
            };
            const calculated = new GaussLobattoIntegral(1000, 1e-6).f(f, x[0], Array1D.back(x)) *
                rTS.currentLink().discount2(maturity);
            const tol = 5e-3;
            expect(Math.abs(expected - calculated)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing mapping function of the square root kernel process...', () => {
        const backup = new SavedSettings();
        const todaysDate = DateExt.UTC('16,Oct,2016');
        Settings.evaluationDate.set(todaysDate);
        const maturityDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        const dc = new Actual365Fixed();
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.05;
        const q = 0.02;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const beta = 0.95;
        const alpha = 0.2;
        const rho = -0.9;
        const gamma = 0.8;
        const sabrVol = new Handle(new SABRVolTermStructure(alpha, beta, gamma, rho, s0, r, todaysDate, dc));
        const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, sabrVol);
        const calibrationDates = [DateExt.advance(todaysDate, 1, TimeUnit.Weeks)];
        while (Array1D.back(calibrationDates).valueOf() < maturityDate.valueOf()) {
            calibrationDates.push(DateExt.advance(Array1D.back(calibrationDates), 1, TimeUnit.Weeks));
        }
        const kappa = 1.0;
        const theta = 0.09;
        const sigma = 0.2;
        const x0 = 0.09;
        const sqrtProcess = new SquareRootProcess(theta, kappa, sigma, x0);
        const model = new SquareRootCLVModel(bsProcess, sqrtProcess, calibrationDates, 18, 1 - 1e-14, 1e-14);
        const g = model.g();
        const strikes = [80, 100, 120];
        const offsets = [7, 14, 28, 91, 182, 183, 184, 185, 186, 365];
        for (let i = 0; i < offsets.length; ++i) {
            const m = DateExt.advance(todaysDate, offsets[i], TimeUnit.Days);
            const t = dc.yearFraction(todaysDate, m);
            const df = 4 * theta * kappa / (sigma * sigma);
            const ncp = 4 * kappa * Math.exp(-kappa * t) /
                (sigma * sigma * (1 - Math.exp(-kappa * t))) * sqrtProcess.x0();
            const fwd = s0 * qTS.currentLink().discount1(m) / rTS.currentLink().discount1(m);
            for (let j = 0; j < strikes.length; ++j) {
                const strike = strikes[j];
                const optionType = (strike > fwd) ? Option.Type.Call : Option.Type.Put;
                const expected = new BlackCalculator()
                    .init2(optionType, strike, fwd, Math.sqrt(sabrVol.currentLink().blackVariance1(m, strike)), rTS.currentLink().discount1(m))
                    .value();
                const clvModelPayoff = new CLVModelPayoff(optionType, strike, { f: (_1) => g.f(t, _1) });
                const f = {
                    f: (_1) => clvModelPayoff.f(_1) *
                        new NonCentralChiSquareDistribution(df, ncp).f(_1)
                };
                const x = model.collocationPointsX(m);
                const calculated = new GaussLobattoIntegral(1000, 1e-3).f(f, x[0], Array1D.back(x)) *
                    rTS.currentLink().discount1(m);
                const tol = 1.5e-2;
                expect(Math.abs(calculated - expected)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing forward skew dynamics with square root kernel process...', () => {
        const backup = new SavedSettings();
        const todaysDate = DateExt.UTC('16,Oct,2016');
        Settings.evaluationDate.set(todaysDate);
        const endDate = DateExt.advance(todaysDate, 4, TimeUnit.Years);
        const dc = new Actual365Fixed();
        const s0 = 100;
        const r = 0.1;
        const q = 0.05;
        const v0 = 0.09;
        const kappa = 1.0;
        const theta = 0.09;
        const sigma = 0.3;
        const rho = -0.75;
        const spot = new Handle(new SimpleQuote(s0));
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const hestonModel = new HestonModel(new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho));
        const blackVol = new Handle(new HestonBlackVolSurface(new Handle(hestonModel)));
        const localVol = new Handle(new NoExceptLocalVolSurface().nelvsInit1(blackVol, rTS, qTS, spot, Math.sqrt(theta)));
        const sTheta = 0.389302;
        const sKappa = 0.1101849;
        const sSigma = 0.275368;
        const sX0 = 0.466809;
        const sqrtProcess = new SquareRootProcess(sTheta, sKappa, sSigma, sX0);
        const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, blackVol);
        const calibrationDates = [DateExt.advance(todaysDate, 6, TimeUnit.Months)];
        while (Array1D.back(calibrationDates).valueOf() < endDate.valueOf()) {
            calibrationDates.push(DateExt.advance(Array1D.back(calibrationDates), 3, TimeUnit.Months));
        }
        const clvCalibrationDates = new Set(calibrationDates);
        let tmpDate = DateExt.advance(todaysDate, 1, TimeUnit.Days);
        while (tmpDate.valueOf() <
            DateExt.advance(todaysDate, 1, TimeUnit.Years).valueOf()) {
            clvCalibrationDates.add(tmpDate);
            tmpDate = DateExt.advance(tmpDate, 1, TimeUnit.Weeks);
        }
        const clvSqrtModel = new SquareRootCLVModel(bsProcess, sqrtProcess, Array.from(clvCalibrationDates), 14, 1 - 1e-14, 1e-14);
        const gSqrt = clvSqrtModel.g();
        const vol = new SimpleQuote(0.1);
        const fwdEngine = new ForwardVanillaEngine(new AnalyticEuropeanEngine())
            .init1(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol1(todaysDate, vol, dc))));
        const mandatoryTimes = [];
        for (let i = 0, n = calibrationDates.length; i < n; ++i) {
            mandatoryTimes.push(dc.yearFraction(todaysDate, calibrationDates[i]));
        }
        const tSteps = 200;
        const grid = new TimeGrid().init3(mandatoryTimes, 0, mandatoryTimes.length, tSteps);
        const resetDates = [], maturityDates = [];
        const resetIndices = [], maturityIndices = [];
        for (let i = 0, n = calibrationDates.length - 2; i < n; ++i) {
            resetDates.push(calibrationDates[i]);
            maturityDates.push(calibrationDates[i + 2]);
            const resetTime = mandatoryTimes[i];
            const maturityTime = mandatoryTimes[i + 2];
            resetIndices.push(grid.closestIndex(resetTime) - 1);
            maturityIndices.push(grid.closestIndex(maturityTime) - 1);
        }
        const strikes = [
            0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9,
            2.0
        ];
        const nScenarios = 20000;
        const refVols = new Array(resetIndices.length * strikes.length);
        const eta = 0.25;
        const corr = -0.0;
        const hestonProcess4slv = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, eta * sigma, corr);
        const hestonModel4slv = new Handle(new HestonModel(hestonProcess4slv));
        const logParams = new HestonSLVFokkerPlanckFdmParams(301, 601, 1000, 30, 2.0, 0, 2, 0.1, 1e-4, 10000, 1e-5, 1e-5, 0.0000025, 1.0, 0.1, 0.9, 1e-5, FdmHestonGreensFct.Algorithm.Gaussian, FdmSquareRootFwdOp.TransformationType.Log, FdmSchemeDesc.ModifiedCraigSneyd());
        const leverageFctFDM = new HestonSLVFDMModel(localVol, hestonModel4slv, endDate, logParams)
            .leverageFunction();
        const fdmSlvProcess = new HestonSLVProcess(hestonProcess4slv, leverageFctFDM);
        const slvStats = Array2D.newMatrix(calibrationDates.length - 2, strikes.length);
        const factors = fdmSlvProcess.factors();
        const pathGen = new MultiPathGenerator().init2(fdmSlvProcess, grid, new SobolBrownianBridgeRsg(factors, grid.size() - 1), false);
        for (let k = 0; k < nScenarios; ++k) {
            const path = pathGen.next();
            for (let i = 0, n = resetIndices.length; i < n; ++i) {
                const S_t1 = path.value.at(0).at(resetIndices[i]);
                const S_T1 = path.value.at(0).at(maturityIndices[i]);
                for (let j = 0; j < strikes.length; ++j) {
                    const strike = strikes[j];
                    slvStats[i][j].add((strike < 1.0) ? S_t1 * Math.max(0.0, strike - S_T1 / S_t1) :
                        S_t1 * Math.max(0.0, S_T1 / S_t1 - strike));
                }
            }
        }
        for (let i = 0, n = resetIndices.length; i < n; ++i) {
            const resetDate = calibrationDates[i];
            const maturityDate = calibrationDates[i + 2];
            const df = rTS.currentLink().discount1(maturityDate);
            const exercise = new EuropeanExercise(maturityDate);
            for (let j = 0; j < strikes.length; ++j) {
                const strike = strikes[j];
                const npv = slvStats[i][j].mean() * df;
                const payoff = new PlainVanillaPayoff((strike < 1.0) ? Option.Type.Put : Option.Type.Call, strike);
                const fwdOption = new ForwardVanillaOption(strike, resetDate, payoff, exercise);
                const implVol = ImpliedVolatilityHelper.calculate(fwdOption, fwdEngine, vol, npv, 1e-8, 200, 1e-4, 2.0);
                const idx = j + i * strikes.length;
                refVols[idx] = implVol;
            }
        }
        const costFunction = new SquareRootCLVCalibrationFunction(strikes, resetDates, maturityDates, bsProcess, refVols, nScenarios);
        const params = new Array(4);
        params[0] = sTheta;
        params[1] = sKappa;
        params[2] = sSigma;
        params[3] = sX0;
        const tol = 0.5;
        const costValue = costFunction.value(params);
        expect(costValue).toBeLessThan(tol);
        const maturityDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        const maturityTime = bsProcess.time(maturityDate);
        const europeanExercise = new EuropeanExercise(maturityDate);
        const vanillaATMOption = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0 * qTS.currentLink().discount1(maturityDate) /
            rTS.currentLink().discount1(maturityDate)), europeanExercise);
        vanillaATMOption.setPricingEngine(new AnalyticHestonEngine().aheInit2(hestonModel));
        const atmVol = vanillaATMOption.impliedVolatility(vanillaATMOption.NPV(), new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(Math.sqrt(theta), dc))));
        const analyticEngine = new AnalyticDoubleBarrierBinaryEngine().init1(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(atmVol, dc))));
        const fdSLVEngine = new FdHestonDoubleBarrierEngine(hestonModel4slv.currentLink(), 51, 201, 51, 1, FdmSchemeDesc.Hundsdorfer(), leverageFctFDM);
        const n = 16;
        const barrier_lo = new Array(n), barrier_hi = new Array(n), bsNPV = new Array(n), slvNPV = new Array(n);
        const payoff = new CashOrNothingPayoff(Option.Type.Call, 0.0, 1.0);
        for (let i = 0; i < n; ++i) {
            const dist = 20.0 + 5.0 * i;
            barrier_lo[i] = Math.max(s0 - dist, 1e-2);
            barrier_hi[i] = s0 + dist;
            const doubleBarrier = new DoubleBarrierOption(DoubleBarrier.Type.KnockOut, barrier_lo[i], barrier_hi[i], 0.0, payoff, europeanExercise);
            doubleBarrier.setPricingEngine(analyticEngine);
            bsNPV[i] = doubleBarrier.NPV();
            doubleBarrier.setPricingEngine(fdSLVEngine);
            slvNPV[i] = doubleBarrier.NPV();
        }
        const bGrid = new TimeGrid().init1(maturityTime, tSteps);
        const ursg = new RandomSequenceGenerator(new MersenneTwisterUniformRng())
            .init2(tSteps, 1235);
        const stats = new Array(n);
        const df = 4 * sTheta * sKappa / (sSigma * sSigma);
        for (let i = 0; i < nScenarios; ++i) {
            const touch = Array1D.fromSizeValue(n, false);
            const path = ursg.nextSequence().value;
            let x = sX0;
            for (let j = 0; j < tSteps; ++j) {
                const t0 = bGrid.at(j);
                const t1 = bGrid.at(j + 1);
                const ncp = 4 * sKappa * Math.exp(-sKappa * (t1 - t0)) /
                    (sSigma * sSigma * (1 - Math.exp(-sKappa * (t1 - t0)))) * x;
                const u = new InverseCumulativeNonCentralChiSquare(df, ncp).f(path[j]);
                x = sSigma * sSigma * (1 - Math.exp(-sKappa * (t1 - t0))) /
                    (4 * sKappa) * u;
                const X = x * 4 * sKappa / (sSigma * sSigma * (1 - Math.exp(-sKappa * t1)));
                const s = gSqrt.f(t1, X);
                if (t1 > 0.05) {
                    for (let u = 0; u < n; ++u) {
                        if (s <= barrier_lo[u] || s >= barrier_hi[u]) {
                            touch[u] = true;
                        }
                    }
                }
            }
            for (let u = 0; u < n; ++u) {
                if (touch[u]) {
                    stats[u].add(0.0);
                }
                else {
                    stats[u].add(rTS.currentLink().discount1(maturityDate));
                }
            }
        }
        for (let u = 0; u < n; ++u) {
            const calculated = stats[u].mean();
            const error = stats[u].errorEstimate();
            const expected = slvNPV[u];
            const tol = 2.35 * error;
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
        backup.dispose();
    });
});
