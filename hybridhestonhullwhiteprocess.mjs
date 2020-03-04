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
import { Actual360, Actual365Fixed, AnalyticBSMHullWhiteEngine, AnalyticEuropeanEngine, AnalyticH1HWEngine, AnalyticHestonEngine, AnalyticHestonHullWhiteEngine, Array1D, BlackCalibrationHelper, BlackScholesMertonProcess, BusinessDayConvention, Constraint, DateExt, DateGeneration, EndCriteria, EuropeanExercise, EuropeanOption, FdHestonHullWhiteVanillaEngine, FdHestonVanillaEngine, FdmSchemeDesc, GeneralizedBlackScholesProcess, GeneralStatistics, Handle, HestonModel, HestonModelHelper, HestonProcess, HullWhite, HullWhiteForwardProcess, HullWhiteProcess, HybridHestonHullWhiteProcess, ImpliedVolatilityHelper, LevenbergMarquardt, MakeMCHestonHullWhiteEngine, MultiPathGenerator, Option, Period, PlainVanillaPayoff, PseudoRandom, QL_EPSILON, RelinkableHandle, SavedSettings, Schedule, Settings, SimpleQuote, SobolBrownianBridgeRsg, TARGET, TimeGrid, TimeUnit, VanillaOption, ZeroCurve, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatRate2, flatRate4, flatVol1, flatVol2, flatVol4 } from '/test-suite/utilities.mjs';

class HestonModelData {
    constructor(name, v0, kappa, theta, sigma, rho, r, q) {
        this.name = name;
        this.v0 = v0;
        this.kappa = kappa;
        this.theta = theta;
        this.sigma = sigma;
        this.rho = rho;
        this.r = r;
        this.q = q;
    }
}

const hestonModels = [
    new HestonModelData('\'t Hout case 1', 0.04, 1.5, 0.04, 0.3, -0.9, 0.025, 0.0),
    new HestonModelData('\'t Hout case 2', 0.12, 3.0, 0.12, 0.04, 0.6, 0.01, 0.04),
    new HestonModelData('\'t Hout case 3', 0.0707, 0.6067, 0.0707, 0.2928, -0.7571, 0.03, 0.0),
    new HestonModelData('\'t Hout case 4', 0.06, 2.5, 0.06, 0.5, -0.1, 0.0507, 0.0469),
    new HestonModelData('Ikonen-Toivanen', 0.0625, 5, 0.16, 0.9, 0.1, 0.1, 0.0),
    new HestonModelData('Kahl-Jaeckel', 0.16, 1.0, 0.16, 2.0, -0.8, 0.0, 0.0),
    new HestonModelData('Equity case', 0.07, 2.0, 0.04, 0.55, -0.8, 0.03, 0.035),
    new HestonModelData('high correlation', 0.07, 1.0, 0.04, 0.55, 0.995, 0.02, 0.04),
    new HestonModelData('low Vol-Of-Vol', 0.07, 1.0, 0.04, 0.001, -0.75, 0.04, 0.03),
    new HestonModelData('kappaEqSigRho', 0.07, 0.4, 0.04, 0.5, 0.8, 0.03, 0.03)
];

class HullWhiteModelData {
    constructor(name, a, sigma) {
        this.name = name;
        this.a = a;
        this.sigma = sigma;
    }
}

const hullWhiteModels = [new HullWhiteModelData('EUR-2003', 0.00883, 0.00631)];

class SchemeData {
    constructor(name, schemeDesc) {
        this.name = name;
        this.schemeDesc = schemeDesc;
    }
}

const schemes = [
    new SchemeData('HV2', FdmSchemeDesc.Hundsdorfer()),
    new SchemeData('HV1', FdmSchemeDesc.ModifiedHundsdorfer()),
    new SchemeData('CS', FdmSchemeDesc.CraigSneyd()),
    new SchemeData('MCS', FdmSchemeDesc.ModifiedCraigSneyd()),
    new SchemeData('DS', FdmSchemeDesc.Douglas())
];

class VanillaOptionData {
    constructor(strike, maturity, optionType) {
        this.strike = strike;
        this.maturity = maturity;
        this.optionType = optionType;
    }
}

function makeHestonProcess(params) {
    const spot = new Handle(new SimpleQuote(100));
    const dayCounter = new Actual365Fixed();
    const rTS = new Handle(flatRate4(params.r, dayCounter));
    const qTS = new Handle(flatRate4(params.q, dayCounter));
    return new HestonProcess(rTS, qTS, spot, params.v0, params.kappa, params.theta, params.sigma, params.rho);
}

function makeVanillaOption(params) {
    const maturity = DateExt.advance(Settings.evaluationDate.f(), Math.floor(params.maturity * 365), TimeUnit.Days);
    const exercise = new EuropeanExercise(maturity);
    const payoff = new PlainVanillaPayoff(params.optionType, params.strike);
    return new VanillaOption(payoff, exercise);
}

class HestonHullWhiteCorrelationConstraint extends Constraint {
    constructor(equityShortRateCorr) {
        super(new Impl(equityShortRateCorr));
    }
}

class Impl extends Constraint.Impl {
    constructor(equityShortRateCorr) {
        super();
        this._equityShortRateCorr = equityShortRateCorr;
    }
    test(params) {
        const rho = params[3];
        return ((rho * rho) + (this._equityShortRateCorr * this._equityShortRateCorr) <=
            1.0);
    }
}

describe(`Hybrid Heston-HullWhite tests ${version}`, () => {
    it('Testing European option pricing for a BSM process' +
        ' with one-factor Hull-White model...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = DateExt.UTC();
        const maturity = DateExt.advance(today, 20, TimeUnit.Years);
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const qRate = new SimpleQuote(0.04);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.0525);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const vol = new SimpleQuote(0.25);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const hullWhiteModel = new HullWhite(rTS, 0.00883, 0.00526);
        const stochProcess = new BlackScholesMertonProcess(spot, qTS, rTS, volTS);
        const exercise = new EuropeanExercise(maturity);
        const fwd = spot.currentLink().value() *
            qTS.currentLink().discount1(maturity) /
            rTS.currentLink().discount1(maturity);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, fwd);
        const option = new EuropeanOption(payoff, exercise);
        const tol = 1e-8;
        const corr = [-0.75, -0.25, 0.0, 0.25, 0.75];
        const expectedVol = [0.217064577, 0.243995801, 0.256402830, 0.268236596, 0.290461343];
        for (let i = 0; i < corr.length; ++i) {
            const bsmhwEngine = new AnalyticBSMHullWhiteEngine(corr[i], stochProcess, hullWhiteModel);
            option.setPricingEngine(bsmhwEngine);
            const npv = option.NPV();
            const compVolTS = new Handle(flatVol2(today, expectedVol[i], dc));
            const bsProcess = new BlackScholesMertonProcess(spot, qTS, rTS, compVolTS);
            const bsEngine = new AnalyticEuropeanEngine().init1(bsProcess);
            const comp = new EuropeanOption(payoff, exercise);
            comp.setPricingEngine(bsEngine);
            const impliedVol = comp.impliedVolatility(npv, bsProcess, 1e-10, 100);
            expect(Math.abs(impliedVol - expectedVol[i])).toBeLessThan(tol);
            expect(Math.abs((comp.NPV() - npv) / npv)).toBeLessThan(tol);
            expect(Math.abs(comp.delta() - option.delta())).toBeLessThan(tol);
            expect(Math.abs((comp.gamma() - option.gamma()) / npv))
                .toBeLessThan(tol);
            expect(Math.abs((comp.theta() - option.theta()) / npv))
                .toBeLessThan(tol);
            expect(Math.abs((comp.vega() - option.vega()) / npv))
                .toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Comparing European option pricing for a BSM process' +
        ' with one-factor Hull-White model...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const dates = [];
        const rates = [], divRates = [];
        for (let i = 0; i <= 40; ++i) {
            dates.push(DateExt.advance(today, i, TimeUnit.Years));
            rates.push(0.01 + 0.0002 * Math.exp(Math.sin(i / 4.0)));
            divRates.push(0.02 + 0.0001 * Math.exp(Math.sin(i / 5.0)));
        }
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
        const qTS = new Handle(new ZeroCurve().curveInit1(dates, divRates, dc));
        const vol = new SimpleQuote(0.25);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const bsmProcess = new BlackScholesMertonProcess(spot, qTS, rTS, volTS);
        const hestonProcess = new HestonProcess(rTS, qTS, spot, vol.value() * vol.value(), 1.0, vol.value() * vol.value(), 1e-4, 0.0);
        const hestonModel = new HestonModel(hestonProcess);
        const hullWhiteModel = new HullWhite(rTS, 0.01, 0.01);
        const bsmhwEngine = new AnalyticBSMHullWhiteEngine(0.0, bsmProcess, hullWhiteModel);
        const hestonHwEngine = new AnalyticHestonHullWhiteEngine().ahhweInit1(hestonModel, hullWhiteModel, 128);
        const tol = 1e-5;
        const strike = [0.25, 0.5, 0.75, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0, 4.0];
        const maturity = [1, 2, 3, 5, 10, 15, 20, 25, 30];
        const types = [Option.Type.Put, Option.Type.Call];
        for (let i = 0; i < types.length; ++i) {
            for (let j = 0; j < strike.length; ++j) {
                for (let l = 0; l < maturity.length; ++l) {
                    const maturityDate = DateExt.advance(today, maturity[l], TimeUnit.Years);
                    const exercise = new EuropeanExercise(maturityDate);
                    const fwd = strike[j] * spot.currentLink().value() *
                        qTS.currentLink().discount1(maturityDate) /
                        rTS.currentLink().discount1(maturityDate);
                    const payoff = new PlainVanillaPayoff(types[i], fwd);
                    const option = new EuropeanOption(payoff, exercise);
                    option.setPricingEngine(bsmhwEngine);
                    const calculated = option.NPV();
                    option.setPricingEngine(hestonHwEngine);
                    const expected = option.NPV();
                    expect(Math.abs(calculated - expected))
                        .toBeLessThan(calculated * tol);
                    expect(Math.abs(calculated - expected)).toBeLessThan(tol);
                }
            }
        }
        backup.dispose();
    });

    it('Testing Monte-Carlo zero bond pricing...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dates = [];
        const times = [];
        const rates = [];
        dates.push(today);
        rates.push(0.02);
        times.push(0.0);
        for (let i = 120; i < 240; ++i) {
            dates.push(DateExt.advance(today, i, TimeUnit.Months));
            rates.push(0.02 + 0.0002 * Math.exp(Math.sin(i / 8.0)));
            times.push(dc.yearFraction(today, Array1D.back(dates)));
        }
        const maturity = DateExt.advance(Array1D.back(dates), 10, TimeUnit.Years);
        dates.push(maturity);
        rates.push(0.04);
        times.push(dc.yearFraction(today, Array1D.back(dates)));
        const s0 = new Handle(new SimpleQuote(100));
        const ts = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
        const ds = new Handle(flatRate2(today, 0.0, dc));
        const hestonProcess = new HestonProcess(ts, ds, s0, 0.02, 1.0, 0.2, 0.5, -0.8);
        const hwProcess = new HullWhiteForwardProcess(ts, 0.05, 0.05);
        hwProcess.setForwardMeasureTime(dc.yearFraction(today, maturity));
        const hwModel = new HullWhite(ts, 0.05, 0.05);
        const jointProcess = new HybridHestonHullWhiteProcess(hestonProcess, hwProcess, -0.4);
        const grid = new TimeGrid().init2(times, 0, times.length - 1);
        const factors = jointProcess.factors();
        const steps = grid.size() - 1;
        const rsg = new SobolBrownianBridgeRsg(factors, steps);
        const generator = new MultiPathGenerator().init2(jointProcess, grid, rsg, false);
        const m = 90;
        const zeroStat = new Array(m);
        const optionStat = new Array(m);
        const nrTrails = 8191;
        const optionTenor = 24;
        const strike = 0.5;
        for (let i = 0; i < nrTrails; ++i) {
            const path = generator.next();
            for (let j = 1; j < m; ++j) {
                const t = grid.at(j);
                const T = grid.at(j + optionTenor);
                const states = new Array(3);
                const optionStates = new Array(3);
                for (let k = 0; k < jointProcess.size(); ++k) {
                    states[k] = path.value.at(k).at(j);
                    optionStates[k] = path.value.at(k).at(j + optionTenor);
                }
                const zeroBond = 1.0 / jointProcess.numeraire(t, states);
                const zeroOption = zeroBond *
                    Math.max(0.0, hwModel.discountBond2(t, T, states[2]) - strike);
                zeroStat[j].add(zeroBond);
                optionStat[j].add(zeroOption);
            }
        }
        for (let j = 1; j < m; ++j) {
            const t = grid.at(j);
            let calculated = zeroStat[j].mean();
            let expected = ts.currentLink().discount2(t);
            expect(Math.abs(calculated - expected)).toBeLessThan(0.03);
            const T = grid.at(j + optionTenor);
            calculated = optionStat[j].mean();
            expected = hwModel.discountBondOption1(Option.Type.Call, strike, t, T);
            expect(Math.abs(calculated - expected)).toBeLessThan(0.0035);
        }
        backup.dispose();
    });

    it('Testing Monte-Carlo vanilla option pricing...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dates = [];
        const rates = [], divRates = [];
        for (let i = 0; i <= 40; ++i) {
            dates.push(DateExt.advance(today, i, TimeUnit.Years));
            rates.push(0.03 + 0.0003 * Math.exp(Math.sin(i / 4.0)));
            divRates.push(0.02 + 0.0001 * Math.exp(Math.sin(i / 5.0)));
        }
        const maturity = DateExt.advance(today, 20, TimeUnit.Years);
        const s0 = new Handle(new SimpleQuote(100));
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
        const qTS = new Handle(new ZeroCurve().curveInit1(dates, divRates, dc));
        const vol = new SimpleQuote(0.25);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const bsmProcess = new BlackScholesMertonProcess(s0, qTS, rTS, volTS);
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.0625, 0.5, 0.0625, 1e-5, 0.3);
        const hwProcess = new HullWhiteForwardProcess(rTS, 0.01, 0.01);
        hwProcess.setForwardMeasureTime(dc.yearFraction(today, maturity));
        const tol = 0.05;
        const corr = [-0.9, -0.5, 0.0, 0.5, 0.9];
        const strike = [100];
        for (let i = 0; i < corr.length; ++i) {
            for (let j = 0; j < strike.length; ++j) {
                const jointProcess = new HybridHestonHullWhiteProcess(hestonProcess, hwProcess, corr[i]);
                const payoff = new PlainVanillaPayoff(Option.Type.Put, strike[j]);
                const exercise = new EuropeanExercise(maturity);
                const optionHestonHW = new VanillaOption(payoff, exercise);
                const engine = new MakeMCHestonHullWhiteEngine(new PseudoRandom())
                    .mmchhweInit(jointProcess)
                    .withSteps(1)
                    .withAntitheticVariate()
                    .withControlVariate()
                    .withAbsoluteTolerance(tol)
                    .withSeed(42)
                    .f();
                optionHestonHW.setPricingEngine(engine);
                const hwModel = new HullWhite(rTS, hwProcess.a(), hwProcess.sigma());
                const optionBsmHW = new VanillaOption(payoff, exercise);
                optionBsmHW.setPricingEngine(new AnalyticBSMHullWhiteEngine(corr[i], bsmProcess, hwModel));
                const calculated = optionHestonHW.NPV();
                const error = optionHestonHW.errorEstimate();
                const expected = optionBsmHW.NPV();
                if (corr[i] !== 0.0) {
                    expect(Math.abs(calculated - expected)).toBeLessThan(3 * error);
                }
                else {
                    expect(Math.abs(calculated - expected)).toBeLessThan(1e-4);
                }
            }
        }
        backup.dispose();
    });

    it('Testing Monte-Carlo Heston option pricing...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dates = [];
        const rates = [], divRates = [];
        for (let i = 0; i <= 100; ++i) {
            dates.push(DateExt.advance(today, i, TimeUnit.Months));
            rates.push(0.02 + 0.0002 * Math.exp(Math.sin(i / 10.0)));
            divRates.push(0.02 + 0.0001 * Math.exp(Math.sin(i / 20.0)));
        }
        const maturity = DateExt.advance(today, 2, TimeUnit.Years);
        const s0 = new Handle(new SimpleQuote(100));
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
        const qTS = new Handle(new ZeroCurve().curveInit1(dates, divRates, dc));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.08, 1.5, 0.0625, 0.5, -0.8);
        const hwProcess = new HullWhiteForwardProcess(rTS, 0.1, 1e-8);
        hwProcess.setForwardMeasureTime(dc.yearFraction(today, DateExt.advance(maturity, 1, TimeUnit.Years)));
        const tol = 0.001;
        const corr = [-0.45, 0.45, 0.25];
        const strike = [100, 75, 50, 150];
        for (let i = 0; i < corr.length; ++i) {
            for (let j = 0; j < strike.length; ++j) {
                const jointProcess = new HybridHestonHullWhiteProcess(hestonProcess, hwProcess, corr[i], HybridHestonHullWhiteProcess.Discretization.Euler);
                const payoff = new PlainVanillaPayoff(Option.Type.Put, strike[j]);
                const exercise = new EuropeanExercise(maturity);
                const optionHestonHW = new VanillaOption(payoff, exercise);
                const optionPureHeston = new VanillaOption(payoff, exercise);
                optionPureHeston.setPricingEngine(new AnalyticHestonEngine().aheInit2(new HestonModel(hestonProcess)));
                const expected = optionPureHeston.NPV();
                optionHestonHW.setPricingEngine(new MakeMCHestonHullWhiteEngine(new PseudoRandom())
                    .mmchhweInit(jointProcess)
                    .withSteps(2)
                    .withAntitheticVariate()
                    .withControlVariate()
                    .withAbsoluteTolerance(tol)
                    .withSeed(42)
                    .f());
                const calculated = optionHestonHW.NPV();
                const error = optionHestonHW.errorEstimate();
                expect(Math.abs(calculated - expected)).toBeLessThan(3 * error);
                expect(Math.abs(calculated - expected)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing analytic Heston Hull-White option pricing...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dates = [];
        const rates = [], divRates = [];
        for (let i = 0; i <= 40; ++i) {
            dates.push(DateExt.advance(today, i, TimeUnit.Years));
            rates.push(0.03 + 0.0001 * Math.exp(Math.sin(i / 4.0)));
            divRates.push(0.02 + 0.0002 * Math.exp(Math.sin(i / 3.0)));
        }
        const maturity = DateExt.advance(today, 5, TimeUnit.Years);
        const s0 = new Handle(new SimpleQuote(100));
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
        const qTS = new Handle(new ZeroCurve().curveInit1(dates, divRates, dc));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.08, 1.5, 0.0625, 0.5, -0.8);
        const hestonModel = new HestonModel(hestonProcess);
        const hwFwdProcess = new HullWhiteForwardProcess(rTS, 0.01, 0.01);
        hwFwdProcess.setForwardMeasureTime(dc.yearFraction(today, maturity));
        const hullWhiteModel = new HullWhite(rTS, hwFwdProcess.a(), hwFwdProcess.sigma());
        const tol = 0.002;
        const strike = [80, 120];
        const types = [Option.Type.Put, Option.Type.Call];
        for (let i = 0; i < types.length; ++i) {
            for (let j = 0; j < strike.length; ++j) {
                const jointProcess = new HybridHestonHullWhiteProcess(hestonProcess, hwFwdProcess, 0.0, HybridHestonHullWhiteProcess.Discretization.Euler);
                const payoff = new PlainVanillaPayoff(types[i], strike[j]);
                const exercise = new EuropeanExercise(maturity);
                const optionHestonHW = new VanillaOption(payoff, exercise);
                optionHestonHW.setPricingEngine(new MakeMCHestonHullWhiteEngine(new PseudoRandom())
                    .mmchhweInit(jointProcess)
                    .withSteps(1)
                    .withAntitheticVariate()
                    .withControlVariate()
                    .withAbsoluteTolerance(tol)
                    .withSeed(42)
                    .f());
                const optionPureHeston = new VanillaOption(payoff, exercise);
                optionPureHeston.setPricingEngine(new AnalyticHestonHullWhiteEngine().ahhweInit1(hestonModel, hullWhiteModel, 128));
                const calculated = optionHestonHW.NPV();
                const error = optionHestonHW.errorEstimate();
                const expected = optionPureHeston.NPV();
                expect(Math.abs(calculated - expected)).toBeLessThan(3 * error);
                expect(Math.abs(calculated - expected)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });

    it('Testing the pricing of a callable equity product...', () => {
        const backup = new SavedSettings();
        const maturity = 7;
        const dc = new Actual365Fixed();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const qRate = new SimpleQuote(0.04);
        const qTS = new Handle(flatRate1(today, qRate, dc));
        const rRate = new SimpleQuote(0.04);
        const rTS = new Handle(flatRate1(today, rRate, dc));
        const hestonProcess = new HestonProcess(rTS, qTS, spot, 0.0625, 1.0, 0.24 * 0.24, 1e-4, 0.0);
        const hwProcess = new HullWhiteForwardProcess(rTS, 0.00883, 0.00526);
        hwProcess.setForwardMeasureTime(dc.yearFraction(today, DateExt.advance(today, maturity + 1, TimeUnit.Years)));
        const jointProcess = new HybridHestonHullWhiteProcess(hestonProcess, hwProcess, -0.4);
        const schedule = new Schedule().init2(today, DateExt.advance(today, maturity, TimeUnit.Years), new Period().init1(1, TimeUnit.Years), new TARGET(), BusinessDayConvention.Following, BusinessDayConvention.Following, DateGeneration.Rule.Forward, false);
        const times = schedule.dates().map(d => dc.yearFraction(today, d));
        for (let i = 0; i <= maturity; ++i) {
            times[i] = i;
        }
        const grid = new TimeGrid().init2(times, 0, times.length);
        const redemption = new Array(maturity);
        for (let i = 0; i < maturity; ++i) {
            redemption[i] = 1.07 + 0.03 * i;
        }
        const seed = 42;
        const rsg = new PseudoRandom().make_sequence_generator(jointProcess.factors() * (grid.size() - 1), seed);
        const generator = new MultiPathGenerator().init2(jointProcess, grid, rsg, false);
        const stat = new GeneralStatistics();
        let antitheticPayoff = 0;
        const nrTrails = 40000;
        for (let i = 0; i < nrTrails; ++i) {
            const antithetic = (i % 2) === 0 ? false : true;
            const path = antithetic ? generator.antithetic() : generator.next();
            let payoff = 0;
            for (let j = 1; j <= maturity; ++j) {
                if (path.value.at(0).at(j) > spot.currentLink().value()) {
                    const states = new Array(3);
                    for (let k = 0; k < 3; ++k) {
                        states[k] = path.value.at(k).at(j);
                    }
                    payoff =
                        redemption[j - 1] / jointProcess.numeraire(grid.at(j), states);
                    break;
                }
                else if (j === maturity) {
                    const states = new Array(3);
                    for (let k = 0; k < 3; ++k) {
                        states[k] = path.value.at(k).at(j);
                    }
                    payoff = 1.0 / jointProcess.numeraire(grid.at(j), states);
                }
            }
            if (antithetic) {
                stat.add(0.5 * (antitheticPayoff + payoff));
            }
            else {
                antitheticPayoff = payoff;
            }
        }
        const expected = 0.938;
        const calculated = stat.mean();
        const error = stat.errorEstimate();
        expect(Math.abs(expected - calculated)).toBeLessThan(3 * error);
        backup.dispose();
    });

    it('Testing the discretization error of the Heston Hull-White process...', () => {
        const backup = new SavedSettings();
        const dc = new Actual360();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dates = [];
        const rates = [], divRates = [];
        for (let i = 0; i <= 31; ++i) {
            dates.push(DateExt.advance(today, i, TimeUnit.Years));
            rates.push(0.04 + 0.0001 * Math.exp(Math.sin(i)));
            divRates.push(0.04 + 0.0001 * Math.exp(Math.sin(i)));
        }
        const maturity = DateExt.advance(today, 10, TimeUnit.Years);
        const v = 0.25;
        const s0 = new Handle(new SimpleQuote(100));
        const vol = new SimpleQuote(v);
        const volTS = new Handle(flatVol1(today, vol, dc));
        const rTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dc));
        const qTS = new Handle(new ZeroCurve().curveInit1(dates, divRates, dc));
        const bsmProcess = new BlackScholesMertonProcess(s0, qTS, rTS, volTS);
        const hestonProcess = new HestonProcess(rTS, qTS, s0, v * v, 1, v * v, 1e-6, -0.4);
        const hwProcess = new HullWhiteForwardProcess(rTS, 0.01, 0.01);
        hwProcess.setForwardMeasureTime(20.1472222222222222);
        const tol = 0.05;
        const corr = [-0.85, 0.5];
        const strike = [50, 100, 125];
        for (let i = 0; i < corr.length; ++i) {
            for (let j = 0; j < strike.length; ++j) {
                const payoff = new PlainVanillaPayoff(Option.Type.Put, strike[j]);
                const exercise = new EuropeanExercise(maturity);
                const optionBsmHW = new VanillaOption(payoff, exercise);
                const hwModel = new HullWhite(rTS, hwProcess.a(), hwProcess.sigma());
                optionBsmHW.setPricingEngine(new AnalyticBSMHullWhiteEngine(corr[i], bsmProcess, hwModel));
                const expected = optionBsmHW.NPV();
                const optionHestonHW = new VanillaOption(payoff, exercise);
                const jointProcess = new HybridHestonHullWhiteProcess(hestonProcess, hwProcess, corr[i]);
                optionHestonHW.setPricingEngine(new MakeMCHestonHullWhiteEngine(new PseudoRandom())
                    .mmchhweInit(jointProcess)
                    .withSteps(1)
                    .withAntitheticVariate()
                    .withAbsoluteTolerance(tol)
                    .withSeed(42)
                    .f());
                const calculated = optionHestonHW.NPV();
                const error = optionHestonHW.errorEstimate();
                expect(Math.abs(calculated - expected)).toBeLessThan(3 * error);
                expect(Math.abs(calculated - expected)).toBeLessThan(1e-5);
            }
        }
        backup.dispose();
    });

    it('Testing the FDM Heston Hull-White engine...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('28,March,2004');
        Settings.evaluationDate.set(today);
        const exerciseDate = DateExt.UTC('28,March,2012');
        const dc = new Actual365Fixed();
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, dc));
        const qTS = new Handle(flatRate4(0.02, dc));
        const vol = 0.30;
        const volTS = new Handle(flatVol4(vol, dc));
        const v0 = vol * vol;
        const hestonProcess = new HestonProcess(rTS, qTS, s0, v0, 1.0, v0, 0.000001, 0.0);
        const stochProcess = new BlackScholesMertonProcess(s0, qTS, rTS, volTS);
        const hwProcess = new HullWhiteProcess(rTS, 0.00883, 0.01);
        const hwModel = new HullWhite(rTS, hwProcess.a(), hwProcess.sigma());
        const exercise = new EuropeanExercise(exerciseDate);
        const corr = [-0.85, 0.5];
        const strike = [75, 120, 160];
        for (let i = 0; i < corr.length; ++i) {
            for (let j = 0; j < strike.length; ++j) {
                const payoff = new PlainVanillaPayoff(Option.Type.Call, strike[j]);
                const option = new VanillaOption(payoff, exercise);
                option.setPricingEngine(new FdHestonHullWhiteVanillaEngine(new HestonModel(hestonProcess), hwProcess, corr[i], 50, 200, 10, 15));
                const calculated = option.NPV();
                const calculatedDelta = option.delta();
                const calculatedGamma = option.gamma();
                option.setPricingEngine(new AnalyticBSMHullWhiteEngine(corr[i], stochProcess, hwModel));
                const expected = option.NPV();
                const expectedDelta = option.delta();
                const expectedGamma = option.gamma();
                const npvTol = 0.01;
                expect(Math.abs(calculated - expected)).toBeLessThan(npvTol);
                const deltaTol = 0.001;
                expect(Math.abs(calculatedDelta - expectedDelta))
                    .toBeLessThan(deltaTol);
                const gammaTol = 0.001;
                expect(Math.abs(calculatedGamma - expectedGamma))
                    .toBeLessThan(gammaTol);
            }
        }
        backup.dispose();
    });

    it('Testing convergence speed of Heston-Hull-White engine...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('27,December,2004');
        Settings.evaluationDate.set(today);
        const maturity = 5.0;
        const equityIrCorr = -0.4;
        const strikes = [75, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150];
        const listOfTimeStepsPerYear = [20];
        const hestonModelData = new HestonModelData('BSM-HW Model', 0.09, 1.0, 0.09, QL_EPSILON, 0.0, 0.04, 0.03);
        const hwModelData = hullWhiteModels[0];
        const controlVariate = [true, false];
        const hp = makeHestonProcess(hestonModelData);
        const hestonModel = new HestonModel(hp);
        const hwProcess = new HullWhiteProcess(hp.riskFreeRate(), hwModelData.a, hwModelData.sigma);
        const hullWhiteModel = new HullWhite(hp.riskFreeRate(), hwProcess.a(), hwProcess.sigma());
        const bsmProcess = new BlackScholesMertonProcess(hp.s0(), hp.dividendYield(), hp.riskFreeRate(), new Handle(flatVol2(today, Math.sqrt(hestonModelData.theta), hp.riskFreeRate().currentLink().dayCounter())));
        const bsmhwEngine = new AnalyticBSMHullWhiteEngine(equityIrCorr, bsmProcess, hullWhiteModel);
        const tolWithCV = [2e-4, 2e-4, 2e-4, 2e-4, 0.01];
        for (let l = 0; l < schemes.length; ++l) {
            const scheme = schemes[l];
            for (let i = 0; i < controlVariate.length; ++i) {
                for (let u = 0; u < listOfTimeStepsPerYear.length; ++u) {
                    const tSteps = Math.floor(maturity * listOfTimeStepsPerYear[u]);
                    const fdEngine = new FdHestonHullWhiteVanillaEngine(hestonModel, hwProcess, equityIrCorr, tSteps, 400, 2, 10, 0, controlVariate[i], scheme.schemeDesc);
                    fdEngine.enableMultipleStrikesCaching(Array.from(strikes));
                    let avgPriceDiff = 0.0;
                    for (let k = 0; k < strikes.length; ++k) {
                        const optionData = new VanillaOptionData(strikes[k], maturity, Option.Type.Call);
                        const option = makeVanillaOption(optionData);
                        option.setPricingEngine(bsmhwEngine);
                        const expected = option.NPV();
                        option.setPricingEngine(fdEngine);
                        const calculated = option.NPV();
                        avgPriceDiff += Math.abs(expected - calculated) / strikes.length;
                    }
                    if (controlVariate[i]) {
                        expect(tolWithCV[l]).toBeLessThan(avgPriceDiff);
                    }
                    else {
                        expect(tolWithCV[l]).toBeLessThan(avgPriceDiff);
                    }
                }
            }
        }
        backup.dispose();
    });

    it('Testing spatial convergence speed of Heston engine...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('27,December,2004');
        Settings.evaluationDate.set(today);
        const maturity = 1.0;
        const strikes = [75, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150];
        const listOfTimeStepsPerYear = [40];
        const tol = [0.02, 0.02, 0.02, 0.02, 0.05];
        for (let u = 0; u < listOfTimeStepsPerYear.length; ++u) {
            for (let i = 0; i < schemes.length; ++i) {
                for (let j = 0; j < hestonModels.length; ++j) {
                    let avgPriceDiff = 0;
                    const hestonProcess = makeHestonProcess(hestonModels[j]);
                    const hestonModel = new HestonModel(hestonProcess);
                    const analyticEngine = new AnalyticHestonEngine().aheInit2(hestonModel, 172);
                    const tSteps = Math.floor(maturity * listOfTimeStepsPerYear[u]);
                    const fdEngine = new FdHestonVanillaEngine(hestonModel, tSteps, 200, 40, 0, schemes[i].schemeDesc);
                    fdEngine.enableMultipleStrikesCaching(Array.from(strikes));
                    for (let k = 0; k < strikes.length; ++k) {
                        const optionData = new VanillaOptionData(strikes[k], maturity, Option.Type.Call);
                        const option = makeVanillaOption(optionData);
                        option.setPricingEngine(analyticEngine);
                        const expected = option.NPV();
                        option.setPricingEngine(fdEngine);
                        const calculated = option.NPV();
                        avgPriceDiff += Math.abs(expected - calculated) / strikes.length;
                    }
                    expect(avgPriceDiff).toBeLessThan(tol[i]);
                }
            }
        }
        backup.dispose();
    });

    it('Testing the Heston Hull-White calibration...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const calendar = new TARGET();
        const today = DateExt.UTC('28,March,2004');
        Settings.evaluationDate.set(today);
        const rTS = new Handle(flatRate4(0.05, dc));
        const hwProcess = new HullWhiteProcess(rTS, 0.00883, 0.00631);
        const hullWhiteModel = new HullWhite(rTS, hwProcess.a(), hwProcess.sigma());
        const qTS = new Handle(flatRate4(0.02, dc));
        const s0 = new Handle(new SimpleQuote(100.0));
        const start_v0 = 0.2 * 0.2;
        const start_theta = start_v0;
        const start_kappa = 0.5;
        const start_sigma = 0.25;
        const start_rho = -0.5;
        const hestonProcess = new HestonProcess(rTS, qTS, s0, start_v0, start_kappa, start_theta, start_sigma, start_rho);
        const analyticHestonModel = new HestonModel(hestonProcess);
        const analyticHestonEngine = new AnalyticHestonEngine().aheInit2(analyticHestonModel, 164);
        const fdmHestonModel = new HestonModel(hestonProcess);
        const equityShortRateCorr = -0.5;
        const strikes = [50, 75, 90, 100, 110, 125, 150, 200];
        const maturities = [1 / 12., 3 / 12., 0.5, 1.0, 2.0, 3.0, 5.0, 7.5, 10];
        const vol = [
            0.482627, 0.407617, 0.366682, 0.340110, 0.314266, 0.280241, 0.252471,
            0.325552, 0.464811, 0.393336, 0.354664, 0.329758, 0.305668, 0.273563,
            0.244024, 0.244886, 0.441864, 0.375618, 0.340464, 0.318249, 0.297127,
            0.268839, 0.237972, 0.225553, 0.407506, 0.351125, 0.322571, 0.305173,
            0.289034, 0.267361, 0.239315, 0.213761, 0.366761, 0.326166, 0.306764,
            0.295279, 0.284765, 0.270592, 0.250702, 0.222928, 0.345671, 0.314748,
            0.300259, 0.291744, 0.283971, 0.273475, 0.258503, 0.235683, 0.324512,
            0.303631, 0.293981, 0.288338, 0.283193, 0.276248, 0.266271, 0.250506,
            0.311278, 0.296340, 0.289481, 0.285482, 0.281840, 0.276924, 0.269856,
            0.258609, 0.303219, 0.291534, 0.286187, 0.283073, 0.280239, 0.276414,
            0.270926, 0.262173
        ];
        let options = [];
        for (let i = 0; i < maturities.length; ++i) {
            const maturity = new Period().init1(Math.floor(maturities[i] * 12.0 + 0.5), TimeUnit.Months);
            const exercise = new EuropeanExercise(DateExt.addPeriod(today, maturity));
            for (let j = 0; j < strikes.length; ++j) {
                const payoff = new PlainVanillaPayoff(strikes[j] * rTS.currentLink().discount2(maturities[i]) >=
                    s0.currentLink().value() *
                        qTS.currentLink().discount2(maturities[i]) ?
                    Option.Type.Call :
                    Option.Type.Put, strikes[j]);
                const v = new RelinkableHandle(new SimpleQuote(vol[i * strikes.length + j]));
                options.push(new HestonModelHelper().hmhInit2(maturity, calendar, s0, strikes[j], v, rTS, qTS, BlackCalibrationHelper.CalibrationErrorType.PriceError));
                const marketValue = Array1D.back(options).marketValue();
                const volQuote = new SimpleQuote();
                const bsProcess = ImpliedVolatilityHelper.clone(new GeneralizedBlackScholesProcess().init1(s0, qTS, rTS, new Handle(flatVol4(v.currentLink().value(), dc))), volQuote);
                const dummyOption = new VanillaOption(payoff, exercise);
                const bshwEngine = new AnalyticBSMHullWhiteEngine(equityShortRateCorr, bsProcess, hullWhiteModel);
                const vt = ImpliedVolatilityHelper.calculate(dummyOption, bshwEngine, volQuote, marketValue, 1e-8, 100, 0.0001, 10);
                v.linkTo(new SimpleQuote(vt));
                Array1D.back(options).setPricingEngine(analyticHestonEngine);
            }
        }
        const corrConstraint = new HestonHullWhiteCorrelationConstraint(equityShortRateCorr);
        const om = new LevenbergMarquardt(1e-6, 1e-8, 1e-8);
        analyticHestonModel.calibrate1(options, om, new EndCriteria(400, 40, 1.0e-8, 1.0e-4, 1.0e-8), corrConstraint);
        options = [];
        fdmHestonModel.setParams(analyticHestonModel.params());
        for (let i = 0; i < maturities.length; ++i) {
            const tGrid = Math.floor(Math.max(5.0, maturities[i] * 5.0));
            const engine = new FdHestonHullWhiteVanillaEngine(fdmHestonModel, hwProcess, equityShortRateCorr, tGrid, 45, 11, 5, 0, true);
            engine.enableMultipleStrikesCaching(Array.from(strikes));
            const maturity = new Period().init1(Math.floor(maturities[i] * 12.0 + 0.5), TimeUnit.Months);
            for (let j = 0; j < strikes.length; ++j) {
                const js = (j + (strikes.length - 1) / 2) % strikes.length;
                const v = new Handle(new SimpleQuote(vol[i * strikes.length + js]));
                options.push(new HestonModelHelper().hmhInit2(maturity, calendar, s0, strikes[js], v, rTS, qTS, BlackCalibrationHelper.CalibrationErrorType.PriceError));
                Array1D.back(options).setPricingEngine(engine);
            }
        }
        const vm = new LevenbergMarquardt(1e-6, 1e-2, 1e-2);
        fdmHestonModel.calibrate1(options, vm, new EndCriteria(400, 40, 1.0e-8, 1.0e-4, 1.0e-8), corrConstraint);
        const relTol = 0.01;
        const expected_v0 = 0.12;
        const expected_kappa = 2.0;
        const expected_theta = 0.09;
        const expected_sigma = 0.5;
        const expected_rho = -0.75;
        expect(Math.abs(fdmHestonModel.v0() - expected_v0) / expected_v0)
            .toBeLessThan(relTol);
        expect(Math.abs(fdmHestonModel.theta() - expected_theta) / expected_theta)
            .toBeLessThan(relTol);
        expect(Math.abs(fdmHestonModel.kappa() - expected_kappa) / expected_kappa)
            .toBeLessThan(relTol);
        expect(Math.abs(fdmHestonModel.sigma() - expected_sigma) / expected_sigma)
            .toBeLessThan(relTol);
        expect(Math.abs(fdmHestonModel.rho() - expected_rho) / expected_rho)
            .toBeLessThan(relTol);
        backup.dispose();
    });

    it('Testing H1HWEngine...', () => {
        const backup = new SavedSettings();
        const today = DateExt.UTC('15,July,2012');
        Settings.evaluationDate.set(today);
        const exerciseDate = DateExt.UTC('13,July,2022');
        const dc = new Actual365Fixed();
        const exercise = new EuropeanExercise(exerciseDate);
        const s0 = new Handle(new SimpleQuote(100.0));
        const r = 0.02;
        const q = 0.00;
        const v0 = 0.05;
        const theta = 0.05;
        const kappa_v = 0.3;
        const sigma_v = [0.3, 0.6];
        const rho_sv = -0.30;
        const rho_sr = 0.6;
        const kappa_r = 0.01;
        const sigma_r = 0.01;
        const rTS = new Handle(flatRate2(today, r, dc));
        const qTS = new Handle(flatRate2(today, q, dc));
        const flatVolTS = new Handle(flatVol2(today, 0.20, dc));
        const bsProcess = new GeneralizedBlackScholesProcess().init1(s0, qTS, rTS, flatVolTS);
        const hullWhiteModel = new HullWhite(rTS, kappa_r, sigma_r);
        const tol = 0.0001;
        const strikes = [40, 80, 100, 120, 180];
        const expected = [
            [0.267503, 0.235742, 0.228223, 0.223461, 0.217855],
            [0.263626, 0.211625, 0.199907, 0.193502, 0.190025]
        ];
        for (let j = 0; j < sigma_v.length; ++j) {
            const hestonProcess = new HestonProcess(rTS, qTS, s0, v0, kappa_v, theta, sigma_v[j], rho_sv);
            const hestonModel = new HestonModel(hestonProcess);
            for (let i = 0; i < strikes.length; ++i) {
                const payoff = new PlainVanillaPayoff(Option.Type.Call, strikes[i]);
                const option = new VanillaOption(payoff, exercise);
                const analyticH1HWEngine = new AnalyticH1HWEngine().ah1hweInit1(hestonModel, hullWhiteModel, rho_sr, 144);
                option.setPricingEngine(analyticH1HWEngine);
                const impliedH1HW = option.impliedVolatility(option.NPV(), bsProcess);
                expect(Math.abs(expected[j][i] - impliedH1HW)).toBeLessThan(tol);
            }
        }
        backup.dispose();
    });
});
