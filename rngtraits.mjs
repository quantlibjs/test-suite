import { Comparison, InverseCumulativePoisson, PoissonPseudoRandom, PseudoRandom } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

describe('RNG traits tests', () => {
    it('Testing Gaussian pseudo-random number generation...', () => {
        const rsg = new PseudoRandom().make_sequence_generator(100, 1234);
        const values = rsg.nextSequence().value;
        let sum = 0.0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i];
        }
        const stored = 4.09916;
        const tolerance = 1.0e-5;
        expect(Math.abs(sum - stored)).toBeLessThan(tolerance);
    });
    it('Testing Poisson pseudo-random number generation...', () => {
        const rsg = new PoissonPseudoRandom().make_sequence_generator(100, 1234);
        const values = rsg.nextSequence().value;
        let sum = 0.0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i];
        }
        const stored = 108.0;
        expect(Comparison.close(sum, stored)).toBeTruthy();
    });
    it('Testing custom Poisson pseudo-random number generation...', () => {
        const g = new PoissonPseudoRandom();
        g.IC = new InverseCumulativePoisson(4.0);
        const rsg = g.make_sequence_generator(100, 1234);
        const values = rsg.nextSequence().value;
        let sum = 0.0;
        for (let i = 0; i < values.length; i++) {
            sum += values[i];
        }
        const stored = 409.0;
        expect(Comparison.close(sum, stored)).toBeTruthy();
    });
});