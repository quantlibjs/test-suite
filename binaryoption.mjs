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
import { Actual360, AmericanExercise, AnalyticBinaryBarrierEngine, AssetOrNothingPayoff, Barrier, BarrierOption, BlackScholesMertonProcess, CashOrNothingPayoff, DateExt, Handle, Option, SimpleQuote, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { flatRate1, flatVol1 } from '/test-suite/utilities.mjs';

class BinaryOptionData {
    constructor(barrierType, barrier, cash, type, strike, s, q, r, t, v, result, tol) {
        this.barrierType = barrierType;
        this.barrier = barrier;
        this.cash = cash;
        this.type = type;
        this.strike = strike;
        this.s = s;
        this.q = q;
        this.r = r;
        this.t = t;
        this.v = v;
        this.result = result;
        this.tol = tol;
    }
}

describe(`Binary Option tests ${version}`, () => {
    it('Testing cash-or-nothing barrier options against Haug\'s values...', () => {
        const values = [
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 15.00, Option.Type.Call, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 4.9289, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 15.00, Option.Type.Call, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 6.2150, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Call, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 5.8926, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Call, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 7.4519, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 15.00, Option.Type.Put, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 4.4314, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 15.00, Option.Type.Put, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 3.1454, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Put, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 5.3297, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Put, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 3.7704, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 15.00, Option.Type.Call, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 4.8758, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 15.00, Option.Type.Call, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 4.9081, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 15.00, Option.Type.Call, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 15.00, Option.Type.Call, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 0.0407, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 15.00, Option.Type.Put, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 0.0323, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 15.00, Option.Type.Put, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 15.00, Option.Type.Put, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 3.0461, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 15.00, Option.Type.Put, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 3.0054, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Call, 102.00, 95.00, -0.14, 0.10, 0.5, 0.20, 8.6806, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Call, 102.00, 95.00, 0.03, 0.10, 0.5, 0.20, 5.3112, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 15.00, Option.Type.Call, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 7.4926, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Call, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 11.1231, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 15.00, Option.Type.Put, 102.00, 98.00, 0.00, 0.10, 0.5, 0.20, 7.1344, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 15.00, Option.Type.Put, 102.00, 101.00, 0.00, 0.10, 0.5, 0.20, 5.9299, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 15.00, Option.Type.Call, 98.00, 99.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 15.00, Option.Type.Call, 98.00, 101.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 15.00, Option.Type.Put, 98.00, 99.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 15.00, Option.Type.Put, 98.00, 101.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new CashOrNothingPayoff(values[i].type, values[i].strike, values[i].cash);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().aeInit1(today, exDate, true);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticBinaryBarrierEngine(stochProcess);
            const opt = new BarrierOption(values[i].barrierType, values[i].barrier, 0, payoff, amExercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });

    it('Testing asset-or-nothing barrier options against Haug\'s values...', () => {
        const values = [
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 0.00, Option.Type.Call, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 37.2782, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 0.00, Option.Type.Call, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 45.8530, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 0.00, Option.Type.Call, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 44.5294, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 0.00, Option.Type.Call, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 54.9262, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 0.00, Option.Type.Put, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 27.5644, 1e-4),
            new BinaryOptionData(Barrier.Type.DownIn, 100.00, 0.00, Option.Type.Put, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 18.9896, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 0.00, Option.Type.Put, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 33.1723, 1e-4),
            new BinaryOptionData(Barrier.Type.UpIn, 100.00, 0.00, Option.Type.Put, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 22.7755, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 0.00, Option.Type.Call, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 39.9391, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 0.00, Option.Type.Call, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 40.1574, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 0.00, Option.Type.Call, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 0.00, Option.Type.Call, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 0.2676, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 0.00, Option.Type.Put, 102.00, 105.00, 0.00, 0.10, 0.5, 0.20, 0.2183, 1e-4),
            new BinaryOptionData(Barrier.Type.DownOut, 100.00, 0.00, Option.Type.Put, 98.00, 105.00, 0.00, 0.10, 0.5, 0.20, 0.0000, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 0.00, Option.Type.Put, 102.00, 95.00, 0.00, 0.10, 0.5, 0.20, 17.2983, 1e-4),
            new BinaryOptionData(Barrier.Type.UpOut, 100.00, 0.00, Option.Type.Put, 98.00, 95.00, 0.00, 0.10, 0.5, 0.20, 17.0306, 1e-4),
        ];
        const dc = new Actual360();
        const today = DateExt.UTC();
        const spot = new SimpleQuote(100.0);
        const qRate = new SimpleQuote(0.04);
        const qTS = flatRate1(today, qRate, dc);
        const rRate = new SimpleQuote(0.01);
        const rTS = flatRate1(today, rRate, dc);
        const vol = new SimpleQuote(0.25);
        const volTS = flatVol1(today, vol, dc);
        for (let i = 0; i < values.length; i++) {
            const payoff = new AssetOrNothingPayoff(values[i].type, values[i].strike);
            const exDate = DateExt.add(today, Math.floor(values[i].t * 360 + 0.5));
            const amExercise = new AmericanExercise().aeInit1(today, exDate, true);
            spot.setValue(values[i].s);
            qRate.setValue(values[i].q);
            rRate.setValue(values[i].r);
            vol.setValue(values[i].v);
            const stochProcess = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
            const engine = new AnalyticBinaryBarrierEngine(stochProcess);
            const opt = new BarrierOption(values[i].barrierType, values[i].barrier, 0, payoff, amExercise);
            opt.setPricingEngine(engine);
            const calculated = opt.NPV();
            const error = Math.abs(calculated - values[i].result);
            expect(error).toBeLessThan(values[i].tol);
        }
    });
});
