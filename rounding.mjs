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
import { CeilingTruncation, ClosestRounding, Comparison, DownRounding, FloorTruncation, UpRounding, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class TestCase {
    constructor(x, precision, closest, up, down, floor, ceiling) {
        this.x = x;
        this.precision = precision;
        this.closest = closest;
        this.up = up;
        this.down = down;
        this.floor = floor;
        this.ceiling = ceiling;
    }
}

const testData = [
    new TestCase(0.86313513, 5, 0.86314, 0.86314, 0.86313, 0.86314, 0.86313),
    new TestCase(0.86313, 5, 0.86313, 0.86313, 0.86313, 0.86313, 0.86313),
    new TestCase(-7.64555346, 1, -7.6, -7.7, -7.6, -7.6, -7.6),
    new TestCase(0.13961605, 2, 0.14, 0.14, 0.13, 0.14, 0.13),
    new TestCase(0.14344179, 4, 0.1434, 0.1435, 0.1434, 0.1434, 0.1434),
    new TestCase(-4.74315016, 2, -4.74, -4.75, -4.74, -4.74, -4.74),
    new TestCase(-7.82772074, 5, -7.82772, -7.82773, -7.82772, -7.82772, -7.82772),
    new TestCase(2.74137947, 3, 2.741, 2.742, 2.741, 2.741, 2.741),
    new TestCase(2.13056714, 1, 2.1, 2.2, 2.1, 2.1, 2.1),
    new TestCase(-1.06228670, 1, -1.1, -1.1, -1.0, -1.0, -1.1),
    new TestCase(8.29234094, 4, 8.2923, 8.2924, 8.2923, 8.2923, 8.2923),
    new TestCase(7.90185598, 2, 7.90, 7.91, 7.90, 7.90, 7.90),
    new TestCase(-0.26738058, 1, -0.3, -0.3, -0.2, -0.2, -0.3),
    new TestCase(1.78128713, 1, 1.8, 1.8, 1.7, 1.8, 1.7),
    new TestCase(4.23537260, 1, 4.2, 4.3, 4.2, 4.2, 4.2),
    new TestCase(3.64369953, 4, 3.6437, 3.6437, 3.6436, 3.6437, 3.6436),
    new TestCase(6.34542470, 2, 6.35, 6.35, 6.34, 6.35, 6.34),
    new TestCase(-0.84754962, 4, -0.8475, -0.8476, -0.8475, -0.8475, -0.8475),
    new TestCase(4.60998652, 1, 4.6, 4.7, 4.6, 4.6, 4.6),
    new TestCase(6.28794223, 3, 6.288, 6.288, 6.287, 6.288, 6.287),
    new TestCase(7.89428221, 2, 7.89, 7.90, 7.89, 7.89, 7.89)
];

describe(`Rounding tests ${version}`, () => {
    it('Testing closest decimal rounding...', () => {
        for (let i = 0; i < testData.length; i++) {
            const digits = testData[i].precision;
            const closest = new ClosestRounding(digits);
            const calculated = closest.f(testData[i].x);
            const expected = testData[i].closest;
            expect(Comparison.close(calculated, expected, 1)).toEqual(true);
        }
    });

    it('Testing upward decimal rounding...', () => {
        for (let i = 0; i < testData.length; i++) {
            const digits = testData[i].precision;
            const up = new UpRounding(digits);
            const calculated = up.f(testData[i].x);
            const expected = testData[i].up;
            expect(Comparison.close(calculated, expected, 1)).toEqual(true);
        }
    });

    it('Testing downward decimal rounding...', () => {
        for (let i = 0; i < testData.length; i++) {
            const digits = testData[i].precision;
            const down = new DownRounding(digits);
            const calculated = down.f(testData[i].x);
            const expected = testData[i].down;
            expect(Comparison.close(calculated, expected, 1)).toEqual(true);
        }
    });

    it('Testing floor decimal rounding...', () => {
        for (let i = 0; i < testData.length; i++) {
            const digits = testData[i].precision;
            const floor = new FloorTruncation(digits);
            const calculated = floor.f(testData[i].x);
            const expected = testData[i].floor;
            expect(Comparison.close(calculated, expected, 1)).toEqual(true);
        }
    });

    it('Testing ceiling decimal rounding...', () => {
        for (let i = 0; i < testData.length; i++) {
            const digits = testData[i].precision;
            const ceiling = new CeilingTruncation(digits);
            const calculated = ceiling.f(testData[i].x);
            const expected = testData[i].ceiling;
            expect(Comparison.close(calculated, expected, 1)).toEqual(true);
        }
    });
});
