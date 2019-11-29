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
import { ConstantEstimator, DateExt, SimpleLocalEstimator, TimeSeries, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`volatility models tests ${version}`, () => {
    it('Testing volatility model construction...', () => {
        const ts = new TimeSeries();
        ts.set(DateExt.UTC('25,March,2005'), 1.2);
        ts.set(DateExt.UTC('29,March,2005'), 2.3);
        ts.set(DateExt.UTC('15,March,2005'), 0.3);
        const sle = new SimpleLocalEstimator(1 / 360.0);
        const locale = sle.calculate1(ts);
        const ce = new ConstantEstimator(1);
        const sv = ce.calculate1(locale);
        expect(()=>{}).not.toThrow();
    });
});
