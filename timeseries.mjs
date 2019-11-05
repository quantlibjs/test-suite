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
import { IntervalPrice, Month, TimeSeries, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
const second = 1;

describe(`time series tests ${version}`, () => {
    it('Testing time series construction...', () => {
        const ts = new TimeSeries();
        ts.set(new Date(2005, Month.March - 1, 25), 1.2);
        ts.set(new Date(2005, Month.March - 1, 29), 2.3);
        ts.set(new Date(2005, Month.March - 1, 15), 0.3);
        ts.sort();
        expect(ts.firstDate().valueOf())
            .toEqual(new Date(2005, Month.March - 1, 15).valueOf());
        expect(ts.first()[second]).toEqual(0.3);
        ts.set(new Date(2005, Month.March - 1, 15), 3.5);
        expect(ts.first()[second]).toEqual(3.5);
    });
    it('Testing time series interval price...', () => {
        const date = [];
        const open = [], close = [], high = [], low = [];
        date.push(new Date(2005, Month.March - 1, 25));
        date.push(new Date(2005, Month.March - 1, 29));
        open.push(1.3);
        open.push(2.3);
        close.push(2.3);
        close.push(3.4);
        high.push(3.4);
        high.push(3.5);
        low.push(3.4);
        low.push(3.2);
        const tsiq = IntervalPrice.makeSeries(date, open, close, high, low);
        expect(tsiq.firstDate().valueOf())
            .toEqual(new Date(2005, Month.March - 1, 25).valueOf());
    });
    it('Testing time series iterators...', () => {
    });
});
