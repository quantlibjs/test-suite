import { Bisection, Brent, FalsePosition, FiniteDifferenceNewtonSafe, Halley, HalleySafe, Newton, NewtonSafe, QL_NULL_REAL, Ridder, Secant, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

class F1 {
    f(x) {
        return x * x - 1.0;
    }

    d(x) {
        return 2.0 * x;
    }

    d2(x) {
        return 0.5 / x;
    }
}

class F2 {
    f(x) {
        return 1.0 - x * x;
    }

    d(x) {
        return -2.0 * x;
    }

    d2(x) {
        return 0.5 / x;
    }
}

class F3 {
    f(x) {
        return Math.atan(x - 1);
    }

    d(x) {
        return 1.0 / (1.0 + (x - 1.0) * (x - 1.0));
    }

    d2(x) {
        return -x / (1 + x * x);;
    }
}

function test_not_bracketed(solver, name, f, guess) {
    const accuracy = [1.0e-4, 1.0e-6, 1.0e-8];
    const expected = 1.0;
    for (let i = 0; i < accuracy.length; i++) {
        const root = solver.solve1(f, accuracy[i], guess, 0.1);
        expect(Math.abs(root - expected)).toBeLessThan(accuracy[i]);
    }
}

function test_bracketed(solver, name, f, guess) {
    const accuracy = [1.0e-4, 1.0e-6, 1.0e-8];
    const expected = 1.0;
    for (let i = 0; i < accuracy.length; i++) {
        const root = solver.solve2(f, accuracy[i], guess, 0.0, 2.0);
        expect(Math.abs(root - expected)).toBeLessThan(accuracy[i]);
    }
}

class Probe {
    constructor(result, offset) {
        this._result = result;
        this._offset = offset;
        this._previous = result.result;
    }

    f(x) {
        this._result.result = x;
        return this._previous + this._offset - x * x;
    }

    d(x) {
        return 2.0 * x;
    }

    d2(x) {
        return 0.5 / x;
    }
}

function test_last_call_with_root(solver, name, bracketed, accuracy) {
    const mins = [3.0, 2.25, 1.5, 1.0];
    const maxs = [7.0, 5.75, 4.5, 3.0];
    const steps = [0.2, 0.2, 0.1, 0.1];
    const offsets = [25.0, 11.0, 5.0, 1.0];
    const guesses = [4.5, 4.5, 2.5, 2.5];
    const byref = { result: 0.0 };
    let result;
    for (let i = 0; i < 4; ++i) {
        if (bracketed) {
            result = solver.solve2(new Probe(byref, offsets[i]), accuracy, guesses[i], mins[i], maxs[i]);
        }
        else {
            result = solver.solve1(new Probe(byref, offsets[i]), accuracy, guesses[i], steps[i]);
        }
        expect(result).toEqual(byref.result);
    }
}

function test_solver(solver, name, accuracy) {
    test_not_bracketed(solver, name, new F1(), 0.5);
    test_bracketed(solver, name, new F1(), 0.5);
    test_not_bracketed(solver, name, new F1(), 1.5);
    test_bracketed(solver, name, new F1(), 1.5);
    test_not_bracketed(solver, name, new F2(), 0.5);
    test_bracketed(solver, name, new F2(), 0.5);
    test_not_bracketed(solver, name, new F2(), 1.5);
    test_bracketed(solver, name, new F2(), 1.5);
    test_not_bracketed(solver, name, new F3(), 1.00001);
    if (accuracy !== QL_NULL_REAL) {
        test_last_call_with_root(solver, name, false, accuracy);
        test_last_call_with_root(solver, name, true, accuracy);
    }
}

describe(`1-D solver tests ${version}`, () => {
    it('Testing Brent solver...', () => {
        test_solver(new Brent(), 'Brent', 1.0e-6);
    });

    it('Testing bisection solver...', () => {
        test_solver(new Bisection(), 'Bisection', 1.0e-6);
    });

    it('Testing false-position solver...', () => {
        test_solver(new FalsePosition(), 'FalsePosition', 1.0e-6);
    });

    it('Testing Newton solver...', () => {
        test_solver(new Newton(), 'Newton', 1.0e-12);
    });

    it('Testing Newton-safe solver...', () => {
        test_solver(new NewtonSafe(), 'NewtonSafe', 1.0e-9);
    });

    it('Testing Halley solver...', () => {
        test_solver(new Halley(), 'Newton', 1.0e-12);
    });

    it('Testing Halley-safe solver...', () => {
        test_solver(new HalleySafe(), 'NewtonSafe', 1.0e-9);
    });

    it('Testing finite-difference Newton-safe solver...', () => {
        test_solver(new FiniteDifferenceNewtonSafe(), 'FiniteDifferenceNewtonSafe', QL_NULL_REAL);
    });

    it('Testing Ridder solver...', () => {
        test_solver(new Ridder(), 'Ridder', 1.0e-6);
    });

    it('Testing secant solver...', () => {
        test_solver(new Secant(), 'Secant', 1.0e-6);
    });
});