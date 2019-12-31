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
import { BoundedGrid, SampledCurve, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class FSquared {
    f(x) {
        return x * x;
    }
}

describe(`Sampled curve tests ${version}`, () => {
    it('Testing sampled curve construction...', () => {
        const curve = new SampledCurve().init2(BoundedGrid(-10.0, 10.0, 100));
        const f2 = new FSquared();
        curve.sample(f2);
        const expected = 100.0;
        expect(Math.abs(curve.value(0) - expected)).toBeLessThan(1e-5);
        curve.set(0, 2.0);
        expect(Math.abs(curve.value(0) - 2.0)).toBeLessThan(1e-5);
        const value = curve.values();
        value[1] = 3.0;
        expect(Math.abs(curve.value(1) - 3.0)).toBeLessThan(1e-5);
        curve.shiftGrid(10.0);
        expect(Math.abs(curve.gridValue(0) - 0.0)).toBeLessThan(1e-5);
        expect(Math.abs(curve.value(0) - 2.0)).toBeLessThan(1e-5);
        curve.sample(f2);
        curve.regrid1(BoundedGrid(0.0, 20.0, 200));
        const tolerance = 1.0e-2;
        for (let i = 0; i < curve.size(); i++) {
            const grid = curve.gridValue(i);
            const value = curve.value(i);
            const expected = f2.f(grid);
            expect(Math.abs(value - expected)).toBeLessThan(tolerance);
        }
    });
});
