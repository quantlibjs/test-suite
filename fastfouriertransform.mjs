import { Complex, FastFourierTransform, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

describe(`fast fourier transform tests ${version}`, () => {
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