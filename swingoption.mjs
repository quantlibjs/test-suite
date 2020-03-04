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
import { ArrayExt, ActualActual, AnalyticEuropeanEngine, Array1D, BlackScholesMertonProcess, constant, DateExt, EuropeanExercise, ExponentialJump1dMesher, ExtendedOrnsteinUhlenbeckProcess, ExtOUWithJumpsProcess, FdBlackScholesVanillaEngine, FdExtOUJumpVanillaEngine, FdSimpleBSSwingEngine, FdSimpleExtOUJumpSwingEngine, GeneralStatistics, Handle, InverseCumulativeNormal, InverseCumulativeRng, MersenneTwisterUniformRng, MultiPathGenerator, Option, PlainVanillaPayoff, PseudoRandom, SavedSettings, Settings, SimpleQuote, SwingExercise, TimeGrid, TimeUnit, VanillaForwardPayoff, VanillaOption, VanillaSwingOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4, flatVol2 } from '/test-suite/utilities.mjs';

function createKlugeProcess() {
    const x0 = new Array(2);
    x0[0] = 3.0;
    x0[1] = 0.0;
    const beta = 5.0;
    const eta = 2.0;
    const jumpIntensity = 1.0;
    const speed = 1.0;
    const volatility = 2.0;
    const ouProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, volatility, x0[0], new constant(x0[0]));
    return new ExtOUWithJumpsProcess(ouProcess, x0[1], beta, jumpIntensity, eta);
}

describe(`Swing-Option tests ${version}`, () => {
    it('Testing extended Ornstein-Uhlenbeck process...', () => {
        const backup = new SavedSettings();
        const speed = 2.5;
        const vol = 0.70;
        const level = 1.43;
        const discr = [
            ExtendedOrnsteinUhlenbeckProcess.Discretization.MidPoint,
            ExtendedOrnsteinUhlenbeckProcess.Discretization.Trapezodial,
            ExtendedOrnsteinUhlenbeckProcess.Discretization.GaussLobatto
        ];
        const f = [{ f: x => level }, { f: x => x + 1.0 }, { f: x => Math.sin(x) }];
        for (let n = 0; n < f.length; ++n) {
            const refProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, vol, 0.0, f[n], ExtendedOrnsteinUhlenbeckProcess.Discretization.GaussLobatto, 1e-6);
            for (let i = 0; i < discr.length - 1; ++i) {
                const eouProcess = new ExtendedOrnsteinUhlenbeckProcess(speed, vol, 0.0, f[n], discr[i]);
                const T = 10;
                const nTimeSteps = 10000;
                const dt = T / nTimeSteps;
                let t = 0.0;
                let q = 0.0;
                let p = 0.0;
                const rng = new InverseCumulativeRng(new MersenneTwisterUniformRng().init1(1234), new InverseCumulativeNormal());
                for (let j = 0; j < nTimeSteps; ++j) {
                    const dw = rng.next().value;
                    q = eouProcess.evolve2(t, q, dt, dw);
                    p = refProcess.evolve2(t, p, dt, dw);
                    expect(Math.abs(q - p) > 1e-6);
                    t += dt;
                }
            }
        }
        backup.dispose();
    });

    it('Testing finite difference mesher for the Kluge model...', () => {
        const backup = new SavedSettings();
        let x = Array1D.fromSizeValue(2, 1.0);
        const beta = 100.0;
        const eta = 1.0 / 0.4;
        const jumpIntensity = 4.0;
        const dummySteps = 2;
        const mesher = new ExponentialJump1dMesher(dummySteps, beta, jumpIntensity, eta);
        const ouProcess = new ExtendedOrnsteinUhlenbeckProcess(1.0, 1.0, x[0], new constant(1.0));
        const jumpProcess = new ExtOUWithJumpsProcess(ouProcess, x[1], beta, jumpIntensity, eta);
        const dt = 1.0 / (10.0 * beta);
        const n = 1000000;
        const path = new Array(n);
        const mt = new InverseCumulativeRng(new MersenneTwisterUniformRng().init1(123), new InverseCumulativeNormal());
        const dw = new Array(3);
        for (let i = 0; i < n; ++i) {
            dw[0] = mt.next().value;
            dw[1] = mt.next().value;
            dw[2] = mt.next().value;
            path[i] = (x = jumpProcess.evolve1(0.0, x, dt, dw))[1];
        }
        path.sort();
        const relTol1 = 2e-3;
        const relTol2 = 2e-2;
        const threshold = 0.9;
        for (let x = 1e-12; x < 1.0; x *= 10) {
            const v = mesher.jumpSizeDistribution1(x);
            const iter = ArrayExt.lowerBound(path, x, (p1, p2) => p1 - p2);
            const q = iter / n;
            expect(Math.abs(q - v)).toBeLessThan(relTol1);
            expect(v).toBeLessThan(threshold);
            expect(Math.abs(q - v)).toBeLessThan(relTol2);
        }
        backup.dispose();
    });

    it('Testing finite difference pricer for the Kluge model...', () => {
        const backup = new SavedSettings();
        const jumpProcess = createKlugeProcess();
        const today = DateExt.UTC();
        Settings.evaluationDate.set(today);
        const dc = new ActualActual();
        const maturityDate = DateExt.advance(today, 12, TimeUnit.Months);
        const maturity = dc.yearFraction(today, maturityDate);
        const irRate = 0.1;
        const rTS = flatRate2(today, irRate, dc);
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 30);
        const exercise = new EuropeanExercise(maturityDate);
        const engine = new FdExtOUJumpVanillaEngine(jumpProcess, rTS, 25, 200, 50);
        const option = new VanillaOption(payoff, exercise);
        option.setPricingEngine(engine);
        const fdNPV = option.NPV();
        const steps = 100;
        const nrTrails = 200000;
        const grid = new TimeGrid().init1(maturity, steps);
        const rsg = new PseudoRandom().make_sequence_generator(jumpProcess.factors() * (grid.size() - 1), 421);
        const npv = new GeneralStatistics();
        const generator = new MultiPathGenerator().init2(jumpProcess, grid, rsg, false);
        for (let n = 0; n < nrTrails; ++n) {
            const path = generator.next();
            const x = path.value.at(0).back;
            const y = path.value.at(1).back;
            const cashflow = payoff.f(Math.exp(x + y));
            npv.add(cashflow * rTS.discount2(maturity));
        }
        const mcNPV = npv.mean();
        const mcError = npv.errorEstimate();
        expect(Math.abs(fdNPV - mcNPV)).toBeLessThan(3.0 * mcError);
        backup.dispose();
    });

    it('Testing Black-Scholes vanilla swing option pricing...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC();
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const maturityDate = DateExt.advance(settlementDate, 12, TimeUnit.Months);
        const strike = 30;
        const payoff = new PlainVanillaPayoff(Option.Type.Put, strike);
        const forward = new VanillaForwardPayoff(Option.Type.Put, strike);
        const exerciseDates = [DateExt.advance(settlementDate, 1, TimeUnit.Months)];
        while (Array1D.back(exerciseDates).valueOf() < maturityDate.valueOf()) {
            exerciseDates.push(DateExt.advance(Array1D.back(exerciseDates), 1, TimeUnit.Months));
        }
        const swingExercise = new SwingExercise().seInit1(exerciseDates);
        const riskFreeTS = new Handle(flatRate4(0.14, dayCounter));
        const dividendTS = new Handle(flatRate4(0.02, dayCounter));
        const volTS = new Handle(flatVol2(settlementDate, 0.4, dayCounter));
        const s0 = new Handle(new SimpleQuote(30.0));
        const process = new BlackScholesMertonProcess(s0, dividendTS, riskFreeTS, volTS);
        const engine = new FdSimpleBSSwingEngine(process, 50, 200);
        const bermudanOption = new VanillaOption(payoff, swingExercise);
        bermudanOption.setPricingEngine(new FdBlackScholesVanillaEngine(process, 50, 200));
        const bermudanOptionPrices = bermudanOption.NPV();
        for (let i = 0; i < exerciseDates.length; ++i) {
            const exerciseRights = i + 1;
            const swingOption = new VanillaSwingOption(forward, swingExercise, 0, exerciseRights);
            swingOption.setPricingEngine(engine);
            const swingOptionPrice = swingOption.NPV();
            const upperBound = exerciseRights * bermudanOptionPrices;
            expect(swingOptionPrice - upperBound).toBeLessThan(0.01);
            let lowerBound = 0.0;
            for (let j = exerciseDates.length - i - 1; j < exerciseDates.length; ++j) {
                const europeanOption = new VanillaOption(payoff, new EuropeanExercise(exerciseDates[j]));
                europeanOption.setPricingEngine(new AnalyticEuropeanEngine().init1(process));
                lowerBound += europeanOption.NPV();
            }
            expect(lowerBound - swingOptionPrice).toBeLessThan(4e-2);
        }
        backup.dispose();
    });

    it('Testing simple swing option pricing for Kluge model...', () => {
        const backup = new SavedSettings();
        const settlementDate = DateExt.UTC();
        Settings.evaluationDate.set(settlementDate);
        const dayCounter = new ActualActual();
        const maturityDate = DateExt.advance(settlementDate, 12, TimeUnit.Months);
        const strike = 30;
        const payoff = new PlainVanillaPayoff(Option.Type.Put, strike);
        const forward = new VanillaForwardPayoff(Option.Type.Put, strike);
        const exerciseDates = [DateExt.advance(settlementDate, 1, TimeUnit.Months)];
        while (Array1D.back(exerciseDates).valueOf() < maturityDate.valueOf()) {
            exerciseDates.push(DateExt.advance(Array1D.back(exerciseDates), 1, TimeUnit.Months));
        }
        const swingExercise = new SwingExercise().seInit1(exerciseDates);
        const exerciseTimes = new Array(exerciseDates.length);
        for (let i = 0; i < exerciseTimes.length; ++i) {
            exerciseTimes[i] =
                dayCounter.yearFraction(settlementDate, exerciseDates[i]);
        }
        const grid = new TimeGrid().init3(exerciseTimes, 0, exerciseTimes.length, 60);
        const exerciseIndex = new Array(exerciseDates.length);
        for (let i = 0; i < exerciseIndex.length; ++i) {
            exerciseIndex[i] = grid.closestIndex(exerciseTimes[i]);
        }
        const jumpProcess = createKlugeProcess();
        const irRate = 0.1;
        const rTS = flatRate2(settlementDate, irRate, dayCounter);
        const swingEngine = new FdSimpleExtOUJumpSwingEngine(jumpProcess, rTS, 25, 50, 25);
        const vanillaEngine = new FdExtOUJumpVanillaEngine(jumpProcess, rTS, 25, 50, 25);
        const bermudanOption = new VanillaOption(payoff, swingExercise);
        bermudanOption.setPricingEngine(vanillaEngine);
        const bermudanOptionPrices = bermudanOption.NPV();
        const nrTrails = 16000;
        const rsg = new PseudoRandom().make_sequence_generator(jumpProcess.factors() * (grid.size() - 1), 421);
        const generator = new MultiPathGenerator().init2(jumpProcess, grid, rsg, false);
        for (let i = 0; i < exerciseDates.length; ++i) {
            const exerciseRights = i + 1;
            const swingOption = new VanillaSwingOption(forward, swingExercise, 0, exerciseRights);
            swingOption.setPricingEngine(swingEngine);
            const swingOptionPrice = swingOption.NPV();
            const upperBound = exerciseRights * bermudanOptionPrices;
            expect(swingOptionPrice - upperBound).toBeLessThan(2e-2);
            let lowerBound = 0.0;
            for (let j = exerciseDates.length - i - 1; j < exerciseDates.length; ++j) {
                const europeanOption = new VanillaOption(payoff, new EuropeanExercise(exerciseDates[j]));
                europeanOption.setPricingEngine(vanillaEngine);
                lowerBound += europeanOption.NPV();
            }
            expect(lowerBound - swingOptionPrice).toBeLessThan(2e-2);
            const npv = new GeneralStatistics();
            for (let n = 0; n < nrTrails; ++n) {
                const path = generator.next();
                const exerciseValues = new Array(exerciseTimes.length);
                for (let k = 0; k < exerciseTimes.length; ++k) {
                    const x = path.value.at(0).at(exerciseIndex[k]);
                    const y = path.value.at(1).at(exerciseIndex[k]);
                    const s = Math.exp(x + y);
                    exerciseValues[k] = payoff.f(s) * rTS.discount1(exerciseDates[k]);
                }
                exerciseValues.sort((e1, e2) => e1 - e2);
                const npCashFlows = exerciseValues.reduce((p, c) => p + c, 0.0);
                npv.add(npCashFlows);
            }
            const mcUpperBound = npv.mean();
            const mcErrorUpperBound = npv.errorEstimate();
            expect(swingOptionPrice - mcUpperBound)
                .toBeLessThan(2.36 * mcErrorUpperBound);
        }
        backup.dispose();
    });
});
