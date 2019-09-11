import { constant, cube, CumulativeNormalDistribution, fourth_power, GaussChebyshev2ndIntegration, GaussChebyshevIntegration, GaussGegenbauerIntegration, GaussHermiteIntegration, GaussHyperbolicIntegration, GaussLaguerreIntegration, GaussLegendreIntegration, identity, M_PI, NormalDistribution, square, TabulatedGaussLegendre } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

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
    });
    it('Testing Gauss non-central chi-squared sum of notes...', () => {
    });
});