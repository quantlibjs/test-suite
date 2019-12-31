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
import { Actual360, AnalyticTwoAssetBarrierEngine, Barrier, BlackScholesMertonProcess, DateExt, EuropeanExercise, Handle, Option, PlainVanillaPayoff, SimpleQuote, TwoAssetBarrierOption, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

class OptionData {
    constructor(barrierType, type, barrier, strike, s1, q1, v1, s2, q2, v2, correlation, r, result) {
        this.barrierType = barrierType;
        this.type = type;
        this.barrier = barrier;
        this.strike = strike;
        this.s1 = s1;
        this.q1 = q1;
        this.v1 = v1;
        this.s2 = s2;
        this.q2 = q2;
        this.v2 = v2;
        this.correlation = correlation;
        this.r = r;
        this.result = result;
    }
}

describe(`Two-asset barrier option tests ${version}`, () => {
    it('Testing two-asset barrier options against Haug\'s values...', () => {
        const values = [
            new OptionData(Barrier.Type.DownOut, Option.Type.Call, 95, 90, 100.0, 0.0, 0.2, 100.0, 0.0, 0.2, 0.5, 0.08, 6.6592),
            new OptionData(Barrier.Type.UpOut, Option.Type.Call, 105, 90, 100.0, 0.0, 0.2, 100.0, 0.0, 0.2, -0.5, 0.08, 4.6670),
            new OptionData(Barrier.Type.DownOut, Option.Type.Put, 95, 90, 100.0, 0.0, 0.2, 100.0, 0.0, 0.2, -0.5, 0.08, 0.6184),
            new OptionData(Barrier.Type.UpOut, Option.Type.Put, 105, 100, 100.0, 0.0, 0.2, 100.0, 0.0, 0.2, 0.0, 0.08, 0.8246)
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const maturity = DateExt.add(today, 180);
        const exercise = new EuropeanExercise(maturity);
        const r = new SimpleQuote();
        const rTS = flatRate1(today, r, dc);
        const s1 = new SimpleQuote();
        const q1 = new SimpleQuote();
        const qTS1 = flatRate1(today, q1, dc);
        const vol1 = new SimpleQuote();
        const volTS1 = flatVol1(today, vol1, dc);
        const process1 = new BlackScholesMertonProcess(new Handle(s1), new Handle(qTS1), new Handle(rTS), new Handle(volTS1));
        const s2 = new SimpleQuote();
        const q2 = new SimpleQuote();
        const qTS2 = flatRate1(today, q2, dc);
        const vol2 = new SimpleQuote();
        const volTS2 = flatVol1(today, vol2, dc);
        const process2 = new BlackScholesMertonProcess(new Handle(s2), new Handle(qTS2), new Handle(rTS), new Handle(volTS2));
        const rho = new SimpleQuote();
        const engine = new AnalyticTwoAssetBarrierEngine(process1, process2, new Handle(rho));
        for (let i = 0; i < values.length; i++) {
            s1.setValue(values[i].s1);
            q1.setValue(values[i].q1);
            vol1.setValue(values[i].v1);
            s2.setValue(values[i].s2);
            q2.setValue(values[i].q2);
            vol2.setValue(values[i].v2);
            rho.setValue(values[i].correlation);
            r.setValue(values[i].r);
            const payoff = new PlainVanillaPayoff(values[i].type, values[i].strike);
            const barrierOption = new TwoAssetBarrierOption(values[i].barrierType, values[i].barrier, payoff, exercise);
            barrierOption.setPricingEngine(engine);
            const calculated = barrierOption.NPV();
            const expected = values[i].result;
            const error = Math.abs(calculated - expected);
            const tolerance = 4.0e-3;
            expect(error).toBeLessThan(tolerance);
        }
    });
});
