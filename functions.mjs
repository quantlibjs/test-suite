import { Complex, Factorial, GammaFunction, M_PI, M_PI_2, modifiedBesselFunction_i, modifiedBesselFunction_i_exponentiallyWeighted, modifiedBesselFunction_ic, modifiedBesselFunction_ic_exponentiallyWeighted, modifiedBesselFunction_k, modifiedBesselFunction_k_exponentiallyWeighted, modifiedBesselFunction_kc, modifiedBesselFunction_kc_exponentiallyWeighted, QL_EPSILON } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

describe('Factorial tests', () => {
    it('Testing factorial numbers...', () => {
        let expected = 1.0;
        let calculated = Factorial.get(0);
        expect(calculated).toEqual(expected);
        for (let i = 1; i < 171; ++i) {
            expected *= i;
            calculated = Factorial.get(i);
            expect(Math.abs(calculated - expected) / expected).toBeLessThan(1.0e-9);
        }
    });
    it('Testing Gamma function...', () => {
        let expected = 0.0;
        let calculated = new GammaFunction().logValue(1);
        expect(Math.abs(calculated)).toBeLessThan(1.0e-15);
        for (let i = 2; i < 9000; i++) {
            expected += Math.log(i);
            calculated = new GammaFunction().logValue(i + 1);
            expect(Math.abs(calculated - expected) / expected).toBeLessThan(1.0e-9);
        }
    });
    it('Testing Gamma values...', () => {
        const tasks = [
            [0.0001, 9999.422883231624, 1e3], [1.2, 0.9181687423997607, 1e3],
            [7.3, 1271.4236336639089586, 1e3], [-1.1, 9.7148063829028946, 1e3],
            [-4.001, -41.6040228304425312, 1e3], [-4.999, -8.347576090315059, 1e3],
            [-19.000001, 8.220610833201313e-12, 1e8],
            [-19.5, 5.811045977502255e-18, 1e3],
            [-21.000001, 1.957288098276488e-14, 1e8],
            [-21.5, 1.318444918321553e-20, 1e6]
        ];
        for (let i = 0; i < tasks.length; ++i) {
            const x = tasks[i][0];
            const expected = tasks[i][1];
            const calculated = new GammaFunction().value(x);
            const tol = tasks[i][2] * QL_EPSILON * Math.abs(expected);
            expect(Math.abs(calculated - expected)).toBeLessThan(tol);
        }
    });
    it('Testing modified Bessel function of first and second kind...', () => {
        const r = [
            [-1.3, 2.0, 1.2079888436539505, 0.1608243636110430],
            [1.3, 2.0, 1.2908192151358788, 0.1608243636110430],
            [0.001, 2.0, 2.2794705965773794, 0.1138938963603362],
            [1.2, 0.5, 0.1768918783499572, 2.1086579232338192],
            [2.3, 0.1, 0.00037954958988425198, 572.096866928290183],
            [-2.3, 1.1, 1.07222017902746969, 1.88152553684107371],
            [-10.0001, 1.1, 13857.7715614282552, 69288858.9474423379]
        ];
        for (let i = 0; i < r.length; ++i) {
            const nu = r[i][0];
            const x = r[i][1];
            const expected_i = r[i][2];
            const expected_k = r[i][3];
            const tol_i = 5e4 * QL_EPSILON * Math.abs(expected_i);
            const tol_k = 5e4 * QL_EPSILON * Math.abs(expected_k);
            const calculated_i = modifiedBesselFunction_i(nu, x);
            const calculated_k = modifiedBesselFunction_k(nu, x);
            expect(Math.abs(expected_i - calculated_i)).toBeLessThan(tol_i);
            expect(Math.abs(expected_k - calculated_k)).toBeLessThan(tol_k);
        }
        const c = [
            [-1.3, 2.0, 0.0, 1.2079888436539505, 0.0, 0.1608243636110430, 0.0],
            [
                1.2, 1.5, 0.3, 0.7891550871263575, 0.2721408731632123,
                0.275126507673411, -0.1316314405663727
            ],
            [
                1.2, -1.5, 0.0, -0.6650597524355781, -0.4831941938091643,
                -0.251112360556051, -2.400130904230102
            ],
            [
                -11.2, 1.5, 0.3, 12780719.20252659, 16401053.26770633,
                -34155172.65672453, -43830147.36759921
            ],
            [
                1.2, -1.5, 2.0, -0.3869803778520574, 0.9756701796853728,
                -3.111629716783005, 0.6307859871879062
            ],
            [
                1.2, 0.0, 9.9999, -0.03507838078252647, 0.1079601550451466,
                -0.05979939995451453, 0.3929814473878203
            ],
            [
                1.2, 0.0, 10.1, -0.02782046891519293, 0.08562259917678558,
                -0.02035685034691133, 0.3949834389686676
            ],
            [
                1.2, 0.0, 12.1, 0.07092110620741207, -0.2182727210128104,
                0.3368505862966958, -0.1299038064313366
            ],
            [
                1.2, 0.0, 14.1, -0.03014378676768797, 0.09277303628303372,
                -0.237531022649052, -0.2351923034581644
            ],
            [
                1.2, 0.0, 16.1, -0.03823210284792657, 0.1176663135266562,
                -0.1091239402448228, 0.2930535651966139
            ],
            [
                1.2, 0.0, 18.1, 0.05626742394733754, -0.173173324361983,
                0.2941636588154642, -0.02023355577954348
            ],
            [
                1.2, 0.0, 180.1, -0.001230682086826484, 0.003787649998122361,
                0.02284509628723454, 0.09055419580980778
            ],
            [
                1.2, 0.0, 21.0, -0.04746415965014021, 0.1460796627610969,
                -0.2693825171336859, -0.04830804448126782
            ],
            [1.2, 10.0, 0.0, 2609.784936867044, 0, 1.904394919838336e-05, 0],
            [1.2, 14.0, 0.0, 122690.4873454286, 0, 2.902060692576643e-07, 0],
            [
                1.2, 20.0, 10.0, -37452017.91168936, -13917587.22151363,
                -3.821534367487143e-10, 4.083211255351664e-10
            ],
            [
                1.2, 9.0, 9.0, -621.7335051293694, 618.1455736670332,
                -4.480795479964915e-05, -3.489034389148745e-08
            ]
        ];
        for (let i = 0; i < c.length; ++i) {
            const nu = c[i][0];
            const z = new Complex(c[i][1], c[i][2]);
            const expected_i = new Complex(c[i][3], c[i][4]);
            const expected_k = new Complex(c[i][5], c[i][6]);
            const tol_i = 5e4 * QL_EPSILON * Complex.abs(expected_i);
            const tol_k = 1e6 * QL_EPSILON * Complex.abs(expected_k);
            const calculated_i = modifiedBesselFunction_ic(nu, z);
            const calculated_k = modifiedBesselFunction_kc(nu, z);
            expect(Complex.abs(Complex.sub(expected_i, calculated_i)))
                .toBeLessThan(tol_i);
            expect(Complex.abs(expected_k))
                .toBeLessThan(1e-4);
            expect(Complex.abs(Complex.sub(expected_k, calculated_k)))
                .toBeLessThan(tol_k);
        }
    });
    it('Testing weighted modified Bessel functions...', () => {
        let nu = -5.0;
        while (nu <= 5.0) {
            let x = 0.1;
            while (x <= 15.0) {
                const calculated_i = modifiedBesselFunction_i_exponentiallyWeighted(nu, x);
                const expected_i = modifiedBesselFunction_i(nu, x) * Math.exp(-x);
                const calculated_k = modifiedBesselFunction_k_exponentiallyWeighted(nu, x);
                const expected_k = M_PI_2 *
                    (modifiedBesselFunction_i(-nu, x) -
                        modifiedBesselFunction_i(nu, x)) *
                    Math.exp(-x) / Math.sin(M_PI * nu);
                const tol_i = 1e3 * QL_EPSILON * Math.abs(expected_i) *
                    Math.max(Math.exp(x), 1.0);
                const tol_k = Math.max(QL_EPSILON, 1e3 * QL_EPSILON * Math.abs(expected_k) *
                    Math.max(Math.exp(x), 1.0));
                expect(Math.abs(expected_i - calculated_i)).toBeLessThan(tol_i);
                expect(Math.abs(expected_k - calculated_k)).toBeLessThan(tol_k);
                x += 0.5;
            }
            nu += 0.5;
        }
        nu = -5.0;
        while (nu <= 5.0) {
            let x = -5.0;
            while (x <= 5.0) {
                let y = -5.0;
                while (y <= 5.0) {
                    const z = new Complex(x, y);
                    const calculated_i = modifiedBesselFunction_ic_exponentiallyWeighted(nu, z);
                    const expected_i = Complex.mul(modifiedBesselFunction_ic(nu, z), Complex.exp(z.mulScalar(-1)));
                    const calculated_k = modifiedBesselFunction_kc_exponentiallyWeighted(nu, z);
                    const expected_k = Complex.mulScalar(Complex.sub(Complex.mul(modifiedBesselFunction_ic(-nu, z), Complex.exp(z.mulScalar(-1))), Complex.mul(modifiedBesselFunction_ic(nu, z), Complex.exp(z.mulScalar(-1)))), M_PI_2 / Math.sin(M_PI * nu));
                    const tol_i = 1e3 * QL_EPSILON * Complex.abs(calculated_i);
                    const tol_k = 1e3 * QL_EPSILON * Complex.abs(calculated_k);
                    expect(Complex.abs(Complex.sub(calculated_i, expected_i)))
                        .toBeLessThan(tol_i);
                    expect(Complex.abs(Complex.sub(calculated_k, expected_k)))
                        .toBeLessThan(tol_k);
                    y += 0.5;
                }
                x += 0.5;
            }
            nu += 0.5;
        }
    });
});