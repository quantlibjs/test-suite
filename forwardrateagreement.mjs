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
import { Cubic, DateExt, ForwardRate, ForwardRateAgreement, FraRateHelper, Handle, Period, PiecewiseYieldCurve, Position, RelinkableHandle, Settings, SimpleQuote, TimeUnit, USDLibor, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`forward rate agreement tests ${version}`, () => {
    it('Testing forward rate agreement construction...', () => {
        const spotDate = Settings.evaluationDate.f();
        const curveHandle = new RelinkableHandle();
        const index = new USDLibor(new Period().init1(3, TimeUnit.Months), curveHandle);
        const quotes = [new SimpleQuote(), new SimpleQuote(), new SimpleQuote()];
        const helpers = [
            new FraRateHelper().frahInit7(new Handle(quotes[0]), new Period().init1(1, TimeUnit.Years), index),
            new FraRateHelper().frahInit7(new Handle(quotes[1]), new Period().init1(2, TimeUnit.Years), index),
            new FraRateHelper().frahInit7(new Handle(quotes[2]), new Period().init1(3, TimeUnit.Years), index)
        ];
        const curve = new PiecewiseYieldCurve(new ForwardRate(), new Cubic())
            .pwycInit1(spotDate, helpers, index.dayCounter());
        curveHandle.linkTo(curve);
        const fra = new ForwardRateAgreement(DateExt.advance(spotDate, 6, TimeUnit.Months), DateExt.advance(spotDate, 18, TimeUnit.Months), Position.Type.Long, 0, 1, index, curveHandle);
        quotes[0].setValue(0.01);
        quotes[1].setValue(0.02);
        quotes[2].setValue(0.03);
        const rate = fra.forwardRate().f();
        expect(Math.abs(rate - 0.0100006)).toBeLessThan(1e-6);
    });
});
