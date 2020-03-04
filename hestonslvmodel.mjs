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
import { ArrayExt, Actual365Fixed, ActualActual, AnalyticDoubleBarrierBinaryEngine, AnalyticEuropeanEngine, AnalyticHestonEngine, AnalyticPDFHestonEngine, Array1D, Array2D, Barrier, BarrierOption, Bicubic, BlackScholesMertonProcess, BlackVarianceSurface, Brent, CashOrNothingPayoff, Comparison, Concentrating1dMesher, CubicNaturalSpline, DateExt, DiscreteSimpsonIntegral, DoubleBarrier, DoubleBarrierOption, DouglasScheme, EuropeanExercise, FdBlackScholesBarrierEngine, FdBlackScholesVanillaEngine, FdHestonBarrierEngine, FdHestonDoubleBarrierEngine, FdHestonVanillaEngine, FdmBlackScholesFwdOp, FdmBlackScholesMesher, FdmHestonFwdOp, FdmHestonGreensFct, FdmLocalVolFwdOp, FdmMesherComposite, FdmMesherIntegral, FdmSchemeDesc, FdmSquareRootFwdOp, FixedLocalVolSurface, ForwardVanillaEngine, ForwardVanillaOption, GammaFunction, GaussLobattoIntegral, GeneralizedBlackScholesProcess, GeneralStatistics, Handle, HestonBlackVolSurface, HestonModel, HestonProcess, HestonSLVFDMModel, HestonSLVFokkerPlanckFdmParams, HestonSLVMCModel, HestonSLVProcess, HundsdorferScheme, ImpliedVolatilityHelper, LocalConstantVol, LocalVolRNDCalculator, M_TWOPI, MakeMCEuropeanHestonEngine, ModifiedCraigSneydScheme, MTBrownianGeneratorFactory, MultiPathGenerator, NoExceptLocalVolSurface, Option, Period, PlainVanillaPayoff, Predefined1dMesher, PseudoRandom, QL_EPSILON, QL_MAX_REAL, QL_NULL_REAL, SavedSettings, Settings, SimpleQuote, SobolBrownianBridgeRsg, SobolBrownianGenerator, SobolBrownianGeneratorFactory, SobolRsg, square, SquareRootProcessRNDCalculator, TARGET, TimeGrid, TimeUnit, Uniform1dMesher, VanillaOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4, flatVol1, flatVol4 } from '/test-suite/utilities.mjs';

function fokkerPlanckPrice1D(mesher, op, payoff, x0, maturity, tGrid) {
    const x = mesher.locations(0);
    const p = Array1D.fromSizeValue(x.length, 0.0);
    if (x.length <= 3 || x[1] > x0 || x[x.length - 2] < x0) {
        throw new Error('insufficient mesher');
    }
    const upperb = ArrayExt.upperBound(x, x0, (x1, x2) => x1 - x2);
    const lowerb = upperb - 1;
    if (Comparison.close_enough(x[upperb], x0)) {
        const idx = upperb;
        const dx = (x[idx + 1] - x[idx - 1]) / 2.0;
        p[idx] = 1.0 / dx;
    }
    else if (Comparison.close_enough(x[lowerb], x0)) {
        const idx = lowerb;
        const dx = (x[idx + 1] - x[idx - 1]) / 2.0;
        p[idx] = 1.0 / dx;
    }
    else {
        const dx = x[upperb] - x[lowerb];
        const lowerP = (x[upperb] - x0) / dx;
        const upperP = (x0 - x[lowerb]) / dx;
        const lowerIdx = lowerb;
        const upperIdx = upperb;
        const lowerDx = (x[lowerIdx + 1] - x[lowerIdx - 1]) / 2.0;
        const upperDx = (x[upperIdx + 1] - x[upperIdx - 1]) / 2.0;
        p[lowerIdx] = lowerP / lowerDx;
        p[upperIdx] = upperP / upperDx;
    }
    const evolver = new DouglasScheme(FdmSchemeDesc.Douglas().theta, op);
    const dt = maturity / tGrid;
    evolver.setStep(dt);
    for (let t = dt; t <= maturity + 20 * QL_EPSILON; t += dt) {
        evolver.step(p, t);
    }
    const payoffTimesDensity = new Array(x.length);
    for (let i = 0; i < x.length; ++i) {
        payoffTimesDensity[i] = payoff.f(Math.exp(x[i])) * p[i];
    }
    const f = new CubicNaturalSpline(x, 0, x.length, payoffTimesDensity, 0);
    f.enableExtrapolation();
    return new GaussLobattoIntegral(1000, 1e-6).f(f, x[0], x[x.length - 1]);
}

function stationaryLogProbabilityFct(kappa, theta, sigma, z) {
    const alpha = 2 * kappa * theta / (sigma * sigma);
    const beta = alpha / theta;
    return Math.pow(beta, alpha) * Math.exp(z * alpha) *
        Math.exp(-beta * Math.exp(z) - new GammaFunction().logValue(alpha));
}

function createStationaryDistributionMesher(kappa, theta, sigma, vGrid) {
    const qMin = 0.01;
    const qMax = 0.99;
    const dq = (qMax - qMin) / (vGrid - 1);
    const rnd = new SquareRootProcessRNDCalculator(theta, kappa, theta, sigma);
    const v = new Array(vGrid);
    for (let i = 0; i < vGrid; ++i) {
        v[i] = rnd.stationary_invcdf(qMin + i * dq);
    }
    return new FdmMesherComposite().cInit3(new Predefined1dMesher(v));
}

class q_fct {
    constructor(v, p, alpha) {
        this._v = Array.from(v);
        this._q = Array1D.mul(Array1D.Pow(v, alpha), p);
        this._alpha = alpha;
        this._spline =
            new CubicNaturalSpline(this._v, 0, this._v.length, this._q, 0);
    }
    f(v) {
        return this._spline.f(v, true) * Math.pow(v, -this._alpha);
    }
}

function fokkerPlanckPrice2D(p, mesher) {
    const x = [], y = [];
    const layout = mesher.layout();
    const endIter = layout.end();
    for (const iter = layout.begin(); iter.notEqual(endIter); iter.plusplus()) {
        if (!iter.coordinates()[1]) {
            x.push(mesher.location(iter, 0));
        }
        if (!iter.coordinates()[0]) {
            y.push(mesher.location(iter, 1));
        }
    }
    return new FdmMesherIntegral(mesher, new DiscreteSimpsonIntegral())
        .integrate(p);
}

function hestonPxBoundary(maturity, eps, model) {
    const pdfEngine = new AnalyticPDFHestonEngine(model);
    const sInit = model.process().s0().currentLink().value();
    const xMin = new Brent().solve2({ f: (_1) => pdfEngine.cdf(_1, maturity) - eps }, sInit * 1e-3, sInit, sInit * 0.001, 1000 * sInit);
    return xMin;
}

class FokkerPlanckFwdTestCase {
    constructor(s0, r, q, v0, kappa, theta, rho, sigma, xGrid, vGrid, tGridPerYear, tMinGridPerYear, avgEps, eps, trafoType, greensAlgorithm, schemeType) {
        this.s0 = s0;
        this.r = r;
        this.q = q;
        this.v0 = v0;
        this.kappa = kappa;
        this.theta = theta;
        this.rho = rho;
        this.sigma = sigma;
        this.xGrid = xGrid;
        this.vGrid = vGrid;
        this.tGridPerYear = tGridPerYear;
        this.tMinGridPerYear = tMinGridPerYear;
        this.avgEps = avgEps;
        this.eps = eps;
        this.trafoType = trafoType;
        this.greensAlgorithm = greensAlgorithm;
        this.schemeType = schemeType;
    }
}

function hestonFokkerPlanckFwdEquationTest(testCase) {
    const backup = new SavedSettings();
    const dc = new ActualActual();
    const todaysDate = DateExt.UTC('28,Dec,2014');
    Settings.evaluationDate.set(todaysDate);
    const maturities = [
        new Period().init1(1, TimeUnit.Months),
        new Period().init1(3, TimeUnit.Months),
        new Period().init1(6, TimeUnit.Months),
        new Period().init1(9, TimeUnit.Months),
        new Period().init1(1, TimeUnit.Years),
        new Period().init1(2, TimeUnit.Years), new Period().init1(3, TimeUnit.Years)
    ];
    const maturityDate = DateExt.addPeriod(todaysDate, Array1D.back(maturities));
    const maturity = dc.yearFraction(todaysDate, maturityDate);
    const s0 = testCase.s0;
    const x0 = Math.log(s0);
    const r = testCase.r;
    const q = testCase.q;
    const kappa = testCase.kappa;
    const theta = testCase.theta;
    const rho = testCase.rho;
    const sigma = testCase.sigma;
    const v0 = testCase.v0;
    const alpha = 1.0 - 2 * kappa * theta / (sigma * sigma);
    const spot = new Handle(new SimpleQuote(s0));
    const rTS = new Handle(flatRate4(r, dc));
    const qTS = new Handle(flatRate4(q, dc));
    const process = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
    const model = new HestonModel(process);
    const engine = new AnalyticHestonEngine().aheInit2(model);
    const xGrid = testCase.xGrid;
    const vGrid = testCase.vGrid;
    const tGridPerYear = testCase.tGridPerYear;
    const transformationType = testCase.trafoType;
    let lowerBound, upperBound;
    let cPoints;
    const rnd = new SquareRootProcessRNDCalculator(v0, kappa, theta, sigma);
    switch (transformationType) {
        case FdmSquareRootFwdOp.TransformationType.Log:
            {
                upperBound = Math.log(rnd.stationary_invcdf(0.9995));
                lowerBound = Math.log(0.00001);
                const v0Center = Math.log(v0);
                const v0Density = 10.0;
                const upperBoundDensity = 100;
                const lowerBoundDensity = 1.0;
                cPoints = [
                    [lowerBound, lowerBoundDensity, false], [v0Center, v0Density, true],
                    [upperBound, upperBoundDensity, false]
                ];
            }
            break;
        case FdmSquareRootFwdOp.TransformationType.Plain:
            {
                upperBound = rnd.stationary_invcdf(0.9995);
                lowerBound = rnd.stationary_invcdf(1e-5);
                const v0Center = v0;
                const v0Density = 0.1;
                const lowerBoundDensity = 0.0001;
                cPoints =
                    [[lowerBound, lowerBoundDensity, false], [v0Center, v0Density, true]];
            }
            break;
        case FdmSquareRootFwdOp.TransformationType.Power:
            {
                upperBound = rnd.stationary_invcdf(0.9995);
                lowerBound = 0.000075;
                const v0Center = v0;
                const v0Density = 1.0;
                const lowerBoundDensity = 0.005;
                cPoints =
                    [[lowerBound, lowerBoundDensity, false], [v0Center, v0Density, true]];
            }
            break;
        default:
            throw new Error('unknown transformation type');
    }
    const varianceMesher = new Concentrating1dMesher().init2(lowerBound, upperBound, vGrid, cPoints, 1e-12);
    const sEps = 1e-4;
    const sLowerBound = Math.log(hestonPxBoundary(maturity, sEps, model));
    const sUpperBound = Math.log(hestonPxBoundary(maturity, 1 - sEps, model));
    const spotMesher = new Concentrating1dMesher().init1(sLowerBound, sUpperBound, xGrid, [x0, 0.1], true);
    const mesher = new FdmMesherComposite().cInit4(spotMesher, varianceMesher);
    const hestonFwdOp = new FdmHestonFwdOp(mesher, process, transformationType);
    const evolver = new ModifiedCraigSneydScheme(FdmSchemeDesc.ModifiedCraigSneyd().theta, FdmSchemeDesc.ModifiedCraigSneyd().mu, hestonFwdOp);
    const eT = 1.0 / 365;
    const p = new FdmHestonGreensFct(mesher, process, testCase.trafoType)
        .get(eT, testCase.greensAlgorithm);
    const layout = mesher.layout();
    const strikes = [50, 80, 90, 100, 110, 120, 150, 200];
    let t = eT;
    for (let iter = 0; iter !== maturities.length; ++iter) {
        const nextMaturityDate = DateExt.addPeriod(todaysDate, maturities[iter]);
        const nextMaturityTime = dc.yearFraction(todaysDate, nextMaturityDate);
        const dt = (nextMaturityTime - t) / tGridPerYear;
        evolver.setStep(dt);
        for (let i = 0; i < tGridPerYear; ++i, t += dt) {
            evolver.step(p, t + dt);
        }
        let avg = 0, min = QL_MAX_REAL, max = 0;
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            const payoff = new PlainVanillaPayoff((strike > s0) ? Option.Type.Call : Option.Type.Put, strike);
            const pd = new Array(p.length);
            for (const iter = layout.begin(); iter.notEqual(layout.end()); iter.plusplus()) {
                const idx = iter.index();
                const s = Math.exp(mesher.location(iter, 0));
                pd[idx] = payoff.f(s) * p[idx];
                if (transformationType ===
                    FdmSquareRootFwdOp.TransformationType.Power) {
                    const v = mesher.location(iter, 1);
                    pd[idx] *= Math.pow(v, -alpha);
                }
            }
            const calculated = fokkerPlanckPrice2D(pd, mesher) *
                rTS.currentLink().discount1(nextMaturityDate);
            const exercise = new EuropeanExercise(nextMaturityDate);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const expected = option.NPV();
            const absDiff = Math.abs(expected - calculated);
            const relDiff = absDiff / Math.max(QL_EPSILON, expected);
            const diff = Math.min(absDiff, relDiff);
            avg += diff;
            min = Math.min(diff, min);
            max = Math.max(diff, max);
            expect(diff).toBeLessThan(testCase.eps);
        }
        avg /= strikes.length;
        expect(avg).toBeLessThan(testCase.avgEps);
    }
    backup.dispose();
}

function createLocalVolMatrixFromProcess(lvProcess, strikes, dates, times) {
    const localVol = lvProcess.localVolatility().currentLink();
    const dc = localVol.dayCounter();
    const todaysDate = Settings.evaluationDate.f();
    if (times.length !== dates.length) {
        throw new Error('mismatch');
    }
    for (let i = 0; i < times.length; ++i) {
        times[i] = dc.yearFraction(todaysDate, dates[i]);
    }
    const surface = Array2D.newMatrix(strikes.length, dates.length);
    for (let i = 0; i < strikes.length; ++i) {
        for (let j = 0; j < dates.length; ++j) {
            try {
                surface[i][j] = localVol.localVol1(dates[j], strikes[i], true);
            }
            catch (e) {
                surface[i][j] = 0.2;
            }
        }
    }
    return surface;
}

function createSmoothImpliedVol(dc, cal) {
    const todaysDate = Settings.evaluationDate.f();
    const times = [13, 41, 75, 165, 256, 345, 524, 703];
    const dates = [];
    for (let i = 0; i < 8; ++i) {
        const date = DateExt.add(todaysDate, times[i]);
        dates.push(date);
    }
    const tmp = [
        2.222222222, 11.11111111, 44.44444444, 75.55555556, 80,
        84.44444444, 88.88888889, 93.33333333, 97.77777778, 100,
        102.2222222, 106.6666667, 111.1111111, 115.5555556, 120,
        124.4444444, 166.6666667, 222.2222222, 444.4444444, 666.6666667
    ];
    const surfaceStrikes = Array.from(tmp);
    const v = [
        1.015873, 1.015873, 0.915873, 0.89729, 0.796493, 0.730914, 0.631335,
        0.568895, 0.851309, 0.821309, 0.781309, 0.641309, 0.635593, 0.583653,
        0.508045, 0.463182, 0.686034, 0.630534, 0.590534, 0.500534, 0.448706,
        0.416661, 0.375470, 0.353442, 0.526034, 0.482263, 0.447713, 0.387703,
        0.355064, 0.337438, 0.316966, 0.306859, 0.497587, 0.464373, 0.430764,
        0.374052, 0.344336, 0.328607, 0.310619, 0.301865, 0.479511, 0.446815,
        0.414194, 0.361010, 0.334204, 0.320301, 0.304664, 0.297180, 0.461866,
        0.429645, 0.398092, 0.348638, 0.324680, 0.312512, 0.299082, 0.292785,
        0.444801, 0.413014, 0.382634, 0.337026, 0.315788, 0.305239, 0.293855,
        0.288660, 0.428604, 0.397219, 0.368109, 0.326282, 0.307555, 0.298483,
        0.288972, 0.284791, 0.420971, 0.389782, 0.361317, 0.321274, 0.303697,
        0.295302, 0.286655, 0.282948, 0.413749, 0.382754, 0.354917, 0.316532,
        0.300016, 0.292251, 0.284420, 0.281164, 0.400889, 0.370272, 0.343525,
        0.307904, 0.293204, 0.286549, 0.280189, 0.277767, 0.390685, 0.360399,
        0.334344, 0.300507, 0.287149, 0.281380, 0.276271, 0.274588, 0.383477,
        0.353434, 0.327580, 0.294408, 0.281867, 0.276746, 0.272655, 0.271617,
        0.379106, 0.349214, 0.323160, 0.289618, 0.277362, 0.272641, 0.269332,
        0.268846, 0.377073, 0.347258, 0.320776, 0.286077, 0.273617, 0.269057,
        0.266293, 0.266265, 0.399925, 0.369232, 0.338895, 0.289042, 0.265509,
        0.255589, 0.249308, 0.249665, 0.423432, 0.406891, 0.373720, 0.314667,
        0.281009, 0.263281, 0.246451, 0.242166, 0.453704, 0.453704, 0.453704,
        0.381255, 0.334578, 0.305527, 0.268909, 0.251367, 0.517748, 0.517748,
        0.517748, 0.416577, 0.364770, 0.331595, 0.287423, 0.264285
    ];
    const blackVolMatrix = Array2D.newMatrix(surfaceStrikes.length, dates.length);
    for (let i = 0; i < surfaceStrikes.length; ++i) {
        for (let j = 0; j < dates.length; ++j) {
            blackVolMatrix[i][j] = v[i * (dates.length) + j];
        }
    }
    const volTS = new BlackVarianceSurface(todaysDate, cal, dates, surfaceStrikes, blackVolMatrix, dc, BlackVarianceSurface.Extrapolation.ConstantExtrapolation, BlackVarianceSurface.Extrapolation.ConstantExtrapolation);
    volTS.setInterpolation(new Bicubic());
    return [surfaceStrikes, dates, volTS];
}

class HestonModelParams {
    constructor(r, q, kappa, theta, rho, sigma, v0) {
        this.r = r;
        this.q = q;
        this.kappa = kappa;
        this.theta = theta;
        this.rho = rho;
        this.sigma = sigma;
        this.v0 = v0;
    }
}

class HestonSLVTestCase {
    constructor(hestonParams, fdmParams) {
        this.hestonParams = hestonParams;
        this.fdmParams = fdmParams;
    }
}

function lsvCalibrationTest(testCase) {
    const todaysDate = DateExt.UTC('2,June,2015');
    Settings.evaluationDate.set(todaysDate);
    const finalDate = DateExt.UTC('2,June,2020');
    const dc = new Actual365Fixed();
    const s0 = 100;
    const spot = new Handle(new SimpleQuote(s0));
    const r = testCase.hestonParams.r;
    const q = testCase.hestonParams.q;
    const kappa = testCase.hestonParams.kappa;
    const theta = testCase.hestonParams.theta;
    const rho = testCase.hestonParams.rho;
    const sigma = testCase.hestonParams.sigma;
    const v0 = testCase.hestonParams.v0;
    const lv = 0.3;
    const rTS = new Handle(flatRate4(r, dc));
    const qTS = new Handle(flatRate4(q, dc));
    const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
    const hestonModel = new Handle(new HestonModel(hestonProcess));
    const localVol = new Handle(new LocalConstantVol().lcvInit1(todaysDate, lv, dc));
    const slvModel = new HestonSLVFDMModel(localVol, hestonModel, finalDate, testCase.fdmParams);
    const l = slvModel.leverageFunction();
    const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(lv, dc)));
    const analyticEngine = new AnalyticEuropeanEngine().init1(bsProcess);
    const strikes = [50, 75, 80, 90, 100, 110, 125, 150];
    const times = [3, 6, 9, 12, 24, 36, 60];
    for (let t = 0; t < times.length; ++t) {
        const expiry = DateExt.advance(todaysDate, times[t], TimeUnit.Months);
        const exercise = new EuropeanExercise(expiry);
        const slvEngine = (times[t] <= 3) ?
            new FdHestonVanillaEngine(hestonModel.currentLink(), Math.floor(Math.max(101.0, 51 * times[t] / 12.0)), 401, 101, 0, FdmSchemeDesc.ModifiedCraigSneyd(), l) :
            new FdHestonVanillaEngine(hestonModel.currentLink(), Math.floor(Math.max(51.0, 51 * times[t] / 12.0)), 201, 101, 0, FdmSchemeDesc.ModifiedCraigSneyd(), l);
        for (let s = 0; s < strikes.length; ++s) {
            const strike = strikes[s];
            const payoff = new PlainVanillaPayoff((strike > s0) ? Option.Type.Call : Option.Type.Put, strike);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(slvEngine);
            const calculated = option.NPV();
            option.setPricingEngine(analyticEngine);
            const expected = option.NPV();
            const vega = option.vega();
            const tol = 0.0005;
            expect(Math.abs((calculated - expected) / vega)).toBeLessThan(tol);
        }
    }
}

function getFixedLocalVolFromHeston(hestonModel, timeGrid) {
    const trueImpliedVolSurf = new Handle(new HestonBlackVolSurface(new Handle(hestonModel), AnalyticHestonEngine.ComplexLogFormula.AndersenPiterbarg, AnalyticHestonEngine.Integration.gaussLaguerre(32)));
    const hestonProcess = hestonModel.process();
    const localVol = new NoExceptLocalVolSurface().nelvsInit1(trueImpliedVolSurf, hestonProcess.riskFreeRate(), hestonProcess.dividendYield(), hestonProcess.s0(), Math.sqrt(hestonProcess.theta()));
    const localVolRND = new LocalVolRNDCalculator().lvrndcInit2(hestonProcess.s0().currentLink(), hestonProcess.riskFreeRate().currentLink(), hestonProcess.dividendYield().currentLink(), localVol, timeGrid);
    const strikes = [];
    for (let i = 1; i < timeGrid.size(); ++i) {
        const t = timeGrid.at(i);
        const fdm1dMesher = localVolRND.mesher(t);
        const logStrikes = fdm1dMesher.locations();
        const strikeSlice = new Array(logStrikes.length);
        for (let j = 0; j < logStrikes.length; ++j) {
            strikeSlice[j] = Math.exp(logStrikes[j]);
        }
        strikes.push(strikeSlice);
    }
    const nStrikes = strikes[0].length;
    const localVolMatrix = Array2D.newMatrix(nStrikes, timeGrid.size() - 1);
    for (let i = 1; i < timeGrid.size(); ++i) {
        const t = timeGrid.at(i);
        const strikeSlice = strikes[i - 1];
        for (let j = 0; j < nStrikes; ++j) {
            const s = strikeSlice[j];
            localVolMatrix[j][i - 1] = localVol.localVol2(t, s, true);
        }
    }
    const todaysDate = hestonProcess.riskFreeRate().currentLink().referenceDate();
    const dc = hestonProcess.riskFreeRate().currentLink().dayCounter();
    const times = timeGrid.times();
    const expiries = times.slice(1, times.length);
    return new FixedLocalVolSurface().flvsInit3(todaysDate, expiries, strikes, localVolMatrix, dc);
}

describe(`Heston Stochastic Local Volatility tests ${version}`, () => {
    it('Testing Fokker-Planck forward equation for BS process...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('28,Dec,2012');
        Settings.evaluationDate.set(todaysDate);
        const maturityDate = DateExt.advance(todaysDate, 2, TimeUnit.Years);
        const maturity = dc.yearFraction(todaysDate, maturityDate);
        const s0 = 100;
        const x0 = Math.log(s0);
        const r = 0.035;
        const q = 0.01;
        const v = 0.35;
        const xGrid = 2 * 100 + 1;
        const tGrid = 400;
        const spot = new Handle(new SimpleQuote(s0));
        const qTS = new Handle(flatRate4(q, dc));
        const rTS = new Handle(flatRate4(r, dc));
        const vTS = new Handle(flatVol4(v, dc));
        const process = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, vTS);
        const engine = new AnalyticEuropeanEngine().init1(process);
        const uniformMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0));
        const uniformBSFwdOp = new FdmBlackScholesFwdOp(uniformMesher, process, s0, false);
        const concentratedMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0, QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [s0, 0.1]));
        const concentratedBSFwdOp = new FdmBlackScholesFwdOp(concentratedMesher, process, s0, false);
        const shiftedMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0, QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [s0 * 1.1, 0.2]));
        const shiftedBSFwdOp = new FdmBlackScholesFwdOp(shiftedMesher, process, s0, false);
        const exercise = new EuropeanExercise(maturityDate);
        const strikes = [50, 80, 100, 130, 150];
        for (let i = 0; i < strikes.length; ++i) {
            const payoff = new PlainVanillaPayoff(Option.Type.Call, strikes[i]);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(engine);
            const expected = option.NPV() / rTS.currentLink().discount1(maturityDate);
            const calcUniform = fokkerPlanckPrice1D(uniformMesher, uniformBSFwdOp, payoff, x0, maturity, tGrid);
            const calcConcentrated = fokkerPlanckPrice1D(concentratedMesher, concentratedBSFwdOp, payoff, x0, maturity, tGrid);
            const calcShifted = fokkerPlanckPrice1D(shiftedMesher, shiftedBSFwdOp, payoff, x0, maturity, tGrid);
            const tol = 0.02;
            expect(Math.abs(expected - calcUniform)).toBeLessThan(tol);
            expect(Math.abs(expected - calcConcentrated)).toBeLessThan(tol);
            expect(Math.abs(expected - calcShifted)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing zero-flow BC for the square root process...', () => {
        const backup = new SavedSettings();
        const kappa = 1.0;
        const theta = 0.4;
        const sigma = 0.8;
        const v_0 = 0.1;
        const t = 1.0;
        const vmin = 0.0005;
        const h = 0.0001;
        const expected = [
            [0.000548, -0.000245, -0.005657, -0.001167, -0.000024],
            [-0.000595, -0.000701, -0.003296, -0.000883, -0.000691],
            [-0.001277, -0.001320, -0.003128, -0.001399, -0.001318],
            [-0.001979, -0.002002, -0.003425, -0.002047, -0.002001],
            [-0.002715, -0.002730, -0.003920, -0.002760, -0.002730]
        ];
        for (let i = 0; i < 5; ++i) {
            const v = vmin + i * 0.001;
            const vm2 = v - 2 * h;
            const vm1 = v - h;
            const v0 = v;
            const v1 = v + h;
            const v2 = v + 2 * h;
            const rndCalculator = new SquareRootProcessRNDCalculator(v_0, kappa, theta, sigma);
            const pm2 = rndCalculator.pdf(vm2, t);
            const pm1 = rndCalculator.pdf(vm1, t);
            const p0 = rndCalculator.pdf(v0, t);
            const p1 = rndCalculator.pdf(v1, t);
            const p2 = rndCalculator.pdf(v2, t);
            const flowSym2Order = sigma * sigma * v0 / (4 * h) * (p1 - pm1) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const flowSym4Order = sigma * sigma * v0 / (24 * h) * (-p2 + 8 * p1 - 8 * pm1 + pm2) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const fwd1Order = sigma * sigma * v0 / (2 * h) * (p1 - p0) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const fwd2Order = sigma * sigma * v0 / (4 * h) * (4 * p1 - 3 * p0 - p2) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const fwd3Order = sigma * sigma * v0 / (12 * h) * (-p2 + 6 * p1 - 3 * p0 - 2 * pm1) +
                (kappa * (v0 - theta) + sigma * sigma / 2) * p0;
            const tol = 0.000002;
            expect(Math.abs(expected[i][0] - flowSym2Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][1] - flowSym4Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][2] - fwd1Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][3] - fwd2Order)).toBeLessThan(tol);
            expect(Math.abs(expected[i][4] - fwd3Order)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing zero-flow BC for transformed Fokker-Planck forward equation...', () => {
        const backup = new SavedSettings();
        const kappa = 1.0;
        const theta = 0.4;
        const sigma = 2.0;
        const vGrid = 100;
        const mesher = createStationaryDistributionMesher(kappa, theta, sigma, vGrid);
        const v = mesher.locations(0);
        const p = new Array(vGrid);
        const rnd = new SquareRootProcessRNDCalculator(theta, kappa, theta, sigma);
        for (let i = 0; i < v.length; ++i) {
            p[i] = rnd.stationary_pdf(v[i]);
        }
        const alpha = 1.0 - 2 * kappa * theta / (sigma * sigma);
        const q = Array1D.mul(Array1D.Pow(v, alpha), p);
        for (let i = 0; i < vGrid / 2; ++i) {
            const hm = v[i + 1] - v[i];
            const hp = v[i + 2] - v[i + 1];
            const eta = 1.0 / (hm * (hm + hp) * hp);
            const a = -eta * ((hm + hp) * (hm + hp) - hm * hm);
            const b = eta * (hm + hp) * (hm + hp);
            const c = -eta * hm * hm;
            const df = a * q[i] + b * q[i + 1] + c * q[i + 2];
            const flow = 0.5 * sigma * sigma * v[i] * df + kappa * v[i] * q[i];
            const tol = 1e-6;
            expect(Math.abs(flow)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Fokker-Planck forward equation for ' +
        'the square root process with stationary density...', () => {
        const backup = new SavedSettings();
        const kappa = 2.5;
        const theta = 0.2;
        const vGrid = 100;
        const eps = 1e-2;
        for (let sigma = 0.2; sigma < 2.01; sigma += 0.1) {
            const alpha = (1.0 - 2 * kappa * theta / (sigma * sigma));
            const rnd = new SquareRootProcessRNDCalculator(theta, kappa, theta, sigma);
            const vMin = rnd.stationary_invcdf(eps);
            const vMax = rnd.stationary_invcdf(1 - eps);
            const mesher = new FdmMesherComposite().cInit3(new Uniform1dMesher(vMin, vMax, vGrid));
            const v = mesher.locations(0);
            const transform = (sigma < 0.75) ? FdmSquareRootFwdOp.TransformationType.Plain :
                FdmSquareRootFwdOp.TransformationType.Power;
            const vq = new Array(v.length);
            const vmq = new Array(v.length);
            for (let i = 0; i < v.length; ++i) {
                vmq[i] = 1.0 / (vq[i] = Math.pow(v[i], alpha));
            }
            const p = new Array(vGrid);
            for (let i = 0; i < v.length; ++i) {
                p[i] = rnd.stationary_pdf(v[i]);
                if (transform === FdmSquareRootFwdOp.TransformationType.Power) {
                    p[i] *= vq[i];
                }
            }
            const op = new FdmSquareRootFwdOp(mesher, kappa, theta, sigma, 0, transform);
            const n = 100;
            const dt = 0.01;
            const evolver = new DouglasScheme(0.5, op);
            evolver.setStep(dt);
            for (let i = 1; i <= n; ++i) {
                evolver.step(p, i * dt);
            }
            const expected = 1 - 2 * eps;
            if (transform === FdmSquareRootFwdOp.TransformationType.Power) {
                for (let i = 0; i < v.length; ++i) {
                    p[i] *= vmq[i];
                }
            }
            const f = new q_fct(v, p, alpha);
            const calculated = new GaussLobattoIntegral(1000000, 1e-6)
                .f(f, v[0], Array1D.back(v));
            const tol = 0.005;
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Fokker-Planck forward equation for ' +
        'the square root log process with stationary density...', () => {
        const backup = new SavedSettings();
        const kappa = 2.5;
        const theta = 0.2;
        const vGrid = 1000;
        const eps = 1e-2;
        for (let sigma = 0.2; sigma < 2.01; sigma += 0.1) {
            const lowerLimit = 0.001;
            const rnd = new SquareRootProcessRNDCalculator(theta, kappa, theta, sigma);
            const vMin = Math.max(lowerLimit, rnd.stationary_invcdf(eps));
            const lowEps = Math.max(eps, rnd.stationary_cdf(lowerLimit));
            const expected = 1 - eps - lowEps;
            const vMax = rnd.stationary_invcdf(1 - eps);
            const mesher = new FdmMesherComposite().cInit3(new Uniform1dMesher(Math.log(vMin), Math.log(vMax), vGrid));
            const v = mesher.locations(0);
            const p = new Array(vGrid);
            for (let i = 0; i < v.length; ++i) {
                p[i] = stationaryLogProbabilityFct(kappa, theta, sigma, v[i]);
            }
            const op = new FdmSquareRootFwdOp(mesher, kappa, theta, sigma, 0, FdmSquareRootFwdOp.TransformationType.Log);
            const n = 100;
            const dt = 0.01;
            const evolver = new DouglasScheme(0.5, op);
            evolver.setStep(dt);
            for (let i = 1; i <= n; ++i) {
                evolver.step(p, i * dt);
            }
            const calculated = new FdmMesherIntegral(mesher, new DiscreteSimpsonIntegral())
                .integrate(p);
            const tol = 0.005;
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Fokker-Planck forward equation for ' +
        'the square root process with Dirac start...', () => {
        const backup = new SavedSettings();
        const kappa = 1.2;
        const theta = 0.4;
        const sigma = 0.7;
        const v0 = theta;
        const alpha = 1.0 - 2 * kappa * theta / (sigma * sigma);
        const maturity = 1.0;
        const xGrid = 1001;
        const tGrid = 500;
        const vol = sigma * Math.sqrt(theta / (2 * kappa));
        const upperBound = theta + 6 * vol;
        const lowerBound = Math.max(0.0002, theta - 6 * vol);
        const mesher = new FdmMesherComposite().cInit3(new Uniform1dMesher(lowerBound, upperBound, xGrid));
        const x = Array.from(mesher.locations(0));
        const op = new FdmSquareRootFwdOp(mesher, kappa, theta, sigma, 0);
        const dt = maturity / tGrid;
        const n = 5;
        const p = new Array(xGrid);
        const rndCalculator = new SquareRootProcessRNDCalculator(v0, kappa, theta, sigma);
        for (let i = 0; i < p.length; ++i) {
            p[i] = rndCalculator.pdf(x[i], n * dt);
        }
        const q = Array1D.mul(Array1D.Pow(x, alpha), p);
        const evolver = new DouglasScheme(0.5, op);
        evolver.setStep(dt);
        for (let t = (n + 1) * dt; t <= maturity + 20 * QL_EPSILON; t += dt) {
            evolver.step(p, t);
            evolver.step(q, t);
        }
        const tol = 0.002;
        for (let i = 0; i < x.length; ++i) {
            const expected = rndCalculator.pdf(x[i], maturity);
            const calculated = p[i];
            expect(Math.abs(expected - calculated)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Fokker-Planck forward equation for the Heston process...', () => {
        const testCases = [
            new FokkerPlanckFwdTestCase(100.0, 0.01, 0.02, 0.05, 1.0, 0.05, -0.75, Math.sqrt(0.2), 101, 401, 25, 25, 0.02, 0.05, FdmSquareRootFwdOp.TransformationType.Power, FdmHestonGreensFct.Algorithm.Gaussian, FdmSchemeDesc.FdmSchemeType.DouglasType),
            new FokkerPlanckFwdTestCase(100.0, 0.01, 0.02, 0.05, 1.0, 0.05, -0.75, Math.sqrt(0.2), 201, 501, 10, 10, 0.005, 0.02, FdmSquareRootFwdOp.TransformationType.Log, FdmHestonGreensFct.Algorithm.Gaussian, FdmSchemeDesc.FdmSchemeType.HundsdorferType),
            new FokkerPlanckFwdTestCase(100.0, 0.01, 0.02, 0.05, 1.0, 0.05, -0.75, Math.sqrt(0.2), 201, 501, 25, 25, 0.01, 0.03, FdmSquareRootFwdOp.TransformationType.Log, FdmHestonGreensFct.Algorithm.ZeroCorrelation, FdmSchemeDesc.FdmSchemeType.HundsdorferType),
            new FokkerPlanckFwdTestCase(100.0, 0.01, 0.02, 0.05, 1.0, 0.05, -0.75, Math.sqrt(0.05), 201, 401, 5, 5, 0.01, 0.02, FdmSquareRootFwdOp.TransformationType.Plain, FdmHestonGreensFct.Algorithm.Gaussian, FdmSchemeDesc.FdmSchemeType.HundsdorferType)
        ];
        for (let i = 0; i < testCases.length; ++i) {
            hestonFokkerPlanckFwdEquationTest(testCases[i]);
        }
    });

    it('Testing Fokker-Planck forward equation for the Heston process' +
        ' Log Transformation with leverage LV limiting case...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('28,Dec,2012');
        Settings.evaluationDate.set(todaysDate);
        const maturityDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        const maturity = dc.yearFraction(todaysDate, maturityDate);
        const s0 = 100;
        const x0 = Math.log(s0);
        const r = 0.0;
        const q = 0.0;
        const kappa = 1.0;
        const theta = 1.0;
        const rho = -0.75;
        const sigma = 0.02;
        const v0 = theta;
        const transform = FdmSquareRootFwdOp.TransformationType.Plain;
        const dayCounter = new Actual365Fixed();
        const calendar = new TARGET();
        const spot = new Handle(new SimpleQuote(s0));
        const rTS = new Handle(flatRate2(todaysDate, r, dayCounter));
        const qTS = new Handle(flatRate2(todaysDate, q, dayCounter));
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const xGrid = 201;
        const vGrid = 401;
        const tGrid = 25;
        const rnd = new SquareRootProcessRNDCalculator(v0, kappa, theta, sigma);
        const upperBound = rnd.stationary_invcdf(0.99);
        const lowerBound = rnd.stationary_invcdf(0.01);
        const beta = 10.0;
        const critPoints = [];
        critPoints.push([lowerBound, beta, true]);
        critPoints.push([v0, beta / 100, true]);
        critPoints.push([upperBound, beta, true]);
        const varianceMesher = new Concentrating1dMesher().init2(lowerBound, upperBound, vGrid, critPoints);
        const equityMesher = new Concentrating1dMesher().init1(Math.log(2.0), Math.log(600.0), xGrid, [x0 + 0.005, 0.1], true);
        const mesher = new FdmMesherComposite().cInit4(equityMesher, varianceMesher);
        const smoothSurface = createSmoothImpliedVol(dayCounter, calendar);
        const lvProcess = new BlackScholesMertonProcess(spot, qTS, rTS, new Handle(smoothSurface[2]));
        const eT = 2.0 / 365;
        let v = -QL_NULL_REAL, p_v = 0.0;
        const p = Array1D.fromSizeValue(mesher.layout().size(), 0.0);
        const bsV0 = new square().f(lvProcess.blackVolatility().currentLink().blackVol2(0.0, s0, true));
        const rndCalculator = new SquareRootProcessRNDCalculator(v0, kappa, theta, sigma);
        const layout = mesher.layout();
        for (const iter = layout.begin(); iter.notEqual(layout.end()); iter.plusplus()) {
            const x = mesher.location(iter, 0);
            if (v !== mesher.location(iter, 1)) {
                v = mesher.location(iter, 1);
                if (Math.abs(v - v0) < 5 * sigma * Math.sqrt(v0 * eT)) {
                    p_v = rndCalculator.pdf(v, eT);
                }
                else {
                    p_v = 0.0;
                }
            }
            const p_x = 1.0 / (Math.sqrt(M_TWOPI * bsV0 * eT)) *
                Math.exp(-0.5 * new square().f(x - x0) / (bsV0 * eT));
            p[iter.index()] = p_v * p_x;
        }
        const dt = (maturity - eT) / tGrid;
        const denseStrikes = [
            2.222222222, 11.11111111, 20, 25, 30,
            35, 40, 44.44444444, 50, 55,
            60, 65, 70, 75.55555556, 80,
            84.44444444, 88.88888889, 93.33333333, 97.77777778, 100,
            102.2222222, 106.6666667, 111.1111111, 115.5555556, 120,
            124.4444444, 166.6666667, 222.2222222, 444.4444444, 666.6666667
        ];
        const ds = Array.from(denseStrikes);
        const surface = Array2D.newMatrix(ds.length, smoothSurface[1].length);
        const times = new Array(Array2D.columns(surface));
        const dates = smoothSurface[1];
        const m = createLocalVolMatrixFromProcess(lvProcess, ds, dates, times);
        const leverage = new FixedLocalVolSurface().flvsInit1(todaysDate, dates, ds, m, dc);
        const hestonFwdOp = new FdmHestonFwdOp(mesher, hestonProcess, transform, leverage);
        const evolver = new HundsdorferScheme(FdmSchemeDesc.Hundsdorfer().theta, FdmSchemeDesc.Hundsdorfer().mu, hestonFwdOp);
        let t = dt;
        evolver.setStep(dt);
        for (let i = 0; i < tGrid; ++i, t += dt) {
            evolver.step(p, t);
        }
        const exercise = new EuropeanExercise(maturityDate);
        const fdmEngine = new FdBlackScholesVanillaEngine(lvProcess, 50, 201, 0, FdmSchemeDesc.Douglas(), true, 0.2);
        for (let strike = 5; strike < 200; strike += 10) {
            const payoff = new CashOrNothingPayoff(Option.Type.Put, strike, 1.0);
            const pd = new Array(p.length);
            for (const iter = layout.begin(); iter.notEqual(layout.end()); iter.plusplus()) {
                const idx = iter.index();
                const s = Math.exp(mesher.location(iter, 0));
                pd[idx] = payoff.f(s) * p[idx];
            }
            const calculated = fokkerPlanckPrice2D(pd, mesher) *
                rTS.currentLink().discount1(maturityDate);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(fdmEngine);
            const expected = option.NPV();
            const tol = 0.015;
            expect(Math.abs(expected - calculated)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Fokker-Planck forward equation for BS Local Vol process...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,July,2014');
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const x0 = Math.log(s0);
        const r = 0.035;
        const q = 0.01;
        const calendar = new TARGET();
        const dayCounter = new Actual365Fixed();
        const rTS = new Handle(flatRate2(todaysDate, r, dayCounter));
        const qTS = new Handle(flatRate2(todaysDate, q, dayCounter));
        const smoothImpliedVol = createSmoothImpliedVol(dayCounter, calendar);
        const strikes = smoothImpliedVol[0];
        const dates = smoothImpliedVol[1];
        const vTS = new Handle(createSmoothImpliedVol(dayCounter, calendar)[2]);
        const xGrid = 101;
        const tGrid = 51;
        const spot = new Handle(new SimpleQuote(s0));
        const process = new BlackScholesMertonProcess(spot, qTS, rTS, vTS);
        const localVol = new NoExceptLocalVolSurface().nelvsInit1(vTS, rTS, qTS, spot, 0.2);
        const engine = new AnalyticEuropeanEngine().init1(process);
        for (let i = 1; i < dates.length; i += 2) {
            for (let j = 3; j < strikes.length - 3; j += 2) {
                const exDate = dates[i];
                const maturityDate = exDate;
                const maturity = dc.yearFraction(todaysDate, maturityDate);
                const exercise = new EuropeanExercise(exDate);
                const uniformMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0));
                const uniformBSFwdOp = new FdmLocalVolFwdOp(uniformMesher, spot.currentLink(), rTS.currentLink(), qTS.currentLink(), localVol);
                const concentratedMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0, QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [s0, 0.1]));
                const concentratedBSFwdOp = new FdmLocalVolFwdOp(concentratedMesher, spot.currentLink(), rTS.currentLink(), qTS.currentLink(), localVol);
                const shiftedMesher = new FdmMesherComposite().cInit3(new FdmBlackScholesMesher(xGrid, process, maturity, s0, QL_NULL_REAL, QL_NULL_REAL, 0.0001, 1.5, [s0 * 1.1, 0.2]));
                const shiftedBSFwdOp = new FdmLocalVolFwdOp(shiftedMesher, spot.currentLink(), rTS.currentLink(), qTS.currentLink(), localVol);
                const payoff = new PlainVanillaPayoff(Option.Type.Call, strikes[j]);
                const option = new VanillaOption(payoff, exercise);
                option.setPricingEngine(engine);
                const expected = option.NPV();
                const calcUniform = fokkerPlanckPrice1D(uniformMesher, uniformBSFwdOp, payoff, x0, maturity, tGrid) *
                    rTS.currentLink().discount1(maturityDate);
                const calcConcentrated = fokkerPlanckPrice1D(concentratedMesher, concentratedBSFwdOp, payoff, x0, maturity, tGrid) *
                    rTS.currentLink().discount1(maturityDate);
                const calcShifted = fokkerPlanckPrice1D(shiftedMesher, shiftedBSFwdOp, payoff, x0, maturity, tGrid) *
                    rTS.currentLink().discount1(maturityDate);
                const tol = 0.05;
                expect(Math.abs(expected - calcUniform)).toBeLessThan(tol);
                expect(Math.abs(expected - calcConcentrated)).toBeLessThan(tol);
                expect(Math.abs(expected - calcShifted)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing stochastic local volatility calibration...', () => {
        const backup = new SavedSettings();
        const plainParams = new HestonSLVFokkerPlanckFdmParams(201, 301, 1000, 25, 3.0, 0, 2, 0.1, 1e-4, 10000, 1e-8, 1e-8, 0.0, 1.0, 1.0, 1.0, 1e-6, FdmHestonGreensFct.Algorithm.Gaussian, FdmSquareRootFwdOp.TransformationType.Plain, FdmSchemeDesc.ModifiedCraigSneyd());
        const logParams = new HestonSLVFokkerPlanckFdmParams(301, 601, 2000, 30, 2.0, 0, 2, 0.1, 1e-4, 10000, 1e-5, 1e-5, 0.0000025, 1.0, 0.1, 0.9, 1e-5, FdmHestonGreensFct.Algorithm.Gaussian, FdmSquareRootFwdOp.TransformationType.Log, FdmSchemeDesc.ModifiedCraigSneyd());
        const powerParams = new HestonSLVFokkerPlanckFdmParams(401, 801, 2000, 30, 2.0, 0, 2, 0.1, 1e-3, 10000, 1e-6, 1e-6, 0.001, 1.0, 0.001, 1.0, 1e-5, FdmHestonGreensFct.Algorithm.Gaussian, FdmSquareRootFwdOp.TransformationType.Power, FdmSchemeDesc.ModifiedCraigSneyd());
        const testCases = [
            new HestonSLVTestCase(new HestonModelParams(0.035, 0.01, 1.0, 0.06, -0.75, 0.1, 0.09), plainParams),
            new HestonSLVTestCase(new HestonModelParams(0.035, 0.01, 1.0, 0.06, -0.75, Math.sqrt(0.2), 0.09), logParams),
            new HestonSLVTestCase(new HestonModelParams(0.035, 0.01, 1.0, 0.09, -0.75, Math.sqrt(0.2), 0.06), logParams),
            new HestonSLVTestCase(new HestonModelParams(0.035, 0.01, 1.0, 0.06, -0.75, 0.2, 0.09), powerParams)
        ];
        for (let i = 0; i < testCases.length; ++i) {
            lsvCalibrationTest(testCases[i]);
        }
        backup.dispose();
    });

    it('Testing local volatility vs SLV model...', () => {
        const backup = new SavedSettings();
        const todaysDate = DateExt.UTC('5,Oct,2015');
        const finalDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.01;
        const q = 0.02;
        const calendar = new TARGET();
        const dayCounter = new Actual365Fixed();
        const rTS = new Handle(flatRate2(todaysDate, r, dayCounter));
        const qTS = new Handle(flatRate2(todaysDate, q, dayCounter));
        const vTS = new Handle(createSmoothImpliedVol(dayCounter, calendar)[2]);
        const kappa = 2.0;
        const theta = 0.074;
        const rho = -0.51;
        const sigma = 0.8;
        const v0 = 0.1974;
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonModel = new Handle(new HestonModel(hestonProcess));
        const localVol = new Handle(new NoExceptLocalVolSurface().nelvsInit1(vTS, rTS, qTS, spot, 0.3));
        localVol.currentLink().enableExtrapolation(true);
        const vGrid = 151;
        const xGrid = 51;
        const fdmParams = new HestonSLVFokkerPlanckFdmParams(xGrid, vGrid, 500, 50, 100.0, 5, 2, 0.1, 1e-4, 10000, 1e-5, 1e-5, 0.0000025, 1.0, 0.1, 0.9, 1e-5, FdmHestonGreensFct.Algorithm.ZeroCorrelation, FdmSquareRootFwdOp.TransformationType.Log, FdmSchemeDesc.ModifiedCraigSneyd());
        const slvModel = new HestonSLVFDMModel(localVol, hestonModel, finalDate, fdmParams, true);
        const logEntries = slvModel.logEntries();
        const squareRootRndCalculator = new SquareRootProcessRNDCalculator(v0, kappa, theta, sigma);
        for (let iter = 0; iter !== logEntries.length; ++iter) {
            const t = logEntries[iter].t;
            if (t > 0.2) {
                const x = Array.from(logEntries[iter].mesher.getFdm1dMeshers()[0].locations());
                const z = Array.from(logEntries[iter].mesher.getFdm1dMeshers()[1].locations());
                const prob = logEntries[iter].prob;
                for (let i = 0; i < z.length; ++i) {
                    const pCalc = new DiscreteSimpsonIntegral().f(x, prob.slice(i * xGrid, (i + 1) * xGrid));
                    const expected = squareRootRndCalculator.pdf(Math.exp(z[i]), t);
                    const calculated = pCalc / Math.exp(z[i]);
                    expect(Math.abs(expected - calculated)).toBeLessThan(0.01);
                    expect(Math.abs((expected - calculated) / expected))
                        .toBeLessThan(0.04);
                }
            }
        }
        backup.dispose();
    });

    it('Testing calibration via vanilla options...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,Nov,2015');
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.1;
        const q = 0.025;
        const kappa = 2.0;
        const theta = 0.09;
        const rho = -0.75;
        const sigma = 0.8;
        const v0 = 0.19;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonModel = new Handle(new HestonModel(hestonProcess));
        const surf = new Handle(new HestonBlackVolSurface(hestonModel));
        const strikeValues = [50, 75, 100, 125, 150, 200, 400];
        const maturities = [
            new Period().init1(1, TimeUnit.Months),
            new Period().init1(2, TimeUnit.Months),
            new Period().init1(3, TimeUnit.Months),
            new Period().init1(4, TimeUnit.Months),
            new Period().init1(5, TimeUnit.Months),
            new Period().init1(6, TimeUnit.Months),
            new Period().init1(9, TimeUnit.Months),
            new Period().init1(1, TimeUnit.Years),
            new Period().init1(18, TimeUnit.Months),
            new Period().init1(2, TimeUnit.Years),
            new Period().init1(3, TimeUnit.Years),
            new Period().init1(5, TimeUnit.Years)
        ];
        const hestonEngine = new AnalyticHestonEngine().aheInit2(hestonModel.currentLink(), 164);
        for (let i = 0; i < strikeValues.length; ++i) {
            for (let j = 0; j < maturities.length; ++j) {
                const strike = strikeValues[i];
                const exerciseDate = DateExt.addPeriod(todaysDate, maturities[j]);
                const t = dc.yearFraction(todaysDate, exerciseDate);
                const impliedVol = surf.currentLink().blackVol2(t, strike, true);
                const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(impliedVol, dc)));
                const analyticEngine = new AnalyticEuropeanEngine().init1(bsProcess);
                const exercise = new EuropeanExercise(exerciseDate);
                const payoff = new PlainVanillaPayoff(spot.currentLink().value() < strike ? Option.Type.Call :
                    Option.Type.Put, strike);
                const localVolEngine = new FdBlackScholesVanillaEngine(bsProcess, 201, 801, 0, FdmSchemeDesc.Douglas(), true);
                const option = new VanillaOption(payoff, exercise);
                option.setPricingEngine(analyticEngine);
                const analyticNPV = option.NPV();
                option.setPricingEngine(hestonEngine);
                const hestonNPV = option.NPV();
                option.setPricingEngine(localVolEngine);
                const localVolNPV = option.NPV();
                const tol = 1e-3;
                expect(Math.abs(analyticNPV - hestonNPV)).toBeLessThan(tol);
                expect(Math.abs(analyticNPV - localVolNPV)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing Barrier pricing with mixed models...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,Nov,2015');
        const exerciseDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.05;
        const q = 0.02;
        const kappa = 2.0;
        const theta = 0.09;
        const rho = -0.75;
        const sigma = 0.4;
        const v0 = 0.19;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonModel = new Handle(new HestonModel(hestonProcess));
        const impliedVolSurf = new Handle(new HestonBlackVolSurface(hestonModel));
        const localVolSurf = new Handle(new NoExceptLocalVolSurface().nelvsInit1(impliedVolSurf, rTS, qTS, spot, 0.3));
        const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, impliedVolSurf);
        const exercise = new EuropeanExercise(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, s0);
        const hestonEngine = new FdHestonBarrierEngine(hestonModel.currentLink(), 26, 101, 51);
        const localEngine = new FdBlackScholesBarrierEngine(bsProcess, 26, 101, 0, FdmSchemeDesc.Douglas(), true, 0.3);
        const barrier = 10.0;
        const barrierOption = new BarrierOption(Barrier.Type.DownOut, barrier, 0.0, payoff, exercise);
        barrierOption.setPricingEngine(hestonEngine);
        const hestonDeltaCalculated = barrierOption.delta();
        barrierOption.setPricingEngine(localEngine);
        const localDeltaCalculated = barrierOption.delta();
        const localDeltaExpected = -0.439068;
        const hestonDeltaExpected = -0.342059;
        const tol = 0.0001;
        expect(Math.abs(hestonDeltaExpected - hestonDeltaCalculated))
            .toBeLessThan(tol);
        expect(Math.abs(localDeltaExpected - localDeltaCalculated))
            .toBeLessThan(tol);
        const params = new HestonSLVFokkerPlanckFdmParams(51, 201, 1000, 100, 3.0, 0, 2, 0.1, 1e-4, 10000, 1e-8, 1e-8, 0.0, 1.0, 1.0, 1.0, 1e-6, FdmHestonGreensFct.Algorithm.Gaussian, FdmSquareRootFwdOp.TransformationType.Plain, FdmSchemeDesc.ModifiedCraigSneyd());
        const eta = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const slvDeltaExpected = [
            -0.429475, -0.419749, -0.410055, -0.400339, -0.390616, -0.380888,
            -0.371156, -0.361425, -0.351699, -0.341995
        ];
        for (let i = 0; i < eta.length; ++i) {
            const modHestonModel = new Handle(new HestonModel(new HestonProcess(rTS, qTS, spot, v0, kappa, theta, eta[i] * sigma, rho)));
            const slvModel = new HestonSLVFDMModel(localVolSurf, modHestonModel, exerciseDate, params);
            const leverageFct = slvModel.leverageFunction();
            const slvEngine = new FdHestonBarrierEngine(modHestonModel.currentLink(), 201, 801, 201, 0, FdmSchemeDesc.Hundsdorfer(), leverageFct);
            const barrierOption = new BarrierOption(Barrier.Type.DownOut, barrier, 0.0, payoff, exercise);
            barrierOption.setPricingEngine(slvEngine);
            const slvDeltaCalculated = barrierOption.delta();
            expect(Math.abs(slvDeltaExpected[i] - slvDeltaCalculated))
                .toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing Monte-Carlo vs FDM Pricing for Heston SLV models...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,Dec,2015');
        const exerciseDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.05;
        const q = 0.02;
        const kappa = 2.0;
        const theta = 0.18;
        const rho = -0.75;
        const sigma = 0.8;
        const v0 = 0.19;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonModel = new HestonModel(hestonProcess);
        const leverageFct = new LocalConstantVol().lcvInit1(todaysDate, 0.25, dc);
        const slvProcess = new HestonSLVProcess(hestonProcess, leverageFct);
        const mcEngine = new MakeMCEuropeanHestonEngine(new PseudoRandom(), new GeneralStatistics())
            .mmceheInit(slvProcess)
            .withStepsPerYear(100)
            .withAntitheticVariate()
            .withSamples(10000)
            .withSeed(1234)
            .f();
        const fdEngine = new FdHestonVanillaEngine(hestonModel, 51, 401, 101, 0, FdmSchemeDesc.ModifiedCraigSneyd(), leverageFct);
        const exercise = new EuropeanExercise(exerciseDate);
        const strikes = [s0, 1.1 * s0];
        for (let i = 0; i < strikes.length; ++i) {
            const strike = strikes[i];
            const payoff = new PlainVanillaPayoff(Option.Type.Call, strike);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(fdEngine);
            const priceFDM = option.NPV();
            option.setPricingEngine(mcEngine);
            const priceMC = option.NPV();
            const priceError = option.errorEstimate();
            expect(priceError).toBeLessThan(0.1);
            expect(Math.abs(priceFDM - priceMC)).toBeLessThan(2.3 * priceError);
        }
        backup.dispose();
    });

    it('Testing Monte-Carlo Calibration...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,Jan,2016');
        const maturityDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.05;
        const q = 0.02;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const localVol = new LocalConstantVol().lcvInit1(todaysDate, 0.3, dc);
        const kappa = 1.0;
        const theta = 0.06;
        const rho = -0.75;
        const sigma = 0.4;
        const v0 = 0.09;
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonModel = new HestonModel(hestonProcess);
        const xGrid = 400;
        const nSims = [40000];
        for (let m = 0; m < nSims.length; ++m) {
            const nSim = nSims[m];
            const sobol = true;
            const leverageFct = new HestonSLVMCModel(new Handle(localVol), new Handle(hestonModel), sobol ? new SobolBrownianGeneratorFactory(SobolBrownianGenerator.Ordering.Diagonal, 1234, SobolRsg.DirectionIntegers.JoeKuoD7) :
                new MTBrownianGeneratorFactory(1234), maturityDate, 91, xGrid, nSim)
                .leverageFunction();
            const bsEngine = new AnalyticEuropeanEngine().init1(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(0.3, dc))));
            const strikes = [50, 80, 100, 120, 150, 200];
            const maturities = [
                DateExt.advance(todaysDate, 3, TimeUnit.Months),
                DateExt.advance(todaysDate, 6, TimeUnit.Months),
                DateExt.advance(todaysDate, 12, TimeUnit.Months)
            ];
            let qualityFactor = 0.0;
            let maxQualityFactor = 0.0;
            let nValues = 0;
            for (let i = 0; i < maturities.length; ++i) {
                const maturity = maturities[i];
                const maturityTime = dc.yearFraction(todaysDate, maturity);
                const fdEngine = new FdHestonVanillaEngine(hestonModel, Math.max(26, Math.floor(maturityTime * 51)), 201, 51, 0, FdmSchemeDesc.ModifiedCraigSneyd(), leverageFct);
                const exercise = new EuropeanExercise(maturity);
                for (let j = 0; j < strikes.length; ++j) {
                    const strike = strikes[j];
                    const payoff = new PlainVanillaPayoff(strike < s0 ? Option.Type.Put : Option.Type.Call, strike);
                    const option = new VanillaOption(payoff, exercise);
                    option.setPricingEngine(bsEngine);
                    const bsNPV = option.NPV();
                    const bsVega = option.vega();
                    if (bsNPV > 0.02) {
                        option.setPricingEngine(fdEngine);
                        const fdmNPV = option.NPV();
                        const diff = Math.abs(fdmNPV - bsNPV) / bsVega * 1e4;
                        qualityFactor += diff;
                        maxQualityFactor = Math.max(maxQualityFactor, diff);
                        ++nValues;
                    }
                }
            }
            expect(qualityFactor / nValues).toBeLessThan(7.5);
            expect(qualityFactor / nValues).toBeLessThan(15.0);
        }
        backup.dispose();
    });

    it('Testing the implied volatility skew of ' +
        'forward starting options in SLV model...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,Jan,2017');
        const maturityDate = DateExt.advance(todaysDate, 2, TimeUnit.Years);
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.05;
        const q = 0.02;
        const flatLocalVol = 0.3;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const localVol = new Handle(new LocalConstantVol().lcvInit1(todaysDate, flatLocalVol, dc));
        const kappa = 2.0;
        const theta = 0.06;
        const rho = -0.75;
        const sigma = 0.6;
        const v0 = 0.09;
        const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const hestonModel = new Handle(new HestonModel(hestonProcess));
        const nSim = 40000;
        const xGrid = 200;
        const sobol = true;
        const leverageFctMC = new HestonSLVMCModel(localVol, hestonModel, sobol ? new SobolBrownianGeneratorFactory(SobolBrownianGenerator.Ordering.Diagonal, 1234, SobolRsg.DirectionIntegers.JoeKuoD7) :
            new MTBrownianGeneratorFactory(1234), maturityDate, 182, xGrid, nSim)
            .leverageFunction();
        const mcSlvProcess = new HestonSLVProcess(hestonProcess, leverageFctMC);
        const logParams = new HestonSLVFokkerPlanckFdmParams(201, 401, 1000, 30, 2.0, 0, 2, 0.1, 1e-4, 10000, 1e-5, 1e-5, 0.0000025, 1.0, 0.1, 0.9, 1e-5, FdmHestonGreensFct.Algorithm.Gaussian, FdmSquareRootFwdOp.TransformationType.Log, FdmSchemeDesc.ModifiedCraigSneyd());
        const leverageFctFDM = new HestonSLVFDMModel(localVol, hestonModel, maturityDate, logParams)
            .leverageFunction();
        const fdmSlvProcess = new HestonSLVProcess(hestonProcess, leverageFctFDM);
        const resetDate = DateExt.advance(todaysDate, 12, TimeUnit.Months);
        const resetTime = dc.yearFraction(todaysDate, resetDate);
        const maturityTime = dc.yearFraction(todaysDate, maturityDate);
        const mandatoryTimes = [];
        mandatoryTimes.push(resetTime);
        mandatoryTimes.push(maturityTime);
        const tSteps = 100;
        const grid = new TimeGrid().init3(mandatoryTimes, 0, mandatoryTimes.length, tSteps);
        const resetIndex = grid.closestIndex(resetTime);
        const factors = mcSlvProcess.factors();
        const pathGen = [];
        pathGen.push(new MultiPathGenerator().init2(mcSlvProcess, grid, new SobolBrownianBridgeRsg(factors, tSteps), false));
        pathGen.push(new MultiPathGenerator().init2(fdmSlvProcess, grid, new SobolBrownianBridgeRsg(factors, tSteps), false));
        const strikes = [0.5, 0.7, 0.8, 0.9, 1.0, 1.1, 1.25, 1.5, 1.75, 2.0];
        const stats = new Array(2);
        for (let i = 0; i < 2; i++) {
            stats[i] = new Array(strikes.length);
        }
        for (let i = 0; i < 5 * nSim; ++i) {
            for (let k = 0; k < 2; ++k) {
                const path = pathGen[k].next();
                const S_t1 = path.value.at(0).at(resetIndex - 1);
                const S_T1 = path.value.at(0).at(tSteps - 1);
                const antiPath = pathGen[k].antithetic();
                const S_t2 = antiPath.value.at(0).at(resetIndex - 1);
                const S_T2 = antiPath.value.at(0).at(tSteps - 1);
                for (let j = 0; j < strikes.length; ++j) {
                    const strike = strikes[j];
                    if (strike < 1.0) {
                        stats[k][j].add(0.5 *
                            (S_t1 * Math.max(0.0, strike - S_T1 / S_t1) +
                                S_t2 * Math.max(0.0, strike - S_T2 / S_t2)));
                    }
                    else {
                        stats[k][j].add(0.5 *
                            (S_t1 * Math.max(0.0, S_T1 / S_t1 - strike) +
                                S_t2 * Math.max(0.0, S_T2 / S_t2 - strike)));
                    }
                }
            }
        }
        const exercise = new EuropeanExercise(maturityDate);
        const vol = new SimpleQuote(flatLocalVol);
        const volTS = new Handle(flatVol1(todaysDate, vol, dc));
        const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, volTS);
        const fwdEngine = new ForwardVanillaEngine(new AnalyticEuropeanEngine())
            .init1(bsProcess);
        const expected = [
            0.37804, 0.346608, 0.330682, 0.314978, 0.300399, 0.287273, 0.272916,
            0.26518, 0.268663, 0.277052
        ];
        const df = rTS.currentLink().discount2(grid.back());
        for (let j = 0; j < strikes.length; ++j) {
            for (let k = 0; k < 2; ++k) {
                const strike = strikes[j];
                const npv = stats[k][j].mean() * df;
                const payoff = new PlainVanillaPayoff((strike < 1.0) ? Option.Type.Put : Option.Type.Call, strike);
                const fwdOption = new ForwardVanillaOption(strike, resetDate, payoff, exercise);
                const implVol = ImpliedVolatilityHelper.calculate(fwdOption, fwdEngine, vol, npv, 1e-8, 200, 1e-4, 2.0);
                const tol = 0.001;
                const volError = Math.abs(implVol - expected[j]);
                expect(volError).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing double no touch pricing with SLV and mixing...', () => {
        const backup = new SavedSettings();
        const dc = new ActualActual();
        const todaysDate = DateExt.UTC('5,Jan,2016');
        const maturityDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
        Settings.evaluationDate.set(todaysDate);
        const s0 = 100;
        const spot = new Handle(new SimpleQuote(s0));
        const r = 0.02;
        const q = 0.01;
        const kappa = 1.0;
        const theta = 0.06;
        const rho = -0.8;
        const sigma = 0.8;
        const v0 = 0.09;
        const rTS = new Handle(flatRate4(r, dc));
        const qTS = new Handle(flatRate4(q, dc));
        const hestonModel = new HestonModel(new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho));
        const europeanExercise = new EuropeanExercise(maturityDate);
        const vanillaOption = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0), europeanExercise);
        vanillaOption.setPricingEngine(new AnalyticHestonEngine().init2(hestonModel));
        const implVol = vanillaOption.impliedVolatility(vanillaOption.NPV(), new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(Math.sqrt(theta), dc))));
        const analyticEngine = new AnalyticDoubleBarrierBinaryEngine().init1(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(implVol, dc))));
        const expiries = [];
        const timeStepPeriod = new Period().init1(1, TimeUnit.Weeks);
        for (let expiry = DateExt.addPeriod(todaysDate, timeStepPeriod); expiry.valueOf() <= maturityDate.valueOf(); expiry = DateExt.addPeriod(expiry, timeStepPeriod)) {
            expiries.push(dc.yearFraction(todaysDate, expiry));
        }
        const timeGrid = new TimeGrid().init2(expiries, 0, expiries.length);
        const localVol = new Handle(getFixedLocalVolFromHeston(hestonModel, timeGrid));
        const sobolGeneratorFactory = new SobolBrownianGeneratorFactory(SobolBrownianGenerator.Ordering.Diagonal, 1234, SobolRsg.DirectionIntegers.JoeKuoD7);
        const xGrid = 100;
        const nSim = 20000;
        const eta = 0.90;
        const modHestonModel = new Handle(new HestonModel(new HestonProcess(rTS, qTS, spot, v0, kappa, theta, eta * sigma, rho)));
        const leverageFct = new HestonSLVMCModel(localVol, modHestonModel, sobolGeneratorFactory, maturityDate, 182, xGrid, nSim)
            .leverageFunction();
        const fdEngine = new FdHestonDoubleBarrierEngine(modHestonModel.currentLink(), 51, 101, 31, 0, FdmSchemeDesc.Hundsdorfer(), leverageFct);
        const expected = [
            0.0334, 0.1141, 0.1319, 0.0957, 0.0464, 0.0058, -0.0192, -0.0293, -0.0297,
            -0.0251, -0.0192, -0.0134, -0.0084, -0.0045, -0.0015, 0.0005, 0.0017,
            0.0020
        ];
        const tol = 1e-2;
        for (let i = 0; i < 18; ++i) {
            const dist = 10.0 + 5.0 * i;
            const barrier_lo = Math.max(s0 - dist, 1e-2);
            const barrier_hi = s0 + dist;
            const doubleBarrier = new DoubleBarrierOption(DoubleBarrier.Type.KnockOut, barrier_lo, barrier_hi, 0.0, new CashOrNothingPayoff(Option.Type.Call, 0.0, 1.0), europeanExercise);
            doubleBarrier.setPricingEngine(analyticEngine);
            const bsNPV = doubleBarrier.NPV();
            doubleBarrier.setPricingEngine(fdEngine);
            const slvNPV = doubleBarrier.NPV();
            const diff = slvNPV - bsNPV;
            expect(Math.abs(diff - expected[i])).toBeLessThan(tol);
        }
        backup.dispose();
    });
});
