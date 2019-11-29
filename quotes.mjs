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
import { ActualActual, blackFormulaImpliedStdDev1, CompositeQuote, DerivedQuote, Euribor, FlatForward, ForwardValueQuote, Handle, ImpliedStdDevQuote, Option, Period, RelinkableHandle, Settings, SimpleQuote, TARGET, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { Flag } from '/test-suite/utilities.mjs';

function add10(x) {
    return x + 10;
}

function mul10(x) {
    return x * 10;
}

function sub10(x) {
    return x - 10;
}

function add(x, y) {
    return x + y;
}

function mul(x, y) {
    return x * y;
}

function sub(x, y) {
    return x - y;
}

describe(`Quote tests ${version}`, () => {
    it('Testing observability of quotes...', () => {
        const me = new SimpleQuote(0.0);
        const f = new Flag();
        f.registerWith(me);
        me.setValue(3.14);
        expect(f.isUp).toBeTruthy();
    });

    it('Testing observability of quote handles...', () => {
        const me1 = new SimpleQuote(0.0);
        const h = new RelinkableHandle(me1);
        const f = new Flag();
        f.registerWith(h.f());
        me1.setValue(3.14);
        expect(f.isUp).toBeTruthy();
        f.lower();
        const me2 = new SimpleQuote(0.0);
        h.linkTo(me2);
        expect(f.isUp).toBeTruthy();
    });

    it('Testing derived quotes...', () => {
        const funcs = [{ f: add10 }, { f: mul10 }, { f: sub10 }];
        const me = new SimpleQuote(17.0);
        const h = new Handle(me);
        for (let i = 0; i < 3; i++) {
            const derived = new DerivedQuote(h, funcs[i]);
            const x = derived.value(), y = funcs[i].f(me.value());
            expect(Math.abs(x - y)).toBeLessThan(1.0e-10);
        }
    });

    it('Testing composite quotes...', () => {
        const funcs = [{ f: add }, { f: mul }, { f: sub }];
        const me1 = new SimpleQuote(12.0), me2 = new SimpleQuote(13.0);
        const h1 = new Handle(me1), h2 = new Handle(me2);
        for (let i = 0; i < 3; i++) {
            const composite = new CompositeQuote(h1, h2, funcs[i]);
            const x = composite.value(), y = funcs[i].f(me1.value(), me2.value());
            expect(Math.abs(x - y)).toBeLessThan(1.0e-10);
        }
    });

    it('Testing forward-value and implied-standard-deviation quotes...', () => {
        const forwardRate = .05;
        const dc = new ActualActual();
        const calendar = new TARGET();
        const forwardQuote = new SimpleQuote(forwardRate);
        const forwardHandle = new Handle(forwardQuote);
        const evaluationDate = Settings.evaluationDate.f();
        const yc = new FlatForward().ffInit1(evaluationDate, forwardHandle, dc);
        const ycHandle = new Handle(yc);
        const euriborTenor = new Period().init1(1, TimeUnit.Years);
        const euribor = new Euribor(euriborTenor, ycHandle);
        const fixingDate = calendar.advance2(evaluationDate, euriborTenor);
        const forwardValueQuote = new ForwardValueQuote(euribor, fixingDate);
        let forwardValue = forwardValueQuote.value();
        let expectedForwardValue = euribor.fixing(fixingDate, true);
        expect(Math.abs(forwardValue - expectedForwardValue)).toBeLessThan(1.0e-15);
        const f = new Flag();
        f.registerWith(forwardValueQuote);
        forwardQuote.setValue(0.04);
        expect(f.isUp).toBeTruthy();
        forwardValue = forwardValueQuote.value();
        expectedForwardValue = euribor.fixing(fixingDate, true);
        expect(Math.abs(forwardValue - expectedForwardValue)).toBeLessThan(1.0e-15);
        f.unregisterWith(forwardValueQuote);
        f.lower();
        const price = 0.02;
        const strike = 0.04;
        const guess = .15;
        const accuracy = 1.0e-6;
        const optionType = Option.Type.Call;
        const priceQuote = new SimpleQuote(price);
        const priceHandle = new Handle(priceQuote);
        const impliedStdevQuote = new ImpliedStdDevQuote(optionType, forwardHandle, priceHandle, strike, guess, accuracy);
        const impliedStdev = impliedStdevQuote.value();
        const expectedImpliedStdev = blackFormulaImpliedStdDev1(optionType, strike, forwardQuote.value(), price, 1.0, 0.0, guess, 1.0e-6);
        expect(Math.abs(impliedStdev - expectedImpliedStdev)).toBeLessThan(1.0e-15);
        const quote = impliedStdevQuote;
        f.registerWith(quote);
        forwardQuote.setValue(0.05);
        expect(f.isUp).toBeTruthy();
        quote.value();
        f.lower();
        quote.value();
        priceQuote.setValue(0.11);
        expect(f.isUp).toBeTruthy();
    });
});
