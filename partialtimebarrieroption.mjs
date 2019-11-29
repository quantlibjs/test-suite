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
import { Actual360, AnalyticPartialTimeBarrierOptionEngine, Barrier, BlackScholesMertonProcess, DateExt, EuropeanExercise, Handle, Option, PartialBarrier, PartialTimeBarrierOption, PlainVanillaPayoff, Settings, SimpleQuote, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

class TestCase {
    constructor(underlying, strike, days, result) {
        this.underlying = underlying;
        this.strike = strike;
        this.days = days;
        this.result = result;
    }
}

describe(`Partial-time barrier option tests ${version}`, () => {
    it('Testing analytic engine for partial-time barrier option...', () => {
        const today = Settings.evaluationDate.f();
        const type = Option.Type.Call;
        const dc = new Actual360();
        const maturity = DateExt.add(today, 360);
        const exercise = new EuropeanExercise(maturity);
        const barrier = 100.0;
        const rebate = 0.0;
        const spot = new SimpleQuote();
        const qRate = new SimpleQuote(0.0);
        const rRate = new SimpleQuote(0.1);
        const vol = new SimpleQuote(0.25);
        const underlying = new Handle(spot);
        const dividendTS = new Handle(flatRate1(today, qRate, dc));
        const riskFreeTS = new Handle(flatRate1(today, rRate, dc));
        const blackVolTS = new Handle(flatVol1(today, vol, dc));
        const process = new BlackScholesMertonProcess(underlying, dividendTS, riskFreeTS, blackVolTS);
        const engine = new AnalyticPartialTimeBarrierOptionEngine(process);
        const cases = [
            new TestCase(95.0, 90.0, 1, 0.0393),
            new TestCase(95.0, 110.0, 1, 0.0000),
            new TestCase(105.0, 90.0, 1, 9.8751),
            new TestCase(105.0, 110.0, 1, 6.2303),
            new TestCase(95.0, 90.0, 90, 6.2747),
            new TestCase(95.0, 110.0, 90, 3.7352),
            new TestCase(105.0, 90.0, 90, 15.6324),
            new TestCase(105.0, 110.0, 90, 9.6812),
            new TestCase(95.0, 90.0, 180, 10.3345),
            new TestCase(95.0, 110.0, 180, 5.8712),
            new TestCase(105.0, 90.0, 180, 19.2896),
            new TestCase(105.0, 110.0, 180, 11.6055),
            new TestCase(95.0, 90.0, 270, 13.4342),
            new TestCase(95.0, 110.0, 270, 7.1270),
            new TestCase(105.0, 90.0, 270, 22.0753),
            new TestCase(105.0, 110.0, 270, 12.7342),
            new TestCase(95.0, 90.0, 359, 16.8576),
            new TestCase(95.0, 110.0, 359, 7.5763),
            new TestCase(105.0, 90.0, 359, 25.1488),
            new TestCase(105.0, 110.0, 359, 13.1376)
        ];
        for (let i = 0; i < cases.length; ++i) {
            const coverEventDate = DateExt.add(today, cases[i].days);
            const payoff = new PlainVanillaPayoff(type, cases[i].strike);
            const option = new PartialTimeBarrierOption(Barrier.Type.DownOut, PartialBarrier.Range.EndB1, barrier, rebate, coverEventDate, payoff, exercise);
            option.setPricingEngine(engine);
            spot.setValue(cases[i].underlying);
            const calculated = option.NPV();
            const expected = cases[i].result;
            const error = Math.abs(calculated - expected);
            const tolerance = 1e-4;
            expect(error).toBeLessThan(tolerance);
        }
    });
});
