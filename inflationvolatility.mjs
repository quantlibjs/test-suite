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
import { Actual365Fixed, Array2D, Bicubic, BusinessDayConvention, Cubic, DateExt, Frequency, Handle, InterpolatedYoYCapFloorTermPriceSurface, InterpolatedYoYInflationCurve, InterpolatedYoYOptionletStripper, InterpolatedZeroCurve, KInterpolatedYoYOptionletVolatilitySurface, Linear, Period, RelinkableHandle, SavedSettings, Settings, TARGET, TimeUnit, YoYInflationTermStructure, YoYInflationUnitDisplacedBlackCapFloorEngine, YoYOptionletVolatilitySurface, YYEUHICPr, first, second, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

let nominalEUR;
let nominalGBP;
const yoyEU = new RelinkableHandle();
const yoyUK = new RelinkableHandle();
let cStrikesEU;
let fStrikesEU;
let cfMaturitiesEU;
let cPriceEU;
let fPriceEU;
let yoyIndexEU;
let priceSurfEU;
function reset() {
    nominalEUR = new Handle();
    nominalGBP = new Handle();
    priceSurfEU = null;
    yoyEU.linkTo(new YoYInflationTermStructure());
    yoyUK.linkTo(new YoYInflationTermStructure());
    yoyIndexEU = null;
    cPriceEU = [[]];
    fPriceEU = [[]];
    cStrikesEU = [];
    fStrikesEU = [];
    cfMaturitiesEU = [];
}

function setup() {
    const evalDate = new Date(Date.UTC(2007, 11 - 1, 23));
    Settings.evaluationDate.set(evalDate);
    yoyIndexEU = new YYEUHICPr(true, yoyEU);
    const timesEUR = [
        0.0109589, 0.0684932, 0.263014, 0.317808, 0.567123, 0.816438, 1.06575,
        1.31507, 1.56438, 2.0137, 3.01918, 4.01644, 5.01644, 6.01644,
        7.01644, 8.01644, 9.02192, 10.0192, 12.0192, 15.0247, 20.0301,
        25.0356, 30.0329, 40.0384, 50.0466
    ];
    const ratesEUR = [
        0.0415600, 0.0426840, 0.0470980, 0.0458506, 0.0449550, 0.0439784, 0.0431887,
        0.0426604, 0.0422925, 0.0424591, 0.0421477, 0.0421853, 0.0424016, 0.0426969,
        0.0430804, 0.0435011, 0.0439368, 0.0443825, 0.0452589, 0.0463389, 0.0472636,
        0.0473401, 0.0470629, 0.0461092, 0.0450794
    ];
    const timesGBP = [
        0.008219178, 0.010958904, 0.01369863, 0.019178082, 0.073972603,
        0.323287671, 0.57260274, 0.821917808, 1.071232877, 1.320547945,
        1.506849315, 2.002739726, 3.002739726, 4.002739726, 5.005479452,
        6.010958904, 7.008219178, 8.005479452, 9.008219178, 10.00821918,
        12.01369863, 15.0109589, 20.01369863, 25.01917808, 30.02191781,
        40.03287671, 50.03561644, 60.04109589, 70.04931507
    ];
    const ratesGBP = [
        0.0577363, 0.0582314, 0.0585265, 0.0587165, 0.0596598, 0.0612506,
        0.0589676, 0.0570512, 0.0556147, 0.0546082, 0.0549492, 0.053801,
        0.0529333, 0.0524068, 0.0519712, 0.0516615, 0.0513711, 0.0510433,
        0.0507974, 0.0504833, 0.0498998, 0.0490464, 0.04768, 0.0464862,
        0.045452, 0.0437699, 0.0425311, 0.0420073, 0.041151
    ];
    let r = [];
    let d = [];
    const nTimesEUR = timesEUR.length;
    const nTimesGBP = timesGBP.length;
    for (let i = 0; i < nTimesEUR; i++) {
        r.push(ratesEUR[i]);
        const ys = Math.floor(timesEUR[i]);
        const ds = Math.floor((timesEUR[i] - ys) * 365);
        const dd = DateExt.advance(DateExt.advance(evalDate, ys, TimeUnit.Years), ds, TimeUnit.Days);
        d.push(dd);
    }
    const euriborTS = new InterpolatedZeroCurve(new Cubic())
        .curveInit1(d, r, new Actual365Fixed());
    const nominalHeur = new Handle(euriborTS, false);
    nominalEUR = nominalHeur;
    d = [];
    r = [];
    for (let i = 0; i < nTimesGBP; i++) {
        r.push(ratesGBP[i]);
        const ys = Math.floor(timesGBP[i]);
        const ds = Math.floor((timesGBP[i] - ys) * 365);
        const dd = DateExt.advance(DateExt.advance(evalDate, ys, TimeUnit.Years), ds, TimeUnit.Days);
        d.push(dd);
    }
    const gbpLiborTS = new InterpolatedZeroCurve(new Cubic())
        .curveInit1(d, r, new Actual365Fixed());
    const nominalHgbp = new Handle(gbpLiborTS, false);
    nominalGBP = nominalHgbp;
    const yoyEUrates = [
        0.0237951, 0.0238749, 0.0240334, 0.0241934, 0.0243567, 0.0245323, 0.0247213,
        0.0249348, 0.0251768, 0.0254337, 0.0257258, 0.0260217, 0.0263006, 0.0265538,
        0.0267803, 0.0269378, 0.0270608, 0.0271363, 0.0272, 0.0272512, 0.0272927,
        0.027317, 0.0273615, 0.0273811, 0.0274063, 0.0274307, 0.0274625, 0.027527,
        0.0275952, 0.0276734, 0.027794
    ];
    d = [];
    r = [];
    const baseDate = new TARGET().advance1(evalDate, -2, TimeUnit.Months, BusinessDayConvention.ModifiedFollowing);
    for (let i = 0; i < yoyEUrates.length; i++) {
        const dd = new TARGET().advance1(baseDate, i, TimeUnit.Years, BusinessDayConvention.ModifiedFollowing);
        d.push(dd);
        r.push(yoyEUrates[i]);
    }
    const indexIsInterpolated = true;
    const pYTSEU = new InterpolatedYoYInflationCurve(new Linear())
        .curveInit1(evalDate, new TARGET(), new Actual365Fixed(), new Period().init1(2, TimeUnit.Months), Frequency.Monthly, indexIsInterpolated, nominalGBP, d, r);
    yoyEU.linkTo(pYTSEU);
    const ncStrikesEU = 6;
    const nfStrikesEU = 6;
    const ncfMaturitiesEU = 7;
    const capStrikesEU = [0.02, 0.025, 0.03, 0.035, 0.04, 0.05];
    const capMaturitiesEU = [
        new Period().init1(3, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(7, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(15, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years)
    ];
    const capPricesEU = [
        [116.225, 204.945, 296.285, 434.29, 654.47, 844.775, 1132.33],
        [34.305, 71.575, 114.1, 184.33, 307.595, 421.395, 602.35],
        [6.37, 19.085, 35.635, 66.42, 127.69, 189.685, 296.195],
        [1.325, 5.745, 12.585, 26.945, 58.95, 94.08, 158.985],
        [0.501, 2.37, 5.38, 13.065, 31.91, 53.95, 96.97],
        [0.501, 0.695, 1.47, 4.415, 12.86, 23.75, 46.7]
    ];
    const floorStrikesEU = [-0.01, 0.00, 0.005, 0.01, 0.015, 0.02];
    const floorPricesEU = [
        [0.501, 0.851, 2.44, 6.645, 16.23, 26.85, 46.365],
        [0.501, 2.236, 5.555, 13.075, 28.46, 44.525, 73.08],
        [1.025, 3.935, 9.095, 19.64, 39.93, 60.375, 96.02],
        [2.465, 7.885, 16.155, 31.6, 59.34, 86.21, 132.045],
        [6.9, 17.92, 32.085, 56.08, 95.95, 132.85, 194.18],
        [23.52, 47.625, 74.085, 114.355, 175.72, 229.565, 316.285]
    ];
    cStrikesEU = [];
    fStrikesEU = [];
    cfMaturitiesEU = [];
    for (let i = 0; i < ncStrikesEU; i++) {
        cStrikesEU.push(capStrikesEU[i]);
    }
    for (let i = 0; i < nfStrikesEU; i++) {
        fStrikesEU.push(floorStrikesEU[i]);
    }
    for (let i = 0; i < ncfMaturitiesEU; i++) {
        cfMaturitiesEU.push(capMaturitiesEU[i]);
    }
    const tcPriceEU = Array2D.newMatrix(ncStrikesEU, ncfMaturitiesEU);
    const tfPriceEU = Array2D.newMatrix(nfStrikesEU, ncfMaturitiesEU);
    for (let i = 0; i < ncStrikesEU; i++) {
        for (let j = 0; j < ncfMaturitiesEU; j++) {
            tcPriceEU[i][j] = capPricesEU[i][j];
        }
    }
    for (let i = 0; i < nfStrikesEU; i++) {
        for (let j = 0; j < ncfMaturitiesEU; j++) {
            tfPriceEU[i][j] = floorPricesEU[i][j];
        }
    }
    cPriceEU = tcPriceEU;
    fPriceEU = tfPriceEU;
}

function setupPriceSurface() {
    const fixingDays = 0;
    const lag = 3;
    const yyLag = new Period().init1(lag, TimeUnit.Months);
    const baseRate = 1;
    const dc = new Actual365Fixed();
    const cal = new TARGET();
    const bdc = BusinessDayConvention.ModifiedFollowing;
    const pn = nominalEUR.currentLink();
    const n = new Handle(pn, false);
    const cfEUprices = new InterpolatedYoYCapFloorTermPriceSurface(new Bicubic(), new Cubic())
        .iyoycftpsInit(fixingDays, yyLag, yoyIndexEU, baseRate, n, dc, cal, bdc, cStrikesEU, fStrikesEU, cfMaturitiesEU, cPriceEU, fPriceEU);
    priceSurfEU = cfEUprices;
}

describe(`yoyOptionletStripper (yoy inflation vol) tests ${version}`, () => {
    it('Testing conversion from YoY price surface to YoY volatility surface...', () => {
        const backup = new SavedSettings();
        setup();
        setupPriceSurface();
        const pVS = new YoYOptionletVolatilitySurface();
        const hVS = new Handle(pVS, false);
        const yoyPricerUD = new YoYInflationUnitDisplacedBlackCapFloorEngine(yoyIndexEU, hVS);
        const yoyOptionletStripper = new InterpolatedYoYOptionletStripper(new Linear());
        const settlementDays = 0;
        const cal = new TARGET();
        const bdc = BusinessDayConvention.ModifiedFollowing;
        const dc = new Actual365Fixed();
        const capFloorPrices = priceSurfEU;
        const lag = priceSurfEU.observationLag();
        const slope = -0.5;
        const yoySurf = new KInterpolatedYoYOptionletVolatilitySurface(new Linear())
            .kiyoyovsInit(settlementDays, cal, bdc, dc, lag, capFloorPrices, yoyPricerUD, yoyOptionletStripper, slope);
        const volATyear1 = [
            0.0128, 0.0093, 0.0083, 0.0073, 0.0064, 0.0058, 0.0042, 0.0046, 0.0053,
            0.0064, 0.0098
        ];
        const volATyear3 = [
            0.0079, 0.0058, 0.0051, 0.0045, 0.0039, 0.0035, 0.0026, 0.0028, 0.0033,
            0.0039, 0.0060
        ];
        let d = DateExt.advance(yoySurf.baseDate(), 1, TimeUnit.Years);
        let someSlice;
        someSlice = yoySurf.Dslice(d);
        let n = someSlice[first].length;
        const eps = 0.0001;
        for (let i = 0; i < n; i++) {
            expect(Math.abs(someSlice[second][i] - volATyear1[i]))
                .toBeLessThan(eps);
        }
        d = DateExt.advance(yoySurf.baseDate(), 3, TimeUnit.Years);
        const someOtherSlice = yoySurf.Dslice(d);
        n = someOtherSlice[first].length;
        for (let i = 0; i < n; i++) {
            expect(Math.abs(someOtherSlice[second][i] - volATyear3[i]))
                .toBeLessThan(eps);
        }
        reset();
        backup.dispose();
    });

    it('Testing conversion from YoY cap-floor surface to' +
        ' YoY inflation term structure...', () => {
        const backup = new SavedSettings();
        setup();
        setupPriceSurface();
        const yyATMt = priceSurfEU.atmYoYSwapTimeRates();
        const yyATMd = priceSurfEU.atmYoYSwapDateRates();
        const crv = [
            0.024586, 0.0247575, 0.0249396, 0.0252596, 0.0258498, 0.0262883,
            0.0267915
        ];
        const swaps = [
            0.024586, 0.0247575, 0.0249396, 0.0252596, 0.0258498, 0.0262883,
            0.0267915
        ];
        const ayoy = [
            0.0247659, 0.0251437, 0.0255945, 0.0265234, 0.0280457, 0.0285534,
            0.0295884
        ];
        const eps = 2e-5;
        for (let i = 0; i < yyATMt[first].length; i++) {
            expect(Math.abs(yyATMt[second][i] - crv[i])).toBeLessThan(eps);
        }
        for (let i = 0; i < yyATMd[first].length; i++) {
            expect(Math.abs(priceSurfEU.atmYoYSwapRate2(yyATMd[first][i]) - swaps[i]))
                .toBeLessThan(eps);
        }
        for (let i = 0; i < yyATMd[first].length; i++) {
            expect(Math.abs(priceSurfEU.atmYoYRate2(yyATMd[first][i]) - ayoy[i]))
                .toBeLessThan(eps);
        }
        reset();
        backup.dispose();
    });
});
