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
import { Actual360, Actual365Fixed, AmericanExercise, AnalyticBarrierEngine, AnalyticEuropeanEngine, AnalyticHestonEngine, Barrier, BarrierOption, BlackScholesMertonProcess, DateExt, DividendVanillaOption, EuropeanExercise, FdHestonBarrierEngine, FdHestonVanillaEngine, FdmHestonSolver, FdmHestonVarianceMesher, FdmSchemeDesc, FlatForward, GeneralizedBlackScholesProcess, Handle, HestonModel, HestonProcess, Month, Option, PlainVanillaPayoff, QL_MIN_REAL, RelinkableHandle, SavedSettings, Settings, SimpleQuote, TimeUnit, VanillaOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate3, flatRate4, flatVol2, flatVol3 } from '/test-suite/utilities.mjs';

class NewBarrierOptionData {
    constructor(barrierType, barrier, rebate, type, strike, s, q, r, t, v) {
        this.barrierType = barrierType;
        this.barrier = barrier;
        this.rebate = rebate;
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
    }
}

class HestonTestData {
    constructor(kappa, theta, sigma, rho, r, q, T, K) {
        this.kappa = kappa;
        this.theta = theta;
        this.sigma = sigma;
        this.rho = rho;
        this.r = r;
        this.q = q;
        this.T = T;
        this.K = K;
    }
}

describe(`Finite Difference Heston tests ${version}`, () => {
    it('Testing FDM Heston variance mesher ...', () => {
        const backup = new SavedSettings();
        const today = new Date('22-February-2018');
        const dc = new Actual365Fixed();
        Settings.evaluationDate.set(today);
        const process = new HestonProcess(new Handle(flatRate4(0.02, dc)), new Handle(flatRate4(0.02, dc)), new Handle(new SimpleQuote(100.0)), 0.09, 1.0, 0.09, 0.2, -0.5);
        const locations = new FdmHestonVarianceMesher(5, process, 1.0).locations();
        const expected = [0.0, 6.652314e-02, 9.000000e-02, 1.095781e-01, 2.563610e-01];
        const tol = 1e-6;
        for (let i = 0; i < locations.length; ++i) {
            const diff = Math.abs(expected[i] - locations[i]);
            expect(diff).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing FDM Heston variance mesher ...', () => {
        const backup = new SavedSettings();
        const values = [
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 100, 100.0, 0.00, 0.08, 1.00, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, 90, 100.0, 0.00, 0.08, 0.25, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, 90, 100.0, 0.00, 0.08, 0.25, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, 100, 100.0, 0.00, 0.08, 0.40, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.15),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 100, 100.0, 0.00, 0.08, 0.40, 0.35),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.15),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Call, 110, 100.0, 0.00, 0.00, 1.00, 0.20),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Call, 110, 100.0, 0.00, 0.08, 1.00, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Call, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.25),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, 110, 100.0, 0.00, 0.04, 1.00, 0.15),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 95.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownOut, 100.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpOut, 105.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 95.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.DownIn, 100.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 1.00, 0.15),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, 90, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, 100, 100.0, 0.04, 0.08, 0.50, 0.30),
            new NewBarrierOptionData(Barrier.Type.UpIn, 105.0, 3.0, Option.Type.Put, 110, 100.0, 0.04, 0.08, 0.50, 0.30)
        ];
        const dc = new Actual365Fixed();
        const todaysDate = new Date('28-March-2004');
        Settings.evaluationDate.set(todaysDate);
        const spot = new Handle(new SimpleQuote(0.0));
        const qRate = new SimpleQuote(0.0);
        const qTS = new Handle(flatRate3(qRate, dc));
        const rRate = new SimpleQuote(0.0);
        const rTS = new Handle(flatRate3(rRate, dc));
        const vol = new SimpleQuote(0.0);
        const volTS = new Handle(flatVol3(vol, dc));
        const bsProcess = new BlackScholesMertonProcess(spot, qTS, rTS, volTS);
        const analyticEngine = new AnalyticBarrierEngine(bsProcess);
        for (let i = 0; i < values.length; i++) {
            const exDate = DateExt.add(todaysDate, Math.floor(values[i].t * 365 + 0.5));
            const exercise = new EuropeanExercise(exDate);
            spot.currentLink().setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const barrierOption = new BarrierOption(values[i].barrierType, values[i].barrier, values[i].rebate, payoff, exercise);
            const v0 = vol.value() * vol.value();
            const hestonProcess = new HestonProcess(rTS, qTS, spot, v0, 1.0, v0, 0.005, 0.0);
            barrierOption.setPricingEngine(new FdHestonBarrierEngine(new HestonModel(hestonProcess), 200, 101, 3));
            const calculatedHE = barrierOption.NPV();
            barrierOption.setPricingEngine(analyticEngine);
            const expected = barrierOption.NPV();
            const tol = 0.0025;
            expect(Math.abs(calculatedHE - expected) / expected).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing FDM with barrier option for Heston model ' +
        'vs Black-Scholes model...', () => {
        const backup = new SavedSettings();
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, new Actual365Fixed()));
        const qTS = new Handle(flatRate4(0.0, new Actual365Fixed()));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.04, 2.5, 0.04, 0.66, -0.8);
        Settings.evaluationDate.set(new Date('28-March-2004'));
        const exerciseDate = new Date('28-March-2005');
        const exercise = new EuropeanExercise(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 100);
        const barrierOption = new BarrierOption(Barrier.Type.UpOut, 135, 0.0, payoff, exercise);
        barrierOption.setPricingEngine(new FdHestonBarrierEngine(new HestonModel(hestonProcess), 50, 400, 100));
        const tol = 0.01;
        const npvExpected = 9.1530;
        const deltaExpected = 0.5218;
        const gammaExpected = -0.0354;
        expect(Math.abs(barrierOption.NPV() - npvExpected)).toBeLessThan(tol);
        expect(Math.abs(barrierOption.delta() - deltaExpected))
            .toBeLessThan(tol);
        expect(Math.abs(barrierOption.gamma() - gammaExpected))
            .toBeLessThan(tol);
        backup.dispose();
    });

    it('Testing FDM with American option in Heston model...', () => {
        const backup = new SavedSettings();
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, new Actual365Fixed()));
        const qTS = new Handle(flatRate4(0.0, new Actual365Fixed()));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.04, 2.5, 0.04, 0.66, -0.8);
        Settings.evaluationDate.set(new Date('28-March-2004'));
        const exerciseDate = new Date('28-March-2005');
        const exercise = new AmericanExercise().init2(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 100);
        const option = new VanillaOption(payoff, exercise);
        const engine = new FdHestonVanillaEngine(new HestonModel(hestonProcess), 200, 100, 50);
        option.setPricingEngine(engine);
        const tol = 0.01;
        const npvExpected = 5.66032;
        const deltaExpected = -0.30065;
        const gammaExpected = 0.02202;
        expect(Math.abs(option.NPV() - npvExpected)).toBeLessThan(tol);
        expect(Math.abs(option.delta() - deltaExpected)).toBeLessThan(tol);
        expect(Math.abs(option.gamma() - gammaExpected)).toBeLessThan(tol);
        backup.dispose();
    });

    it('Testing FDM Heston for Ikonen and Toivanen tests...', () => {
        const backup = new SavedSettings();
        const rTS = new Handle(flatRate4(0.10, new Actual360()));
        const qTS = new Handle(flatRate4(0.0, new Actual360()));
        Settings.evaluationDate.set(new Date('28-March-2004'));
        const exerciseDate = new Date('26-June-2004');
        const exercise = new AmericanExercise().init2(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 10);
        const option = new VanillaOption(payoff, exercise);
        const strikes = [8, 9, 10, 11, 12];
        const expected = [2.00000, 1.10763, 0.520038, 0.213681, 0.082046];
        const tol = 0.001;
        for (let i = 0; i < strikes.length; ++i) {
            const s0 = new Handle(new SimpleQuote(strikes[i]));
            const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.0625, 5, 0.16, 0.9, 0.1);
            const engine = new FdHestonVanillaEngine(new HestonModel(hestonProcess), 100, 400);
            option.setPricingEngine(engine);
            const calculated = option.NPV();
            expect(Math.abs(calculated - expected[i])).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing FDM Heston with Black Scholes model...', () => {
        const backup = new SavedSettings();
        Settings.evaluationDate.set(new Date('28-March-2004'));
        const exerciseDate = new Date('26-June-2004');
        const rTS = new Handle(flatRate4(0.10, new Actual360()));
        const qTS = new Handle(flatRate4(0.0, new Actual360()));
        const volTS = new Handle(flatVol2(rTS.currentLink().referenceDate(), 0.25, rTS.currentLink().dayCounter()));
        const exercise = new EuropeanExercise(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 10);
        const option = new VanillaOption(payoff, exercise);
        const strikes = [8, 9, 10, 11, 12];
        const tol = 0.0001;
        for (let i = 0; i < strikes.length; ++i) {
            const s0 = new Handle(new SimpleQuote(strikes[i]));
            const bsProcess = new GeneralizedBlackScholesProcess().init1(s0, qTS, rTS, volTS);
            option.setPricingEngine(new AnalyticEuropeanEngine().init1(bsProcess));
            const expected = option.NPV();
            const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.0625, 1, 0.0625, 0.0001, 0.0);
            option.setPricingEngine(new FdHestonVanillaEngine(new HestonModel(hestonProcess), 100, 400, 3));
            let calculated = option.NPV();
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
            option.setPricingEngine(new FdHestonVanillaEngine(new HestonModel(hestonProcess), 4000, 400, 3, 0, FdmSchemeDesc.ExplicitEuler()));
            calculated = option.NPV();
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
        backup.dispose();
    });

    it('Testing FDM with European option with dividends in Heston model...', () => {
        const backup = new SavedSettings();
        const s0 = new Handle(new SimpleQuote(100.0));
        const rTS = new Handle(flatRate4(0.05, new Actual365Fixed()));
        const qTS = new Handle(flatRate4(0.0, new Actual365Fixed()));
        const hestonProcess = new HestonProcess(rTS, qTS, s0, 0.04, 2.5, 0.04, 0.66, -0.8);
        Settings.evaluationDate.set(new Date('28-March-2004'));
        const exerciseDate = new Date('28-March-2005');
        const exercise = new AmericanExercise().init2(exerciseDate);
        const payoff = new PlainVanillaPayoff(Option.Type.Put, 100);
        const dividends = [5];
        const dividendDates = [new Date('28-September-2004')];
        const option = new DividendVanillaOption(payoff, exercise, dividendDates, dividends);
        const engine = new FdHestonVanillaEngine(new HestonModel(hestonProcess), 50, 100, 50);
        option.setPricingEngine(engine);
        const tol = 0.01;
        const gammaTol = 0.001;
        const npvExpected = 7.365075;
        const deltaExpected = -0.396678;
        const gammaExpected = 0.027681;
        expect(Math.abs(option.NPV() - npvExpected)).toBeLessThan(tol);
        expect(Math.abs(option.delta() - deltaExpected)).toBeLessThan(tol);
        expect(Math.abs(option.gamma() - gammaExpected)).toBeLessThan(gammaTol);
        backup.dispose();
    });

    it('Testing FDM Heston convergence...', () => {
        const backup = new SavedSettings();
        const values = [
            new HestonTestData(1.5, 0.04, 0.3, -0.9, 0.025, 0.0, 1.0, 100),
            new HestonTestData(3.0, 0.12, 0.04, 0.6, 0.01, 0.04, 1.0, 100),
            new HestonTestData(0.6067, 0.0707, 0.2928, -0.7571, 0.03, 0.0, 3.0, 100),
            new HestonTestData(2.5, 0.06, 0.5, -0.1, 0.0507, 0.0469, 0.25, 100)
        ];
        const schemes = [
            FdmSchemeDesc.Hundsdorfer(), FdmSchemeDesc.ModifiedCraigSneyd(),
            FdmSchemeDesc.ModifiedHundsdorfer(), FdmSchemeDesc.CraigSneyd(),
            FdmSchemeDesc.TrBDF2()
        ];
        const tn = [60];
        const v0 = [0.04];
        const todaysDate = new Date('28-March-2004');
        Settings.evaluationDate.set(todaysDate);
        const s0 = new Handle(new SimpleQuote(75.0));
        for (let l = 0; l < schemes.length; ++l) {
            for (let i = 0; i < values.length; ++i) {
                for (let j = 0; j < tn.length; ++j) {
                    for (let k = 0; k < v0.length; ++k) {
                        const rTS = new Handle(flatRate4(values[i].r, new Actual365Fixed()));
                        const qTS = new Handle(flatRate4(values[i].q, new Actual365Fixed()));
                        const hestonProcess = new HestonProcess(rTS, qTS, s0, v0[k], values[i].kappa, values[i].theta, values[i].sigma, values[i].rho);
                        const exerciseDate = DateExt.advance(todaysDate, Math.floor(values[i].T * 365), TimeUnit.Days);
                        const exercise = new EuropeanExercise(exerciseDate);
                        const payoff = new PlainVanillaPayoff(Option.Type.Call, values[i].K);
                        const option = new VanillaOption(payoff, exercise);
                        const engine = new FdHestonVanillaEngine(new HestonModel(hestonProcess), tn[j], 101, 51, 0, schemes[l]);
                        option.setPricingEngine(engine);
                        const calculated = option.NPV();
                        const analyticEngine = new AnalyticHestonEngine().aheInit2(new HestonModel(hestonProcess), 144);
                        option.setPricingEngine(analyticEngine);
                        const expected = option.NPV();
                        expect(Math.abs(expected - calculated) / expected)
                            .toBeLessThan(0.02);
                        expect(Math.abs(expected - calculated)).toBeLessThan(0.002);
                    }
                }
            }
        }
        backup.dispose();
    });
    
    it('Testing FDM Heston intraday pricing ...', () => {
        const backup = new SavedSettings();
        const type = Option.Type.Put;
        const underlying = 36;
        const strike = underlying;
        const dividendYield = 0.00;
        const riskFreeRate = 0.06;
        const v0 = 0.2;
        const kappa = 1.0;
        const theta = v0;
        const sigma = 0.0065;
        const rho = -0.75;
        const dayCounter = new Actual365Fixed();
        const maturity = new Date(2014, Month.May - 1, 17, 17, 30, 0);
        const europeanExercise = new EuropeanExercise(maturity);
        const payoff = new PlainVanillaPayoff(type, strike);
        const option = new VanillaOption(payoff, europeanExercise);
        const s0 = new Handle(new SimpleQuote(underlying));
        const flatTermStructure = new RelinkableHandle(), flatDividendTS = new RelinkableHandle();
        const process = new HestonProcess(flatTermStructure, flatDividendTS, s0, v0, kappa, theta, sigma, rho);
        const model = new HestonModel(process);
        const fdm = new FdHestonVanillaEngine(model, 20, 100, 26, 0);
        option.setPricingEngine(fdm);
        const gammaExpected = [
            1.46757, 1.54696, 1.6408, 1.75409, 1.89464, 2.07548, 2.32046, 2.67944,
            3.28164, 4.64096
        ];
        for (let i = 0; i < 10; ++i) {
            const now = new Date(2014, Month.May - 1, 17, 15, i * 15, 0);
            Settings.evaluationDate.set(now);
            flatTermStructure.linkTo(new FlatForward().ffInit2(now, riskFreeRate, dayCounter));
            flatDividendTS.linkTo(new FlatForward().ffInit2(now, dividendYield, dayCounter));
            const gammaCalculated = option.gamma();
            expect(Math.abs(gammaCalculated - gammaExpected[i])).toBeLessThan(1e-4);
        }
        backup.dispose();
    });

    it('Testing method of lines to solve Heston PDEs...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date('21-February-2018');
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const qTS = new Handle(flatRate2(today, 0.0, dc));
        const rTS = new Handle(flatRate2(today, 0.0, dc));
        const v0 = 0.09;
        const kappa = 1.0;
        const theta = v0;
        const sigma = 0.4;
        const rho = -0.75;
        const maturity = DateExt.advance(today, 3, TimeUnit.Months);
        const model = new HestonModel(new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho));
        const xGrid = 21;
        const vGrid = 7;
        const fdmDefault = new FdHestonVanillaEngine(model, 10, xGrid, vGrid, 0);
        const fdmMol = new FdHestonVanillaEngine(model, 10, xGrid, vGrid, 0, FdmSchemeDesc.MethodOfLines());
        const payoff = new PlainVanillaPayoff(Option.Type.Put, spot.currentLink().value());
        const option = new VanillaOption(payoff, new AmericanExercise().init2(maturity));
        option.setPricingEngine(fdmMol);
        const calculated = option.NPV();
        option.setPricingEngine(fdmDefault);
        const expected = option.NPV();
        const tol = 0.005;
        const diff = Math.abs(expected - calculated);
        expect(diff).toBeLessThan(tol);
        const barrierOption = new BarrierOption(Barrier.Type.DownOut, 85.0, 10.0, payoff, new EuropeanExercise(maturity));
        barrierOption.setPricingEngine(new FdHestonBarrierEngine(model, 100, 31, 11));
        const expectedBarrier = barrierOption.NPV();
        barrierOption.setPricingEngine(new FdHestonBarrierEngine(model, 100, 31, 11, 0, FdmSchemeDesc.MethodOfLines()));
        const calculatedBarrier = barrierOption.NPV();
        const barrierTol = 0.01;
        const barrierDiff = Math.abs(expectedBarrier - calculatedBarrier);
        expect(barrierDiff).toBeLessThan(barrierTol);
        backup.dispose();
    });
    
    it('Testing for spurious oscillations when solving the Heston PDEs...', () => {
        const backup = new SavedSettings();
        const dc = new Actual365Fixed();
        const today = new Date('7-June-2018');
        Settings.evaluationDate.set(today);
        const spot = new Handle(new SimpleQuote(100.0));
        const qTS = new Handle(flatRate2(today, 0.1, dc));
        const rTS = new Handle(flatRate2(today, 0.0, dc));
        const v0 = 0.005;
        const kappa = 1.0;
        const theta = 0.005;
        const sigma = 0.4;
        const rho = -0.75;
        const maturity = DateExt.advance(today, 1, TimeUnit.Years);
        const process = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
        const model = new HestonModel(process);
        const hestonEngine = new FdHestonVanillaEngine(model, 6, 200, 13, 0, FdmSchemeDesc.TrBDF2());
        const option = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, spot.currentLink().value()), new EuropeanExercise(maturity));
        option.setupArguments(hestonEngine.getArguments());
        const descs = [
            [FdmSchemeDesc.CraigSneyd(), 'Craig-Sneyd', true],
            [FdmSchemeDesc.Hundsdorfer(), 'Hundsdorfer', true],
            [FdmSchemeDesc.ModifiedHundsdorfer(), 'Mod. Hundsdorfer', true],
            [FdmSchemeDesc.Douglas(), 'Douglas', true],
            [FdmSchemeDesc.ImplicitEuler(), 'Implicit', false],
            [FdmSchemeDesc.TrBDF2(), 'TR-BDF2', false]
        ];
        for (let j = 0; j < descs.length; ++j) {
            const solver = new FdmHestonSolver(new Handle(process), hestonEngine.getSolverDesc(1.0), descs[j][0]);
            const gammas = [];
            for (let x = 99; x < 101.001; x += 0.1) {
                gammas.push(solver.gammaAt(x, v0));
            }
            let maximum = QL_MIN_REAL;
            for (let i = 1; i < gammas.length; ++i) {
                const diff = Math.abs(gammas[i] - gammas[i - 1]);
                if (diff > maximum) {
                    maximum = diff;
                }
            }
            const tol = 0.01;
            const hasSpuriousOscillations = maximum > tol;
            expect(hasSpuriousOscillations).toEqual(descs[j][2]);
        }
        backup.dispose();
    });
});