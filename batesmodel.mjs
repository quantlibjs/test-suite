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
import { Actual365Fixed, ActualActual, Array1D, BatesDetJumpEngine, BatesDetJumpModel, BatesDoubleExpDetJumpEngine, BatesDoubleExpDetJumpModel, BatesDoubleExpEngine, BatesDoubleExpModel, BatesEngine, BatesModel, BatesProcess, BlackCalibrationHelper, blackFormula1, DateExt, EndCriteria, EuropeanExercise, EuropeanOption, FdBatesVanillaEngine, Handle, HestonModelHelper, HestonProcess, JumpDiffusionEngine, LevenbergMarquardt, MakeMCEuropeanHestonEngine, Merton76Process, Option, Period, PlainVanillaPayoff, PseudoRandom, SavedSettings, Settings, SimpleQuote, TARGET, TimeUnit, VanillaOption, ZeroCurve, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4, flatVol1 } from '/test-suite/utilities.mjs';

function getCalibrationError(options) {
    let sse = 0;
    for (let i = 0; i < options.length; ++i) {
        const diff = options[i].calibrationError() * 100.0;
        sse += diff * diff;
    }
    return sse;
}

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
    new HestonModelData('Ikonen-Toivanen', 0.0625, 5, 0.16, 0.9, 0.1, 0.1, 0.0),
    new HestonModelData('Kahl-Jaeckel', 0.16, 1.0, 0.16, 2.0, -0.8, 0.0, 0.0),
    new HestonModelData('Equity case', 0.07, 2.0, 0.04, 0.55, -0.8, 0.03, 0.035),
];

describe(`Bates model tests ${version}`, () => {
    it('Testing analytic Bates engine against Black formula...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC();
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = DateExt.advance(settlementDate, 6, TimeUnit.Months);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 30);
        const exercise = new EuropeanExercise(exerciseDate);
        const riskFreeTS = new Handle(flatRate4(0.1, dayCounter));
        const dividendTS = new Handle(flatRate4(0.04, dayCounter));
        const s0 = new Handle(new SimpleQuote(32.0));
        const yearFraction = dayCounter.yearFraction(settlementDate, exerciseDate);
        const forwardPrice = s0.currentLink().value() * Math.exp((0.1 - 0.04) * yearFraction);
        const expected = blackFormula1(payoff.optionType(), payoff.strike(), forwardPrice, Math.sqrt(0.05 * yearFraction)) *
            Math.exp(-0.1 * yearFraction);
        const v0 = 0.05;
        const kappa = 5.0;
        const theta = 0.05;
        const sigma = 1.0e-4;
        const rho = 0.0;
        const lambda = 0.0001;
        const nu = 0.0;
        const delta = 0.0001;
        const option = new VanillaOption(payoff, exercise);
        const process = new BatesProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho, lambda, nu, delta);
        let engine = new BatesEngine().beInit1(new BatesModel(process), 64);
        option.setPricingEngine(engine);
        let calculated = option.NPV();
        const tolerance = 2.0e-7;
        let error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(tolerance);
        engine = new BatesDetJumpEngine().bdjeInit1(new BatesDetJumpModel(process, 1.0, 0.0001), 64);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(tolerance);
        engine = new BatesDoubleExpEngine().bdeeInit1(new BatesDoubleExpModel(process, 0.0001, 0.0001, 0.0001), 64);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(tolerance);
        engine = new BatesDoubleExpDetJumpEngine().bdedjeInit1(new BatesDoubleExpDetJumpModel(process, 0.0001, 0.0001, 0.0001, 0.5, 1.0, 0.0001), 64);
        option.setPricingEngine(engine);
        calculated = option.NPV();
        error = Math.abs(calculated - expected);
        expect(error).toBeLessThan(tolerance);
        backup.dispose();
    });

    it('Testing analytic Bates engine against Merton-76 engine...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC();
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 95);
        const riskFreeTS = new Handle(flatRate4(0.1, dayCounter));
        const dividendTS = new Handle(flatRate4(0.04, dayCounter));
        const s0 = new Handle(new SimpleQuote(100));
        const v0 = 0.0433;
        const vol = new SimpleQuote(Math.sqrt(v0));
        const volTS = flatVol1(settlementDate, vol, dayCounter);
        const kappa = 0.5;
        const theta = v0;
        const sigma = 1.0e-4;
        const rho = 0.0;
        const jumpIntensity = new SimpleQuote(2);
        const meanLogJump = new SimpleQuote(-0.2);
        const jumpVol = new SimpleQuote(0.2);
        const batesProcess = new BatesProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho, jumpIntensity.value(), meanLogJump.value(), jumpVol.value());
        const mertonProcess = new Merton76Process(s0, dividendTS, riskFreeTS, new Handle(volTS), new Handle(jumpIntensity), new Handle(meanLogJump), new Handle(jumpVol));
        const batesEngine = new BatesEngine().beInit1(new BatesModel(batesProcess), 160);
        const mcTol = 0.1;
        const mcBatesEngine = new MakeMCEuropeanHestonEngine(new PseudoRandom(), batesProcess)
            .withStepsPerYear(2)
            .withAntitheticVariate()
            .withAbsoluteTolerance(mcTol)
            .withSeed(1234)
            .f();
        const mertonEngine = new JumpDiffusionEngine(mertonProcess, 1e-10, 1000);
        for (let i = 1; i <= 5; i += 2) {
            const exerciseDate = DateExt.advance(settlementDate, i, TimeUnit.Years);
            const exercise = new EuropeanExercise(exerciseDate);
            const batesOption = new VanillaOption(payoff, exercise);
            batesOption.setPricingEngine(batesEngine);
            const calculated = batesOption.NPV();
            batesOption.setPricingEngine(mcBatesEngine);
            const mcCalculated = batesOption.NPV();
            const mertonOption = new EuropeanOption(payoff, exercise);
            mertonOption.setPricingEngine(mertonEngine);
            const expected = mertonOption.NPV();
            const tolerance = 2e-8;
            const relError = Math.abs(calculated - expected) / expected;
            expect(relError).toBeLessThan(tolerance);
            const mcError = Math.abs(expected - mcCalculated);
            expect(mcError).toBeLessThan(3 * mcTol);
        }
        backup.dispose();
    });

    it('Testing analytic Bates engine against Monte-Carlo engine...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC('30,March,2007');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const exerciseDate = DateExt.UTC('30,March,2012');
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 100);
        const exercise = new EuropeanExercise(exerciseDate);
        for (let i = 0; i < hestonModels.length; ++i) {
            const riskFreeTS = new Handle(flatRate4(hestonModels[i].r, dayCounter));
            const dividendTS = new Handle(flatRate4(hestonModels[i].q, dayCounter));
            const s0 = new Handle(new SimpleQuote(100));
            const batesProcess = new BatesProcess(riskFreeTS, dividendTS, s0, hestonModels[i].v0, hestonModels[i].kappa, hestonModels[i].theta, hestonModels[i].sigma, hestonModels[i].rho, 2.0, -0.2, 0.1);
            const mcTolerance = 0.5;
            const mcEngine = new MakeMCEuropeanHestonEngine(new PseudoRandom(), batesProcess)
                .withStepsPerYear(20)
                .withAntitheticVariate()
                .withAbsoluteTolerance(mcTolerance)
                .withSeed(1234)
                .f();
            const batesModel = new BatesModel(batesProcess);
            const fdEngine = new FdBatesVanillaEngine(batesModel, 50, 100, 30);
            const analyticEngine = new BatesEngine().beInit1(batesModel, 160);
            const option = new VanillaOption(payoff, exercise);
            option.setPricingEngine(mcEngine);
            const calculated = option.NPV();
            option.setPricingEngine(analyticEngine);
            const expected = option.NPV();
            option.setPricingEngine(fdEngine);
            const fdCalculated = option.NPV();
            const mcError = Math.abs(calculated - expected);
            expect(mcError).toBeLessThan(3 * mcTolerance);
            const fdTolerance = 0.2;
            const fdError = Math.abs(fdCalculated - expected);
            expect(fdError).toBeLessThan(fdTolerance);
        }
        backup.dispose();
    });

    it('Testing Bates model calibration using DAX volatility data...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC('5,July,2002');
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new Actual365Fixed();
        const calendar = new TARGET();
        const t = [13, 41, 75, 165, 256, 345, 524, 703];
        const r = [0.0357, 0.0349, 0.0341, 0.0355, 0.0359, 0.0368, 0.0386, 0.0401];
        const dates = [];
        const rates = [];
        dates.push(settlementDate);
        rates.push(0.0357);
        for (let i = 0; i < 8; ++i) {
            dates.push(DateExt.add(settlementDate, t[i]));
            rates.push(r[i]);
        }
        const riskFreeTS = new Handle(new ZeroCurve().curveInit1(dates, rates, dayCounter));
        const dividendTS = new Handle(flatRate2(settlementDate, 0.0, dayCounter));
        const v = [
            0.6625, 0.4875, 0.4204, 0.3667, 0.3431, 0.3267, 0.3121, 0.3121, 0.6007,
            0.4543, 0.3967, 0.3511, 0.3279, 0.3154, 0.2984, 0.2921, 0.5084, 0.4221,
            0.3718, 0.3327, 0.3155, 0.3027, 0.2919, 0.2889, 0.4541, 0.3869, 0.3492,
            0.3149, 0.2963, 0.2926, 0.2819, 0.2800, 0.4060, 0.3607, 0.3330, 0.2999,
            0.2887, 0.2811, 0.2751, 0.2775, 0.3726, 0.3396, 0.3108, 0.2781, 0.2788,
            0.2722, 0.2661, 0.2686, 0.3550, 0.3277, 0.3012, 0.2781, 0.2781, 0.2661,
            0.2661, 0.2681, 0.3428, 0.3209, 0.2958, 0.2740, 0.2688, 0.2627, 0.2580,
            0.2620, 0.3302, 0.3062, 0.2799, 0.2631, 0.2573, 0.2533, 0.2504, 0.2544,
            0.3343, 0.2959, 0.2705, 0.2540, 0.2504, 0.2464, 0.2448, 0.2462, 0.3460,
            0.2845, 0.2624, 0.2463, 0.2425, 0.2385, 0.2373, 0.2422, 0.3857, 0.2860,
            0.2578, 0.2399, 0.2357, 0.2327, 0.2312, 0.2351, 0.3976, 0.2860, 0.2607,
            0.2356, 0.2297, 0.2268, 0.2241, 0.2320
        ];
        const s0 = new Handle(new SimpleQuote(4468.17));
        const strike = [
            3400, 3600, 3800, 4000, 4200, 4400, 4500, 4600, 4800, 5000, 5200, 5400,
            5600
        ];
        const v0 = 0.0433;
        const kappa = 1.0;
        const theta = v0;
        const sigma = 1.0;
        const rho = 0.0;
        const lambda = 1.1098;
        const nu = -0.1285;
        const delta = 0.1702;
        let process = new BatesProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho, lambda, nu, delta);
        const batesModel = new BatesModel(process);
        const batesEngine = new BatesEngine().beInit1(batesModel, 64);
        const options = [];
        for (let s = 0; s < 13; ++s) {
            for (let m = 0; m < 8; ++m) {
                const vol = new Handle(new SimpleQuote(v[s * 8 + m]));
                const maturity = new Period().init1(Math.floor((t[m] + 3) / 7.), TimeUnit.Weeks);
                options.push(new HestonModelHelper().hmhInit1(maturity, calendar, s0.currentLink().value(), strike[s], vol, riskFreeTS, dividendTS, BlackCalibrationHelper.CalibrationErrorType.ImpliedVolError));
                Array1D.back(options).setPricingEngine(batesEngine);
            }
        }
        const om = new LevenbergMarquardt();
        batesModel.calibrate(options, om, new EndCriteria(400, 40, 1.0e-8, 1.0e-8, 1.0e-8));
        const expected = 36.6;
        const calculated = getCalibrationError(options);
        expect(Math.abs(calculated - expected)).toBeLessThan(2.5);
        const pricingEngines = [];
        process = new BatesProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho, 1.0, -0.1, 0.1);
        pricingEngines.push(new BatesDetJumpEngine().bdjeInit1(new BatesDetJumpModel(process), 64));
        const hestonProcess = new HestonProcess(riskFreeTS, dividendTS, s0, v0, kappa, theta, sigma, rho);
        pricingEngines.push(new BatesDoubleExpEngine().bdeeInit1(new BatesDoubleExpModel(hestonProcess, 1.0), 64));
        pricingEngines.push(new BatesDoubleExpDetJumpEngine().bdedjeInit1(new BatesDoubleExpDetJumpModel(hestonProcess, 1.0), 64));
        const expectedValues = [5896.37, 5499.29, 6497.89];
        const tolerance = 0.1;
        for (let i = 0; i < pricingEngines.length; ++i) {
            for (let j = 0; j < options.length; ++j) {
                options[j].setPricingEngine(pricingEngines[i]);
            }
            const calculated = Math.abs(getCalibrationError(options));
            expect(Math.abs(calculated - expectedValues[i])).toBeLessThan(tolerance);
        }
        backup.dispose();
    });
});
