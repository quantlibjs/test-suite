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
import { Actual360, AnalyticTwoAssetCorrelationEngine, BlackScholesMertonProcess, DateExt, EuropeanExercise, Handle, Option, Settings, SimpleQuote, TwoAssetCorrelationOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate2, flatVol2 } from '/test-suite/utilities.mjs';

describe(`Two-asset correlation option tests ${version}`, () => {
    it('Testing analytic engine for two-asset correlation option...', () => {
        const today = Settings.evaluationDate.f();
        const dc = new Actual360();
        const type = Option.Type.Call;
        const strike1 = 50.0;
        const strike2 = 70.0;
        const exDate = DateExt.add(today, 180);
        const exercise = new EuropeanExercise(exDate);
        const option = new TwoAssetCorrelationOption(type, strike1, strike2, exercise);
        const underlying1 = new Handle(new SimpleQuote(52.0));
        const underlying2 = new Handle(new SimpleQuote(65.0));
        const dividendTS1 = new Handle(flatRate2(today, 0.0, dc));
        const dividendTS2 = new Handle(flatRate2(today, 0.0, dc));
        const riskFreeTS = new Handle(flatRate2(today, 0.1, dc));
        const blackVolTS1 = new Handle(flatVol2(today, 0.2, dc));
        const blackVolTS2 = new Handle(flatVol2(today, 0.3, dc));
        const correlation = new Handle(new SimpleQuote(0.75));
        const process1 = new BlackScholesMertonProcess(underlying1, dividendTS1, riskFreeTS, blackVolTS1);
        const process2 = new BlackScholesMertonProcess(underlying2, dividendTS2, riskFreeTS, blackVolTS2);
        option.setPricingEngine(new AnalyticTwoAssetCorrelationEngine(process1, process2, correlation));
        const calculated = option.NPV();
        const expected = 4.7073;
        const error = Math.abs(calculated - expected);
        const tolerance = 1e-4;
        expect(error).toBeLessThan(tolerance);
    });
});
