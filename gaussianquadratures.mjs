import { constant, cube, CumulativeNormalDistribution, fourth_power, GaussChebyshev2ndIntegration, GaussChebyshevIntegration, GaussGegenbauerIntegration, GaussHermiteIntegration, GaussHyperbolicIntegration, GaussianQuadrature, GaussLaguerreIntegration, GaussLegendreIntegration, GaussNonCentralChiSquaredPolynomial, identity, M_PI, NonCentralChiSquareDistribution, NormalDistribution, square, TabulatedGaussLegendre } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

const tolerance = 1.0e-4;

function testSingle(I, tag, f, expected) {
    const calculated = I.f(f);
    expect(Math.abs(calculated - expected)).toBeLessThan(tolerance);
}

const inv_exp = {
    f: (x) => {
        return Math.exp(-x);
    }
};

const x_inv_exp = {
    f: (x) => {
        return x * Math.exp(-x);
    }
};

const x_normaldistribution = {
    f: (x) => {
        return x * (new NormalDistribution().f(x));
    }
};

const x_x_normaldistribution = {
    f: (x) => {
        return x * x * (new NormalDistribution().f(x));
    }
};

const inv_cosh = {
    f: (x) => {
        return 1 / Math.cosh(x);
    }
};

const x_inv_cosh = {
    f: (x) => {
        return x / Math.cosh(x);
    }
};

const x_x_nonCentralChiSquared = {
  f: (x) => {
    return x * x * new NonCentralChiSquareDistribution(4.0, 1.0).f(x);
  }
};

const x_sin_exp_nonCentralChiSquared = {
  f: (x) => {
    return x * Math.sin(0.1 * x) * Math.exp(0.3 * x) *
        new NonCentralChiSquareDistribution(1.0, 1.0).f(x);
  }
};

function testSingleJacobi(I) {
    testSingle(I, 'f(x) = 1', new constant(1.0), 2.0);
    testSingle(I, 'f(x) = x', new identity(), 0.0);
    testSingle(I, 'f(x) = x^2', new square(), 2 / 3.);
    testSingle(I, 'f(x) = sin(x)', { f: Math.sin }, 0.0);
    testSingle(I, 'f(x) = cos(x)', { f: Math.cos }, Math.sin(1.0) - Math.sin(-1.0));
    testSingle(I, 'f(x) = Gaussian(x)', new NormalDistribution(), new CumulativeNormalDistribution().f(1.0) -
        new CumulativeNormalDistribution().f(-1.0));
}

function testSingleLaguerre(I) {
    testSingle(I, 'f(x) = exp(-x)', inv_exp, 1.0);
    testSingle(I, 'f(x) = x*exp(-x)', x_inv_exp, 1.0);
    testSingle(I, 'f(x) = Gaussian(x)', new NormalDistribution(), 0.5);
}

function testSingleTabulated(f, tag, expected, tolerance) {
    const order = [6, 7, 12, 20];
    const quad = new TabulatedGaussLegendre();
    for (let i = 0; i < order.length; i++) {
        quad.order1(order[i]);
        const realised = quad.f(f);
        expect(Math.abs(realised - expected)).toBeLessThan(tolerance);
    }
}

describe('Gaussian quadratures tests', () => {
    it('Testing Gauss-Jacobi integration...', () => {
        testSingleJacobi(new GaussLegendreIntegration(16));
        testSingleJacobi(new GaussChebyshevIntegration(130));
        testSingleJacobi(new GaussChebyshev2ndIntegration(130));
        testSingleJacobi(new GaussGegenbauerIntegration(50, 0.55));
    });

    it('Testing Gauss-Laguerre integration...', () => {
        testSingleLaguerre(new GaussLaguerreIntegration(16));
        testSingleLaguerre(new GaussLaguerreIntegration(150, 0.01));
        testSingle(new GaussLaguerreIntegration(16, 1.0), 'f(x) = x*exp(-x)', x_inv_exp, 1.0);
        testSingle(new GaussLaguerreIntegration(32, 0.9), 'f(x) = x*exp(-x)', x_inv_exp, 1.0);
    });

    it('Testing Gauss-Hermite integration...', () => {
        testSingle(new GaussHermiteIntegration(16), 'f(x) = Gaussian(x)', new NormalDistribution(), 1.0);
        testSingle(new GaussHermiteIntegration(16, 0.5), 'f(x) = x*Gaussian(x)', x_normaldistribution, 0.0);
        testSingle(new GaussHermiteIntegration(64, 0.9), 'f(x) = x*x*Gaussian(x)', x_x_normaldistribution, 1.0);
    });

    it('Testing Gauss hyperbolic integration...', () => {
        testSingle(new GaussHyperbolicIntegration(16), 'f(x) = 1/cosh(x)', inv_cosh, M_PI);
        testSingle(new GaussHyperbolicIntegration(16), 'f(x) = x/cosh(x)', x_inv_cosh, 0.0);
    });

    it('Testing tabulated Gauss-Laguerre integration...', () => {
        testSingleTabulated(new constant(1.0), 'f(x) = 1', 2.0, 1.0e-13);
        testSingleTabulated(new identity(), 'f(x) = x', 0.0, 1.0e-13);
        testSingleTabulated(new square(), 'f(x) = x^2', (2.0 / 3.0), 1.0e-13);
        testSingleTabulated(new cube(), 'f(x) = x^3', 0.0, 1.0e-13);
        testSingleTabulated(new fourth_power(), 'f(x) = x^4', (2.0 / 5.0), 1.0e-13);
    });
});

describe('Gaussian quadratures experimental tests', () => {
  it('Testing Gauss non-central chi-squared integration...', () => {
        testSingle(new GaussianQuadrature(2, new GaussNonCentralChiSquaredPolynomial(4.0, 1.0)), 'f(x) = x^2 * nonCentralChiSquared(4, 1)(x)', x_x_nonCentralChiSquared, 37.0);
        testSingle(new GaussianQuadrature(14, new GaussNonCentralChiSquaredPolynomial(1.0, 1.0)), 'f(x) = x * sin(0.1*x)*exp(0.3*x)*nonCentralChiSquared(1, 1)(x)', x_sin_exp_nonCentralChiSquared, 17.408092);
  });

  it('Testing Gauss non-central chi-squared sum of notes...', () => {
        const expected = [
            47.53491786730293, 70.6103295419633383, 98.0593406849441607,
            129.853401537905341, 165.96963582663912, 206.389183233992043
        ];
        const nu = 4.0;
        const lambda = 1.0;
        const orthPoly = new GaussNonCentralChiSquaredPolynomial(nu, lambda);
        const tol = 1e-5;
        for (let n = 4; n < 10; ++n) {
            const x = new GaussianQuadrature(n, orthPoly).x();
            const calculated = x.reduce((p, c) => p + c, 0);
            expect(Math.abs(calculated - expected[n - 4])).toBeLessThan(tol);
        }
    });
});