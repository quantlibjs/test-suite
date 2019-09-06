const M_PI = 3.141592653589793238462643383280;

export class Complex {
    constructor(r = 0.0, i = 0.0) {
        this._real = 0.0;
        this._imag = 0.0;
        this._real = r;
        this._imag = i;
    }
    real() {
        return this._real;
    }
    imag() {
        return this._imag;
    }
    norm() {
        return this._real * this._real + this._imag * this._imag;
    }
    abs() {
        return Math.sqrt(this.norm());
    }
    clone() {
        return new Complex(this._real, this._imag);
    }
    add(c) {
        if (c == null) {
            c = new Complex();
        }
        return new Complex(this._real + c.real(), this._imag + c.imag());
    }
    addScalar(s) {
        return new Complex(this._real + s, this._imag);
    }
    sub(c) {
        if (c == null) {
            c = new Complex();
        }
        return new Complex(this._real - c.real(), this._imag - c.imag());
    }
    subScalar(s) {
        return new Complex(this._real - s, this._imag);
    }
    mul(c) {
        if (c == null) {
            c = new Complex();
        }
        return new Complex(this._real * c.real() - this._imag * c.imag(), this._real * c.imag() + this._imag * c.real());
    }
    mulScalar(r) {
        return new Complex(this._real * r, this._imag * r);
    }
    div(c) {
        if (c == null) {
            c = new Complex();
        }
        return new Complex((this._real * c._real + this._imag * c._imag) / c.norm(), (this._imag * c._real - this._real * c._imag) / c.norm());
    }
    divScalar(r) {
        return new Complex(this._real / r, this._imag / r);
    }
    toString() {
        return `${this._real} ${this._imag >= 0 ? '+' : '-'} ` +
            `${Math.abs(this._imag)}i`;
    }
}
(function (Complex) {
    function newArray(n) {
        const result = new Array(n);
        for (let i = 0; i < n; i++) {
            result[i] = new Complex();
        }
        return result;
    }
    Complex.newArray = newArray;
    function cloneArray(c) {
        return c.map(c => new Complex(c.real(), c.imag()));
    }
    Complex.cloneArray = cloneArray;
    function abs(c) {
        return c.abs();
    }
    Complex.abs = abs;
    function add(c1, c2) {
        return new Complex(c1.real() + c2.real(), c1.imag() + c2.imag());
    }
    Complex.add = add;
    function addScalar(c, s) {
        return new Complex(c.real() + s, c.imag());
    }
    Complex.addScalar = addScalar;
    function sub(c1, c2) {
        return new Complex(c1.real() - c2.real(), c1.imag() - c2.imag());
    }
    Complex.sub = sub;
    function subScalar(c, s) {
        return new Complex(c.real() - s, c.imag());
    }
    Complex.subScalar = subScalar;
    function mul(c1, c2) {
        return new Complex(c1.real() * c2.real() - c1.imag() * c2.imag(), c1.real() * c2.imag() + c1.imag() * c2.real());
    }
    Complex.mul = mul;
    function mulScalar(c, s) {
        return new Complex(s * c.real(), s * c.imag());
    }
    Complex.mulScalar = mulScalar;
    function div(c1, c2) {
        return new Complex(c1._real * c2._real + c1._imag * c2._imag, c1._imag * c2._real - c1._real * c2._imag);
    }
    Complex.div = div;
    function divScalar(c, s) {
        return new Complex(s / c.real(), s / c.imag());
    }
    Complex.divScalar = divScalar;
    function pow(c, n) {
        if (c == null) {
            throw new Error('null complex number');
        }
        let r = Math.sqrt(c.norm());
        let theta = Math.atan(c.imag() / c.real());
        r = Math.pow(r, n);
        theta *= n;
        return new Complex(r * Math.cos(theta), r * Math.sin(theta));
    }
    Complex.pow = pow;
    function sqrt(c) {
        return pow(c, 0.5);
    }
    Complex.sqrt = sqrt;
    function exp(c) {
        return new Complex(Math.exp(c.real()) * Math.cos(c.imag()), Math.exp(c.real()) * Math.sin(c.imag()));
    }
    Complex.exp = exp;
    function log(c) {
        const abs = c.abs();
        let arctan = Math.atan(c.imag() / c.real());
        const log = Math.log(abs);
        if (c.real() < 0) {
            arctan += M_PI;
        }
        return new Complex(log, arctan);
    }
    Complex.log = log;
    function equal(c1, c2) {
        return c1._real === c2._real && c1._imag === c2._imag;
    }
    Complex.equal = equal;
    function notEqual(c1, c2) {
        return !Complex.equal(c1, c2);
    }
    Complex.notEqual = notEqual;
})(Complex || (Complex = {}));
//# sourceMappingURL=complex.js.map