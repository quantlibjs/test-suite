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
import { Actual360, AnalyticEuropeanEngine, BlackScholesMertonProcess, CompositeInstrument, DateExt, EuropeanExercise, EuropeanOption, Handle, Option, PlainVanillaPayoff, RelinkableHandle, Settings, SimpleQuote, Stock, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { Flag, flatRate4, flatVol4 } from '/test-suite/utilities.mjs';

describe(`Instrument tests ${version}`, () => {
    it('Testing observability of instruments...', () => {
        const me1 = new SimpleQuote(0.0);
        const h = new RelinkableHandle(me1);
        const s = new Stock(h);
        const f = new Flag();
        f.registerWith(s);
        s.NPV();
        me1.setValue(3.14);
        expect(f.isUp()).toEqual(true);
        s.NPV();
        f.lower();
        const me2 = new SimpleQuote(0.0);
        h.linkTo(me2);
        expect(f.isUp()).toEqual(true);
        f.lower();
        s.freeze();
        s.NPV();
        me2.setValue(2.71);
        expect(f.isUp()).toEqual(false);
        s.NPV();
        s.unfreeze();
        expect(f.isUp()).toEqual(true);
    });

    it('Testing reaction of composite instrument to date changes...', () => {
        const today = DateExt.UTC();
        const dc = new Actual360();
        const payoff = new PlainVanillaPayoff(Option.Type.Call, 100.0);
        const exercise = new EuropeanExercise(DateExt.add(today, 30));
        const option = new EuropeanOption(payoff, exercise);
        const spot = new SimpleQuote(100.0);
        const qTS = flatRate4(0.0, dc);
        const rTS = flatRate4(0.01, dc);
        const volTS = flatVol4(0.1, dc);
        const process = new BlackScholesMertonProcess(new Handle(spot), new Handle(qTS), new Handle(rTS), new Handle(volTS));
        const engine = new AnalyticEuropeanEngine().init1(process);
        option.setPricingEngine(engine);
        const composite = new CompositeInstrument();
        composite.add(option);
        Settings.evaluationDate.set(DateExt.add(today, 45));
        expect(composite.isExpired()).toEqual(true);
        expect(composite.NPV()).toEqual(0.0);
        Settings.evaluationDate.set(today);
        expect(composite.isExpired()).toEqual(false);
        expect(composite.NPV()).not.toEqual(0.0);
    });
});
