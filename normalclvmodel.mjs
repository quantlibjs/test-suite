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
import { Actual360, Actual365Fixed, ActualActual, AnalyticDoubleBarrierBinaryEngine, AnalyticEuropeanEngine, AnalyticHestonEngine, Array1D, BSMRNDCalculator, CashOrNothingPayoff, DateExt, DoubleBarrier, DoubleBarrierOption, EuropeanExercise, FdOrnsteinUhlenbeckVanillaEngine, GeneralizedBlackScholesProcess, Handle, HestonBlackVolSurface, HestonModel, HestonProcess, HestonRNDCalculator, LowDiscrepancy, Month, NormalCLVModel, Option, OrnsteinUhlenbeckProcess, PathGenerator, PlainVanillaPayoff, QL_EPSILON, RiskStatistics, SABRVolTermStructure, SavedSettings, Settings, SimpleQuote, SobolBrownianBridgeRsg, TimeGrid, TimeUnit, VanillaOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatRate4, flatVol2, flatVol4 } from '/test-suite/utilities.mjs';

class CLVModelPayoff extends PlainVanillaPayoff {
  constructor(type, strike, g) {
      super(type, strike), this._g = g;
  }
  f(x) {
      return super.f(this._g.f(x));
  }
}

describe(`Normal CLV Model tests ${version}`, () => {
  it('Testing Black-Scholes cumulative distribution' +
      ' function with constant volatility...', () => {
      const backup = new SavedSettings();
      const dc = new Actual365Fixed();
      const today = new Date(2016, Month.June - 1, 22);
      const maturity = DateExt.advance(today, 6, TimeUnit.Months);
      const s0 = 100;
      const rRate = 0.1;
      const qRate = 0.05;
      const vol = 0.25;
      const spot = new Handle(new SimpleQuote(s0));
      const qTS = new Handle(flatRate2(today, qRate, dc));
      const rTS = new Handle(flatRate2(today, rRate, dc));
      const volTS = new Handle(flatVol2(today, vol, dc));
      const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, volTS);
      const ouProcess = new OrnsteinUhlenbeckProcess(0, 0);
      const m = new NormalCLVModel(bsProcess, ouProcess, null, 5);
      const rndCalculator = new BSMRNDCalculator(bsProcess);
      const tol = 1e5 * QL_EPSILON;
      const t = dc.yearFraction(today, maturity);
      for (let x = 10; x < 400; x += 10) {
          const calculated = m.cdf(maturity, x);
          const expected = rndCalculator.cdf(Math.log(x), t);
          expect(Math.abs(calculated - expected)).toBeLessThan(tol);
      }
      backup.dispose();
  });

  it('Testing Heston cumulative distribution function...', () => {
      const backup = new SavedSettings();
      const dc = new Actual365Fixed();
      const today = DateExt.UTC('22,June,2016');
      const maturity = DateExt.advance(today, 1, TimeUnit.Years);
      const s0 = 100;
      const v0 = 0.01;
      const rRate = 0.1;
      const qRate = 0.05;
      const kappa = 2.0;
      const theta = 0.09;
      const sigma = 0.4;
      const rho = -0.75;
      const spot = new Handle(new SimpleQuote(s0));
      const qTS = new Handle(flatRate2(today, qRate, dc));
      const rTS = new Handle(flatRate2(today, rRate, dc));
      const process = new HestonProcess(rTS, qTS, spot, v0, kappa, theta, sigma, rho);
      const hestonVolTS = new Handle(new HestonBlackVolSurface(new Handle(new HestonModel(process))));
      const m = new NormalCLVModel(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, hestonVolTS), null, [], 5);
      const rndCalculator = new HestonRNDCalculator(process);
      const tol = 1e-6;
      const t = dc.yearFraction(today, maturity);
      for (let x = 10; x < 400; x += 25) {
          const calculated = m.cdf(maturity, x);
          const expected = rndCalculator.cdf(Math.log(x), t);
          expect(Math.abs(calculated - expected)).toBeLessThan(tol);
      }
      backup.dispose();
  });

  it('Testing illustrative 1D example of normal CLV model...', () => {
      const backup = new SavedSettings();
      const dc = new Actual360();
      const today = DateExt.UTC('22,June,2016');
      const beta = 0.5;
      const alpha = 0.2;
      const rho = -0.9;
      const gamma = 0.2;
      const speed = 1.3;
      const level = 0.1;
      const vol = 0.25;
      const x0 = 1.0;
      const s0 = 1.0;
      const rRate = 0.03;
      const qRate = 0.0;
      const spot = new Handle(new SimpleQuote(s0));
      const qTS = new Handle(flatRate2(today, qRate, dc));
      const rTS = new Handle(flatRate2(today, rRate, dc));
      const sabrVol = new Handle(new SABRVolTermStructure(alpha, beta, gamma, rho, s0, rRate, today, dc));
      const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, sabrVol);
      const ouProcess = new OrnsteinUhlenbeckProcess(speed, vol, x0, level);
      const maturityDates = [];
      maturityDates.push(DateExt.advance(today, 18, TimeUnit.Days)),
          maturityDates.push(DateExt.advance(today, 90, TimeUnit.Days)),
          maturityDates.push(DateExt.advance(today, 180, TimeUnit.Days)),
          maturityDates.push(DateExt.advance(today, 360, TimeUnit.Days)),
          maturityDates.push(DateExt.advance(today, 720, TimeUnit.Days));
      const m = new NormalCLVModel(bsProcess, ouProcess, maturityDates, 4);
      const maturities = [];
      maturities.push(maturityDates[0]);
      maturities.push(maturityDates[2]);
      maturities.push(maturityDates[4]);
      const x = new Array(3);
      x[0] = [1.070, 0.984, 0.903, 0.817];
      x[1] = [0.879, 0.668, 0.472, 0.261];
      x[2] = [0.528, 0.282, 0.052, -0.194];
      const s = new Array(3);
      s[0] = [1.104, 1.035, 0.969, 0.895];
      s[1] = [1.328, 1.122, 0.911, 0.668];
      s[2] = [1.657, 1.283, 0.854, 0.339];
      const c = [2.3344, 0.7420, -0.7420, -2.3344];
      const tol = 0.001;
      for (let i = 0; i < maturities.length; ++i) {
          const t = dc.yearFraction(today, maturities[i]);
          for (let j = 0; j < x[0].length; ++j) {
              const calculatedX = m.collocationPointsX(maturities[i])[j];
              const expectedX = x[i][j];
              expect(Math.abs(calculatedX - expectedX)).toBeLessThan(tol);
              const calculatedS = m.collocationPointsY(maturities[i])[j];
              const expectedS = s[i][j];
              expect(Math.abs(calculatedS - expectedS)).toBeLessThan(tol);
              const expectation = ouProcess.expectation2(0.0, ouProcess.x0(), t);
              const stdDeviation = ouProcess.stdDeviation2(0.0, ouProcess.x0(), t);
              const calculatedG = m.g().f(t, expectation + stdDeviation * c[j]);
              expect(Math.abs(calculatedG - expectedS)).toBeLessThan(tol);
          }
      }
      backup.dispose();
  });

  it('Testing Monte Carlo BS option pricing...', () => {
      const backup = new SavedSettings();
      const dc = new Actual365Fixed();
      const today = DateExt.UTC('22,June,2016');
      const maturity = DateExt.advance(today, 1, TimeUnit.Years);
      const t = dc.yearFraction(today, maturity);
      const strike = 110;
      const payoff = new PlainVanillaPayoff(Option.Type.Call, strike);
      const exercise = new EuropeanExercise(maturity);
      const speed = 2.3;
      const level = 100;
      const sigma = 0.35;
      const x0 = 100.0;
      const s0 = x0;
      const vol = 0.25;
      const rRate = 0.10;
      const qRate = 0.04;
      const spot = new Handle(new SimpleQuote(s0));
      const qTS = new Handle(flatRate2(today, qRate, dc));
      const rTS = new Handle(flatRate2(today, rRate, dc));
      const vTS = new Handle(flatVol2(today, vol, dc));
      const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, vTS);
      const ouProcess = new OrnsteinUhlenbeckProcess(speed, sigma, x0, level);
      const maturities = [];
      maturities.push(DateExt.advance(today, 6, TimeUnit.Months));
      maturities.push(maturity);
      const m = new NormalCLVModel(bsProcess, ouProcess, maturities, 8);
      const nSims = 32767;
      const ld = new LowDiscrepancy().make_sequence_generator(1, 23455);
      const stat = new RiskStatistics();
      for (let i = 0; i < nSims; ++i) {
          const dw = ld.nextSequence().value[0];
          const o_t = ouProcess.evolve2(0, x0, t, dw);
          const s = m.g().f(t, o_t);
          stat.add(payoff.f(s));
      }
      let calculated = stat.mean() * rTS.currentLink().discount1(maturity);
      const option = new VanillaOption(payoff, exercise);
      option.setPricingEngine(new AnalyticEuropeanEngine().init1(bsProcess));
      const expected = option.NPV();
      const tol = 0.01;
      expect(Math.abs(calculated - expected)).toBeLessThan(tol);
      const fdmOption = new VanillaOption(new CLVModelPayoff(payoff.optionType(), payoff.strike(), { f: (x) => m.g().f(t, x) }), exercise);
      fdmOption.setPricingEngine(new FdOrnsteinUhlenbeckVanillaEngine(ouProcess, rTS.currentLink(), 50, 800));
      calculated = fdmOption.NPV();
      expect(Math.abs(calculated - expected)).toBeLessThan(tol);
      backup.dispose();
  });

  it('Testing double no-touch pricing with normal CLV model...', () => {
      const backup = new SavedSettings();
      const dc = new ActualActual();
      const todaysDate = DateExt.UTC('5,Aug,2016');
      const maturityDate = DateExt.advance(todaysDate, 1, TimeUnit.Years);
      const maturityTime = dc.yearFraction(todaysDate, maturityDate);
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
      const vTS = new Handle(new HestonBlackVolSurface(new Handle(hestonModel)));
      const bsProcess = new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, vTS);
      const speed = -0.80;
      const level = 100;
      const sigmaOU = 0.15;
      const x0 = 100;
      const ouProcess = new OrnsteinUhlenbeckProcess(speed, sigmaOU, x0, level);
      const europeanExercise = new EuropeanExercise(maturityDate);
      const vanillaOption = new VanillaOption(new PlainVanillaPayoff(Option.Type.Call, s0), europeanExercise);
      vanillaOption.setPricingEngine(new AnalyticHestonEngine().aheInit2(hestonModel));
      const atmVol = vanillaOption.impliedVolatility(vanillaOption.NPV(), new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(Math.sqrt(theta), dc))));
      const analyticEngine = new AnalyticDoubleBarrierBinaryEngine().init1(new GeneralizedBlackScholesProcess().init1(spot, qTS, rTS, new Handle(flatVol4(atmVol, dc))));
      const maturities = [DateExt.advance(todaysDate, 2, TimeUnit.Weeks)];
      while (Array1D.back(maturities).valueOf() < maturityDate.valueOf()) {
          maturities.push(DateExt.advance(Array1D.back(maturities), 2, TimeUnit.Weeks));
      }
      const m = new NormalCLVModel(bsProcess, ouProcess, maturities, 8);
      const n = 18;
      const barrier_lo = new Array(n), barrier_hi = new Array(n), bsNPV = new Array(n);
      const payoff = new CashOrNothingPayoff(Option.Type.Call, 0.0, 1.0);
      for (let i = 0; i < n; ++i) {
          const dist = 10.0 + 5.0 * i;
          barrier_lo[i] = Math.max(s0 - dist, 1e-2);
          barrier_hi[i] = s0 + dist;
          const doubleBarrier = new DoubleBarrierOption(DoubleBarrier.Type.KnockOut, barrier_lo[i], barrier_hi[i], 0.0, payoff, europeanExercise);
          doubleBarrier.setPricingEngine(analyticEngine);
          bsNPV[i] = doubleBarrier.NPV();
      }
      const factors = 1;
      const tSteps = 200;
      const grid = new TimeGrid().init1(maturityTime, tSteps);
      const pathGenerator = new PathGenerator().init2(ouProcess, grid, new SobolBrownianBridgeRsg(factors, tSteps), false);
      const nSims = 100000;
      const stats = new Array(n);
      const df = rTS.currentLink().discount1(maturityDate);
      for (let i = 0; i < nSims; ++i) {
          const touch = Array1D.fromSizeValue(n, false);
          const path = pathGenerator.next();
          let s;
          for (let j = 1; j <= tSteps; ++j) {
              const t = grid.at(j);
              s = m.g().f(t, path.value.at(j));
              for (let u = 0; u < n; ++u) {
                  if (s <= barrier_lo[u] || s >= barrier_hi[u]) {
                      touch[u] = true;
                  }
              }
          }
          for (let u = 0; u < n; ++u) {
              if (touch[u]) {
                  stats[u].add(0.0);
              }
              else {
                  stats[u].add(df * payoff.f(s));
              }
          }
      }
      const expected = [
          0.00931214,
          0.0901481,
          0.138982,
          0.112059,
          0.0595901,
          0.0167549,
          -0.00906787,
          -0.0206768,
          -0.0225628,
          -0.0203593,
          -0.016036,
          -0.0116629,
          -0.00728792,
          -0.00328821,
          -0.000158562,
          0.00502041,
          0.00347706,
          0.00238216,
      ];
      const tol = 1e-5;
      for (let u = 0; u < n; ++u) {
          const calculated = stats[u].mean() - bsNPV[u];
          expect(Math.abs(calculated - expected[u])).toBeLessThan(tol);
      }
      backup.dispose();
  });
});
