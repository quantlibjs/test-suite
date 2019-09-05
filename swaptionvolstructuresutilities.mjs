import { Actual365Fixed, Array2D, BusinessDayConvention, Handle, Period, SimpleQuote, TARGET, TimeUnit } from '/ql.mjs';
class SwaptionTenors {
}
export class SwaptionMarketConventions {
    setConventions() {
        this.calendar = new TARGET();
        this.optionBdc = BusinessDayConvention.ModifiedFollowing;
        this.dayCounter = new Actual365Fixed();
    }
}
export class AtmVolatility {
    constructor() {
        this.tenors = new SwaptionTenors();
    }
    setMarketData() {
        this.tenors.options = new Array(6);
        this.tenors.options[0] = new Period().init1(1, TimeUnit.Months);
        this.tenors.options[1] = new Period().init1(6, TimeUnit.Months);
        this.tenors.options[2] = new Period().init1(1, TimeUnit.Years);
        this.tenors.options[3] = new Period().init1(5, TimeUnit.Years);
        this.tenors.options[4] = new Period().init1(10, TimeUnit.Years);
        this.tenors.options[5] = new Period().init1(30, TimeUnit.Years);
        this.tenors.swaps = new Array(4);
        this.tenors.swaps[0] = new Period().init1(1, TimeUnit.Years);
        this.tenors.swaps[1] = new Period().init1(5, TimeUnit.Years);
        this.tenors.swaps[2] = new Period().init1(10, TimeUnit.Years);
        this.tenors.swaps[3] = new Period().init1(30, TimeUnit.Years);
        this.vols =
            Array2D.newMatrix(this.tenors.options.length, this.tenors.swaps.length);
        this.vols[0][0] = 0.1300;
        this.vols[0][1] = 0.1560;
        this.vols[0][2] = 0.1390;
        this.vols[0][3] = 0.1220;
        this.vols[1][0] = 0.1440;
        this.vols[1][1] = 0.1580;
        this.vols[1][2] = 0.1460;
        this.vols[1][3] = 0.1260;
        this.vols[2][0] = 0.1600;
        this.vols[2][1] = 0.1590;
        this.vols[2][2] = 0.1470;
        this.vols[2][3] = 0.1290;
        this.vols[3][0] = 0.1640;
        this.vols[3][1] = 0.1470;
        this.vols[3][2] = 0.1370;
        this.vols[3][3] = 0.1220;
        this.vols[4][0] = 0.1400;
        this.vols[4][1] = 0.1300;
        this.vols[4][2] = 0.1250;
        this.vols[4][3] = 0.1100;
        this.vols[5][0] = 0.1130;
        this.vols[5][1] = 0.1090;
        this.vols[5][2] = 0.1070;
        this.vols[5][3] = 0.0930;
        this.volsHandle =
            new Array(this.tenors.options.length);
        for (let i = 0; i < this.tenors.options.length; i++) {
            this.volsHandle[i] = new Array(this.tenors.swaps.length);
            for (let j = 0; j < this.tenors.swaps.length; j++) {
                this.volsHandle[i][j] =
                    new Handle(new SimpleQuote(this.vols[i][j]));
            }
        }
    }
}
export class VolatilityCube {
    constructor() {
        this.tenors = new SwaptionTenors();
    }
    setMarketData() {
        this.tenors.options = new Array(3);
        this.tenors.options[0] = new Period().init1(1, TimeUnit.Years);
        this.tenors.options[1] = new Period().init1(10, TimeUnit.Years);
        this.tenors.options[2] = new Period().init1(30, TimeUnit.Years);
        this.tenors.swaps = new Array(3);
        this.tenors.swaps[0] = new Period().init1(2, TimeUnit.Years);
        this.tenors.swaps[1] = new Period().init1(10, TimeUnit.Years);
        this.tenors.swaps[2] = new Period().init1(30, TimeUnit.Years);
        this.strikeSpreads = new Array(5);
        this.strikeSpreads[0] = -0.020;
        this.strikeSpreads[1] = -0.005;
        this.strikeSpreads[2] = +0.000;
        this.strikeSpreads[3] = +0.005;
        this.strikeSpreads[4] = +0.020;
        this.volSpreads = Array2D.newMatrix(this.tenors.options.length * this.tenors.swaps.length, this.strikeSpreads.length);
        this.volSpreads[0][0] = 0.0599;
        this.volSpreads[0][1] = 0.0049;
        this.volSpreads[0][2] = 0.0000;
        this.volSpreads[0][3] = -0.0001;
        this.volSpreads[0][4] = 0.0127;
        this.volSpreads[1][0] = 0.0729;
        this.volSpreads[1][1] = 0.0086;
        this.volSpreads[1][2] = 0.0000;
        this.volSpreads[1][3] = -0.0024;
        this.volSpreads[1][4] = 0.0098;
        this.volSpreads[2][0] = 0.0738;
        this.volSpreads[2][1] = 0.0102;
        this.volSpreads[2][2] = 0.0000;
        this.volSpreads[2][3] = -0.0039;
        this.volSpreads[2][4] = 0.0065;
        this.volSpreads[3][0] = 0.0465;
        this.volSpreads[3][1] = 0.0063;
        this.volSpreads[3][2] = 0.0000;
        this.volSpreads[3][3] = -0.0032;
        this.volSpreads[3][4] = -0.0010;
        this.volSpreads[4][0] = 0.0558;
        this.volSpreads[4][1] = 0.0084;
        this.volSpreads[4][2] = 0.0000;
        this.volSpreads[4][3] = -0.0050;
        this.volSpreads[4][4] = -0.0057;
        this.volSpreads[5][0] = 0.0576;
        this.volSpreads[5][1] = 0.0083;
        this.volSpreads[5][2] = 0.0000;
        this.volSpreads[5][3] = -0.0043;
        this.volSpreads[5][4] = -0.0014;
        this.volSpreads[6][0] = 0.0437;
        this.volSpreads[6][1] = 0.0059;
        this.volSpreads[6][2] = 0.0000;
        this.volSpreads[6][3] = -0.0030;
        this.volSpreads[6][4] = -0.0006;
        this.volSpreads[7][0] = 0.0533;
        this.volSpreads[7][1] = 0.0078;
        this.volSpreads[7][2] = 0.0000;
        this.volSpreads[7][3] = -0.0045;
        this.volSpreads[7][4] = -0.0046;
        this.volSpreads[8][0] = 0.0545;
        this.volSpreads[8][1] = 0.0079;
        this.volSpreads[8][2] = 0.0000;
        this.volSpreads[8][3] = -0.0042;
        this.volSpreads[8][4] = -0.0020;
        this.volSpreadsHandle = new Array(this.tenors.options.length * this.tenors.swaps.length);
        for (let i = 0; i < this.tenors.options.length * this.tenors.swaps.length; i++) {
            this.volSpreadsHandle[i] =
                new Array(this.strikeSpreads.length);
            for (let j = 0; j < this.strikeSpreads.length; j++) {
                this.volSpreadsHandle[i][j] =
                    new Handle(new SimpleQuote(this.volSpreads[i][j]));
            }
        }
    }
}
//# sourceMappingURL=swaptionvolstructuresutilities.js.map