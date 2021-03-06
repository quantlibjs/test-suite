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
import { Actual360, AnalyticHolderExtensibleOptionEngine, AnalyticWriterExtensibleOptionEngine, BlackScholesMertonProcess, DateExt, EuropeanExercise, GeneralizedBlackScholesProcess, Handle, HolderExtensibleOption, Option, PlainVanillaPayoff, Settings, SimpleQuote, WriterExtensibleOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

describe(`Extensible option tests ${version}`, () => {
    it('Testing analytic engine for holder-extensible option...', () => {
        const type = Option.Type.Call;
        const strike1 = 100.0;
        const strike2 = 105.0;
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const exDate1 = DateExt.add(today, 180);
        const exDate2 = DateExt.add(today, 270);
        const premium = 1.0;
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.0);
        const rRate = new SimpleQuote(0.08);
        const vol = new SimpleQuote(0.25);
        const payoff = new PlainVanillaPayoff(type, strike1);
        const exercise = new EuropeanExercise(exDate1);
        const option = new HolderExtensibleOption(type, premium, exDate2, strike2, payoff, exercise);
        const underlying = new Handle(spot);
        const dividendTS = new Handle(flatRate1(today, qRate, dc));
        const riskFreeTS = new Handle(flatRate1(today, rRate, dc));
        const blackVolTS = new Handle(flatVol1(today, vol, dc));
        const process = new BlackScholesMertonProcess(underlying, dividendTS, riskFreeTS, blackVolTS);
        option.setPricingEngine(new AnalyticHolderExtensibleOptionEngine(process));
        const calculated = option.NPV();
        const expected = 9.4233;
        const error = Math.abs(calculated - expected);
        const tolerance = 1e-4;
        expect(error).toBeLessThan(tolerance);
    });
    it('Testing analytic engine for writer-extensible option...', () => {
        const type = Option.Type.Call;
        const strike1 = 90.0;
        const strike2 = 82.0;
        const dc = new Actual360();
        const today = Settings.evaluationDate.f();
        const exDate1 = DateExt.add(today, 180);
        const exDate2 = DateExt.add(today, 270);
        const spot = new SimpleQuote(80.0);
        const qRate = new SimpleQuote(0.0);
        const dividendTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.10);
        const riskFreeTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.30);
        const blackVolTS = flatVol1(today, vol, dc);
        const process = new GeneralizedBlackScholesProcess().init1(new Handle(spot), new Handle(dividendTS), new Handle(riskFreeTS), new Handle(blackVolTS));
        const engine = new AnalyticWriterExtensibleOptionEngine(process);
        const payoff1 = new PlainVanillaPayoff(type, strike1);
        const exercise1 = new EuropeanExercise(exDate1);
        const payoff2 = new PlainVanillaPayoff(type, strike2);
        const exercise2 = new EuropeanExercise(exDate2);
        const option = new WriterExtensibleOption(payoff1, exercise1, payoff2, exercise2);
        option.setPricingEngine(engine);
        const calculated = option.NPV();
        const expected = 6.8238;
        const error = Math.abs(calculated - expected);
        const tolerance = 1e-4;
        expect(error).toBeLessThan(tolerance);
    });
});