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
import { FastFourierTransform, Complex, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`Fast fourier transform tests ${version}`, () => {
    it('Testing complex direct FFT...', () => {
        const a = [
            new Complex(0, 0), new Complex(1, 1), new Complex(3, 3),
            new Complex(4, 4), new Complex(4, 4), new Complex(3, 3),
            new Complex(1, 1), new Complex(0, 0)
        ];
        const b = new Array(8);
        const fft = new FastFourierTransform(3);
        fft.transform(a, b);
        const expected = [
            new Complex(16, 16), new Complex(-4.8284, -11.6569), new Complex(0, 0),
            new Complex(-0.3431, 0.8284), new Complex(0, 0),
            new Complex(0.8284, -0.3431), new Complex(0, 0),
            new Complex(-11.6569, -4.8284)
        ];
        for (let i = 0; i < 8; i++) {
            expect(Math.abs(b[i].real() - expected[i].real())).toBeLessThan(1.0e-2);
            expect(Math.abs(b[i].imag() - expected[i].imag())).toBeLessThan(1.0e-2);
        }
    });
    
    it('Testing convolution via inverse FFT...', () => {
        const x = [new Complex(1), new Complex(2), new Complex(3)];
        const order = FastFourierTransform.min_order(x.length) + 1;
        const fft = new FastFourierTransform(order);
        const nFrq = fft.output_size();
        const ft = new Array(nFrq);
        for (let x = 0; x < nFrq; x++) {
            ft[x] = new Complex();
        }
        const tmp = new Array(nFrq);
        const z = new Complex();
        fft.inverse_transform(x, ft);
        for (let i = 0; i < nFrq; ++i) {
            tmp[i] = new Complex(ft[i].norm());
            ft[i] = z;
        }
        fft.inverse_transform(tmp, ft);
        let calculated;
        let expected;
        calculated = ft[0].real() / nFrq;
        expected = x[0].real() * x[0].real() + x[1].real() * x[1].real() +
            x[2].real() * x[2].real();
        expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
        calculated = ft[1].real() / nFrq;
        expected = x[0].real() * x[1].real() + x[1].real() * x[2].real();
        expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
        calculated = ft[2].real() / nFrq;
        expected = x[0].real() * x[2].real();
        expect(Math.abs(calculated - expected)).toBeLessThan(1.0e-10);
    });
});
