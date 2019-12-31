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
import { Actual360, Actual365Fixed, Array1D, Array2D, BermudanExercise, BlackCapFloorEngine, blackFormula1, blackFormulaImpliedStdDev1, BlackSwaptionEngine, BusinessDayConvention, CapFloor, CapFloorTermVolSurface, ConstantOptionletVolatility, ConstantSwaptionVolatility, DateExt, DepositRateHelper, Discount, EndCriteria, Euribor, EuriborSwapIsdaFixA, EuropeanExercise, FlatForward, FraRateHelper, Frequency, Gaussian1dCapFloorEngine, Gaussian1dSwaptionEngine, Handle, InterpolatedSmileSection, KahaleSmileSection, LevenbergMarquardt, Linear, LogLinear, MakeCapFloor, MakeSwaption, MakeVanillaSwap, MarkovFunctional, MfStateProcess, Option, OptionletStripper1, Period, PiecewiseYieldCurve, Settings, SimpleQuote, StrippedOptionletAdapter, SwapRateHelper, Swaption, SwaptionHelper, SwaptionVolatilityMatrix, SwaptionVolCube1, TARGET, Thirty360, TimeUnit, version } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';

function flatYts() {
    return new Handle(new FlatForward().ffInit4(0, new TARGET(), 0.03, new Actual365Fixed()));
}

function flatSwaptionVts() {
    return new Handle(new ConstantSwaptionVolatility().csvInit3(0, new TARGET(), BusinessDayConvention.ModifiedFollowing, 0.20, new Actual365Fixed()));
}

function flatOptionletVts() {
    return new Handle(new ConstantOptionletVolatility().covInit3(0, new TARGET(), BusinessDayConvention.ModifiedFollowing, 0.20, new Actual365Fixed()));
}

function md0Yts() {
    const euribor6mEmpty = new Euribor(new Period().init1(6, TimeUnit.Months));
    const q6m = [];
    const r6m = [];
    const q6mh = [
        0.0001, 0.0001, 0.0001, 0.0003, 0.00055, 0.0009, 0.0014, 0.0019,
        0.0025, 0.0031, 0.00325, 0.00313, 0.0031, 0.00307, 0.00309, 0.00339,
        0.00316, 0.00326, 0.00335, 0.00343, 0.00358, 0.00351, 0.00388, 0.00404,
        0.00425, 0.00442, 0.00462, 0.00386, 0.00491, 0.00647, 0.00837, 0.01033,
        0.01218, 0.01382, 0.01527, 0.01654, 0.0177, 0.01872, 0.01959, 0.0203,
        0.02088, 0.02132, 0.02164, 0.02186, 0.02202, 0.02213, 0.02222, 0.02229,
        0.02234, 0.02238, 0.02241, 0.02243, 0.02244, 0.02245, 0.02247, 0.0225,
        0.02284, 0.02336, 0.02407, 0.0245
    ];
    const q6mh1 = [
        new Period().init1(1, TimeUnit.Days), new Period().init1(1, TimeUnit.Days),
        new Period().init1(1, TimeUnit.Days), new Period().init1(1, TimeUnit.Weeks),
        new Period().init1(1, TimeUnit.Months),
        new Period().init1(2, TimeUnit.Months),
        new Period().init1(3, TimeUnit.Months),
        new Period().init1(4, TimeUnit.Months),
        new Period().init1(5, TimeUnit.Months),
        new Period().init1(6, TimeUnit.Months)
    ];
    const q6mh2 = [
        new Period().init1(7, TimeUnit.Months),
        new Period().init1(8, TimeUnit.Months),
        new Period().init1(9, TimeUnit.Months),
        new Period().init1(10, TimeUnit.Months),
        new Period().init1(11, TimeUnit.Months),
        new Period().init1(1, TimeUnit.Years),
        new Period().init1(13, TimeUnit.Months),
        new Period().init1(14, TimeUnit.Months),
        new Period().init1(15, TimeUnit.Months),
        new Period().init1(16, TimeUnit.Months),
        new Period().init1(17, TimeUnit.Months),
        new Period().init1(18, TimeUnit.Months),
        new Period().init1(19, TimeUnit.Months),
        new Period().init1(20, TimeUnit.Months),
        new Period().init1(21, TimeUnit.Months),
        new Period().init1(22, TimeUnit.Months),
        new Period().init1(23, TimeUnit.Months),
        new Period().init1(2, TimeUnit.Years),
        new Period().init1(3, TimeUnit.Years),
        new Period().init1(4, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(6, TimeUnit.Years),
        new Period().init1(7, TimeUnit.Years),
        new Period().init1(8, TimeUnit.Years),
        new Period().init1(9, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(11, TimeUnit.Years),
        new Period().init1(12, TimeUnit.Years),
        new Period().init1(13, TimeUnit.Years),
        new Period().init1(14, TimeUnit.Years),
        new Period().init1(15, TimeUnit.Years),
        new Period().init1(16, TimeUnit.Years),
        new Period().init1(17, TimeUnit.Years),
        new Period().init1(18, TimeUnit.Years),
        new Period().init1(19, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(21, TimeUnit.Years),
        new Period().init1(22, TimeUnit.Years),
        new Period().init1(23, TimeUnit.Years),
        new Period().init1(24, TimeUnit.Years),
        new Period().init1(25, TimeUnit.Years),
        new Period().init1(26, TimeUnit.Years),
        new Period().init1(27, TimeUnit.Years),
        new Period().init1(28, TimeUnit.Years),
        new Period().init1(29, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years),
        new Period().init1(35, TimeUnit.Years),
        new Period().init1(40, TimeUnit.Years),
        new Period().init1(50, TimeUnit.Years),
        new Period().init1(60, TimeUnit.Years)
    ];
    for (let i = 0; i < 10 + 15 + 35; i++) {
        q6m.push(new SimpleQuote(q6mh[i]));
    }
    for (let i = 0; i < 10; i++) {
        r6m.push(new DepositRateHelper().drhInit1(new Handle(q6m[i]), q6mh1[i], i < 2 ? i : 2, new TARGET(), BusinessDayConvention.ModifiedFollowing, false, new Actual360()));
    }
    for (let i = 0; i < 18; i++) {
        if (i + 1 !== 6 && i + 1 !== 12 && i + 1 !== 18) {
            if (i + 10 !== 16 && i + 10 !== 17) {
                r6m.push(new FraRateHelper().frahInit1(new Handle(q6m[10 + i]), i + 1, i + 7, 2, new TARGET(), BusinessDayConvention.ModifiedFollowing, false, new Actual360()));
            }
        }
    }
    for (let i = 0; i < 15 + 35; i++) {
        if (i + 7 === 12 || i + 7 === 18 || i + 7 >= 24) {
            r6m.push(new SwapRateHelper().srhInit2(new Handle(q6m[10 + i]), q6mh2[i], new TARGET(), Frequency.Annual, BusinessDayConvention.ModifiedFollowing, new Actual360(), euribor6mEmpty));
        }
    }
    const res = new Handle(new PiecewiseYieldCurve(new Discount(), new LogLinear())
        .pwycInit4(0, new TARGET(), r6m, new Actual365Fixed()));
    res.currentLink().enableExtrapolation();
    return res;
}

function md0SwaptionVts() {
    const optionTenors = [];
    const swapTenors = [];
    const optTen = [
        new Period().init1(1, TimeUnit.Months),
        new Period().init1(2, TimeUnit.Months),
        new Period().init1(3, TimeUnit.Months),
        new Period().init1(6, TimeUnit.Months),
        new Period().init1(9, TimeUnit.Months),
        new Period().init1(1, TimeUnit.Years),
        new Period().init1(18, TimeUnit.Months),
        new Period().init1(2, TimeUnit.Years),
        new Period().init1(3, TimeUnit.Years),
        new Period().init1(4, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(6, TimeUnit.Years),
        new Period().init1(7, TimeUnit.Years),
        new Period().init1(8, TimeUnit.Years),
        new Period().init1(9, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(15, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(25, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years)
    ];
    for (let i = 0; i < 20; i++) {
        optionTenors.push(optTen[i]);
    }
    const swpTen = [
        new Period().init1(1, TimeUnit.Years),
        new Period().init1(2, TimeUnit.Years),
        new Period().init1(3, TimeUnit.Years),
        new Period().init1(4, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(6, TimeUnit.Years),
        new Period().init1(7, TimeUnit.Years),
        new Period().init1(8, TimeUnit.Years),
        new Period().init1(9, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(15, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(25, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years)
    ];
    for (let i = 0; i < 14; i++) {
        swapTenors.push(swpTen[i]);
    }
    const qSwAtmh = [
        1.81, 0.897, 0.819, 0.692, 0.551, 0.47, 0.416, 0.379, 0.357, 0.335, 0.283,
        0.279, 0.283, 0.287, 1.717, 0.886, 0.79, 0.69, 0.562, 0.481, 0.425, 0.386,
        0.359, 0.339, 0.29, 0.287, 0.292, 0.296, 1.762, 0.903, 0.804, 0.693, 0.582,
        0.5, 0.448, 0.411, 0.387, 0.365, 0.31, 0.307, 0.312, 0.317, 1.662, 0.882,
        0.764, 0.67, 0.586, 0.513, 0.468, 0.432, 0.408, 0.388, 0.331, 0.325, 0.33,
        0.334, 1.53, 0.854, 0.728, 0.643, 0.565, 0.503, 0.464, 0.435, 0.415, 0.393,
        0.337, 0.33, 0.333, 0.338, 1.344, 0.786, 0.683, 0.609, 0.54, 0.488, 0.453,
        0.429, 0.411, 0.39, 0.335, 0.329, 0.332, 0.336, 1.1, 0.711, 0.617, 0.548,
        0.497, 0.456, 0.43, 0.408, 0.392, 0.374, 0.328, 0.323, 0.326, 0.33, 0.956,
        0.638, 0.553, 0.496, 0.459, 0.427, 0.403, 0.385, 0.371, 0.359, 0.321, 0.318,
        0.323, 0.327, 0.671, 0.505, 0.45, 0.42, 0.397, 0.375, 0.36, 0.347, 0.337,
        0.329, 0.305, 0.303, 0.309, 0.313, 0.497, 0.406, 0.378, 0.36, 0.348, 0.334,
        0.323, 0.315, 0.309, 0.304, 0.289, 0.289, 0.294, 0.297, 0.404, 0.352, 0.334,
        0.322, 0.313, 0.304, 0.296, 0.291, 0.288, 0.286, 0.278, 0.277, 0.281, 0.282,
        0.345, 0.312, 0.302, 0.294, 0.286, 0.28, 0.276, 0.274, 0.273, 0.273, 0.267,
        0.265, 0.268, 0.269, 0.305, 0.285, 0.277, 0.271, 0.266, 0.262, 0.26, 0.259,
        0.26, 0.262, 0.259, 0.256, 0.257, 0.256, 0.282, 0.265, 0.259, 0.254, 0.251,
        0.25, 0.25, 0.251, 0.253, 0.256, 0.253, 0.25, 0.249, 0.246, 0.263, 0.248,
        0.244, 0.241, 0.24, 0.24, 0.242, 0.245, 0.249, 0.252, 0.249, 0.245, 0.243,
        0.238, 0.242, 0.234, 0.232, 0.232, 0.233, 0.235, 0.239, 0.243, 0.247, 0.249,
        0.246, 0.242, 0.237, 0.231, 0.233, 0.234, 0.241, 0.246, 0.249, 0.253, 0.257,
        0.261, 0.263, 0.264, 0.251, 0.236, 0.222, 0.214, 0.262, 0.26, 0.262, 0.263,
        0.263, 0.266, 0.268, 0.269, 0.269, 0.265, 0.237, 0.214, 0.202, 0.196, 0.26,
        0.26, 0.261, 0.261, 0.258, 0.255, 0.252, 0.248, 0.245, 0.24, 0.207, 0.187,
        0.182, 0.176, 0.236, 0.223, 0.221, 0.218, 0.214, 0.21, 0.207, 0.204, 0.202,
        0.2, 0.175, 0.167, 0.163, 0.158
    ];
    const qSwAtm = [];
    for (let i = 0; i < 20; i++) {
        const qSwAtmTmp = [];
        for (let j = 0; j < 14; j++) {
            qSwAtmTmp.push(new Handle(new SimpleQuote(qSwAtmh[i * 14 + j])));
        }
        qSwAtm.push(qSwAtmTmp);
    }
    const swaptionVolAtm = new Handle(new SwaptionVolatilityMatrix().svmInit1(new TARGET(), BusinessDayConvention.ModifiedFollowing, optionTenors, swapTenors, qSwAtm, new Actual365Fixed()));
    const optionTenorsSmile = [];
    const swapTenorsSmile = [];
    const strikeSpreads = [];
    const optTenSm = [
        new Period().init1(3, TimeUnit.Months),
        new Period().init1(1, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years)
    ];
    const swpTenSm = [
        new Period().init1(2, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years)
    ];
    const strksp = [-0.02, -0.01, -0.0050, -0.0025, 0.0, 0.0025, 0.0050, 0.01, 0.02];
    for (let i = 0; i < 6; i++) {
        optionTenorsSmile.push(optTenSm[i]);
    }
    for (let i = 0; i < 5; i++) {
        swapTenorsSmile.push(swpTenSm[i]);
    }
    for (let i = 0; i < 9; i++) {
        strikeSpreads.push(strksp[i]);
    }
    const qSwSmile = [];
    const qSwSmileh = [
        2.2562, 2.2562, 2.2562, 0.1851, 0.0, -0.0389, -0.0507, -0.0571, -0.06,
        14.9619, 14.9619, 0.1249, 0.0328, 0.0, -0.0075, -0.005, 0.0078, 0.0328,
        0.2296, 0.2296, 0.0717, 0.0267, 0.0, -0.0115, -0.0126, -0.0002, 0.0345,
        0.6665, 0.1607, 0.0593, 0.0245, 0.0, -0.0145, -0.0204, -0.0164, 0.0102,
        0.6509, 0.1649, 0.0632, 0.027, 0.0, -0.018, -0.0278, -0.0303, -0.0105,
        0.6303, 0.6303, 0.6303, 0.1169, 0.0, -0.0469, -0.0699, -0.091, -0.1065,
        0.4437, 0.4437, 0.0944, 0.0348, 0.0, -0.0206, -0.0327, -0.0439, -0.0472,
        2.1557, 0.1501, 0.0531, 0.0225, 0.0, -0.0161, -0.0272, -0.0391, -0.0429,
        0.4365, 0.1077, 0.0414, 0.0181, 0.0, -0.0137, -0.0237, -0.0354, -0.0401,
        0.4415, 0.1117, 0.0437, 0.0193, 0.0, -0.015, -0.0264, -0.0407, -0.0491,
        0.4301, 0.0776, 0.0283, 0.0122, 0.0, -0.0094, -0.0165, -0.0262, -0.035,
        0.2496, 0.0637, 0.0246, 0.0109, 0.0, -0.0086, -0.0153, -0.0247, -0.0334,
        0.1912, 0.0569, 0.023, 0.0104, 0.0, -0.0085, -0.0155, -0.0256, -0.0361,
        0.2095, 0.06, 0.0239, 0.0107, 0.0, -0.0087, -0.0156, -0.0254, -0.0348,
        0.2357, 0.0669, 0.0267, 0.012, 0.0, -0.0097, -0.0174, -0.0282, -0.0383,
        0.1291, 0.0397, 0.0158, 0.007, 0.0, -0.0056, -0.01, -0.0158, -0.0203,
        0.1281, 0.0397, 0.0159, 0.0071, 0.0, -0.0057, -0.0102, -0.0164, -0.0215,
        0.1547, 0.0468, 0.0189, 0.0085, 0.0, -0.0069, -0.0125, -0.0205, -0.0283,
        0.1851, 0.0522, 0.0208, 0.0093, 0.0, -0.0075, -0.0135, -0.0221, -0.0304,
        0.1782, 0.0506, 0.02, 0.0089, 0.0, -0.0071, -0.0128, -0.0206, -0.0276,
        0.2665, 0.0654, 0.0255, 0.0113, 0.0, -0.0091, -0.0163, -0.0265, -0.0367,
        0.2873, 0.0686, 0.0269, 0.0121, 0.0, -0.0098, -0.0179, -0.0298, -0.043,
        0.2993, 0.0688, 0.0273, 0.0123, 0.0, -0.0103, -0.0189, -0.0324, -0.0494,
        0.1869, 0.0501, 0.0202, 0.0091, 0.0, -0.0076, -0.014, -0.0239, -0.0358,
        0.1573, 0.0441, 0.0178, 0.008, 0.0, -0.0066, -0.0121, -0.0202, -0.0294,
        0.196, 0.0525, 0.0204, 0.009, 0.0, -0.0071, -0.0125, -0.0197, -0.0253,
        0.1795, 0.0497, 0.0197, 0.0088, 0.0, -0.0071, -0.0128, -0.0208, -0.0286,
        0.1401, 0.0415, 0.0171, 0.0078, 0.0, -0.0066, -0.0122, -0.0209, -0.0318,
        0.112, 0.0344, 0.0142, 0.0065, 0.0, -0.0055, -0.01, -0.0171, -0.0256,
        0.1077, 0.0328, 0.0134, 0.0061, 0.0, -0.005, -0.0091, -0.0152, -0.0216,
    ];
    for (let i = 0; i < 30; i++) {
        const qSwSmileTmp = [];
        for (let j = 0; j < 9; j++) {
            qSwSmileTmp.push(new Handle(new SimpleQuote(qSwSmileh[i * 9 + j])));
        }
        qSwSmile.push(qSwSmileTmp);
    }
    const qSwSmileh1 = [
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2,
        0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2, 0.01, 0.2, 0.8, -0.2
    ];
    const parameterFixed = [];
    parameterFixed.push(false);
    parameterFixed.push(false);
    parameterFixed.push(false);
    parameterFixed.push(false);
    const parameterGuess = [];
    for (let i = 0; i < 30; i++) {
        const parameterGuessTmp = [];
        for (let j = 0; j < 4; j++) {
            parameterGuessTmp.push(new Handle(new SimpleQuote(qSwSmileh1[i * 4 + j])));
        }
        parameterGuess.push(parameterGuessTmp);
    }
    const ec = new EndCriteria(50000, 250, 1E-6, 1E-6, 1E-6);
    const swapIndex = new EuriborSwapIsdaFixA().esInit1(new Period().init1(30, TimeUnit.Years), md0Yts());
    const shortSwapIndex = new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years), md0Yts());
    const res = new Handle(new SwaptionVolCube1().svc1xInit(swaptionVolAtm, optionTenorsSmile, swapTenorsSmile, strikeSpreads, qSwSmile, swapIndex, shortSwapIndex, true, parameterGuess, parameterFixed, true, ec, 0.0050));
    res.currentLink().enableExtrapolation();
    return res;
}

function md0OptionletVts() {
    const nOptTen = 16;
    const nStrikes = 12;
    const optionTenors = [];
    const optTen = [
        new Period().init1(1, TimeUnit.Years),
        new Period().init1(18, TimeUnit.Months),
        new Period().init1(2, TimeUnit.Years),
        new Period().init1(3, TimeUnit.Years),
        new Period().init1(4, TimeUnit.Years),
        new Period().init1(5, TimeUnit.Years),
        new Period().init1(6, TimeUnit.Years),
        new Period().init1(7, TimeUnit.Years),
        new Period().init1(8, TimeUnit.Years),
        new Period().init1(9, TimeUnit.Years),
        new Period().init1(10, TimeUnit.Years),
        new Period().init1(12, TimeUnit.Years),
        new Period().init1(15, TimeUnit.Years),
        new Period().init1(20, TimeUnit.Years),
        new Period().init1(25, TimeUnit.Years),
        new Period().init1(30, TimeUnit.Years)
    ];
    for (let i = 0; i < nOptTen; i++) {
        optionTenors.push(optTen[i]);
    }
    const strikes = [];
    const strk = [
        0.0025, 0.0050, 0.0100, 0.0150, 0.0200, 0.0225, 0.0250, 0.0300, 0.0350,
        0.0400, 0.0500, 0.0600, 0.1000
    ];
    for (let i = 0; i < nStrikes; i++) {
        strikes.push(strk[i]);
    }
    const vols = Array2D.newMatrix(nOptTen, nStrikes);
    const volsa = [
        [
            1.3378, 1.3032, 1.2514, 1.081, 1.019, 0.961, 0.907, 0.862, 0.822, 0.788,
            0.758, 0.709, 0.66, 0.619, 0.597, 0.579
        ],
        [
            1.1882, 1.1057, 0.9823, 0.879, 0.828, 0.779, 0.736, 0.7, 0.67, 0.644,
            0.621, 0.582, 0.544, 0.513, 0.496, 0.482
        ],
        [
            1.1646, 1.0356, 0.857, 0.742, 0.682, 0.626, 0.585, 0.553, 0.527, 0.506,
            0.488, 0.459, 0.43, 0.408, 0.396, 0.386
        ],
        [
            1.1932, 1.0364, 0.8291, 0.691, 0.618, 0.553, 0.509, 0.477, 0.452, 0.433,
            0.417, 0.391, 0.367, 0.35, 0.342, 0.335
        ],
        [
            1.2233, 1.0489, 0.8268, 0.666, 0.582, 0.51, 0.463, 0.43, 0.405, 0.387,
            0.372, 0.348, 0.326, 0.312, 0.306, 0.301
        ],
        [
            1.2369, 1.0555, 0.8283, 0.659, 0.57, 0.495, 0.447, 0.414, 0.388, 0.37,
            0.355, 0.331, 0.31, 0.298, 0.293, 0.289
        ],
        [
            1.2498, 1.0622, 0.8307, 0.653, 0.56, 0.483, 0.434, 0.4, 0.374, 0.356,
            0.341, 0.318, 0.297, 0.286, 0.282, 0.279
        ],
        [
            1.2719, 1.0747, 0.8368, 0.646, 0.546, 0.465, 0.415, 0.38, 0.353, 0.335,
            0.32, 0.296, 0.277, 0.268, 0.265, 0.263
        ],
        [
            1.2905, 1.0858, 0.8438, 0.643, 0.536, 0.453, 0.403, 0.367, 0.339, 0.32,
            0.305, 0.281, 0.262, 0.255, 0.254, 0.252
        ],
        [
            1.3063, 1.0953, 0.8508, 0.642, 0.53, 0.445, 0.395, 0.358, 0.329, 0.31,
            0.294, 0.271, 0.252, 0.246, 0.246, 0.244
        ],
        [
            1.332, 1.1108, 0.8631, 0.642, 0.521, 0.436, 0.386, 0.348, 0.319, 0.298,
            0.282, 0.258, 0.24, 0.237, 0.237, 0.236
        ],
        [
            1.3513, 1.1226, 0.8732, 0.645, 0.517, 0.43, 0.381, 0.344, 0.314, 0.293,
            0.277, 0.252, 0.235, 0.233, 0.234, 0.233
        ],
        [
            1.395, 1.1491, 0.9003, 0.661, 0.511, 0.425, 0.38, 0.344, 0.314, 0.292,
            0.275, 0.251, 0.236, 0.236, 0.238, 0.235
        ]
    ];
    for (let i = 0; i < nStrikes; i++) {
        for (let j = 0; j < nOptTen; j++) {
            vols[j][i] = volsa[i][j];
        }
    }
    const iborIndex = new Euribor(new Period().init1(6, TimeUnit.Months), md0Yts());
    const cf = new CapFloorTermVolSurface().cftvsInit4(0, new TARGET(), BusinessDayConvention.ModifiedFollowing, optionTenors, strikes, vols);
    const stripper = new OptionletStripper1(cf, iborIndex);
    return new Handle(new StrippedOptionletAdapter(stripper));
}

function expiriesCalBasket1() {
    const res = [];
    const referenceDate_ = Settings.evaluationDate.f();
    for (let i = 1; i <= 5; i++) {
        res.push(new TARGET().advance1(referenceDate_, i, TimeUnit.Years));
    }
    return res;
}

function tenorsCalBasket1() {
    const res = new Array(5);
    for (let i = 0; i < 5; ++i) {
        res[i] = new Period().init1(10, TimeUnit.Years);
    }
    return res;
}

function expiriesCalBasket2() {
    const res = [];
    const referenceDate_ = Settings.evaluationDate.f();
    res.push(new TARGET().advance1(referenceDate_, 6, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 12, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 18, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 24, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 30, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 36, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 42, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 48, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 54, TimeUnit.Months));
    res.push(new TARGET().advance1(referenceDate_, 60, TimeUnit.Months));
    return res;
}

function expiriesCalBasket3() {
    const res = [];
    const referenceDate_ = Settings.evaluationDate.f();
    res.push(new TARGET().advance1(referenceDate_, 1, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 2, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 3, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 4, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 5, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 6, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 7, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 8, TimeUnit.Years));
    res.push(new TARGET().advance1(referenceDate_, 9, TimeUnit.Years));
    return res;
}

function tenorsCalBasket3() {
    const res = [];
    res.push(new Period().init1(9, TimeUnit.Years));
    res.push(new Period().init1(8, TimeUnit.Years));
    res.push(new Period().init1(7, TimeUnit.Years));
    res.push(new Period().init1(6, TimeUnit.Years));
    res.push(new Period().init1(5, TimeUnit.Years));
    res.push(new Period().init1(4, TimeUnit.Years));
    res.push(new Period().init1(3, TimeUnit.Years));
    res.push(new Period().init1(2, TimeUnit.Years));
    res.push(new Period().init1(1, TimeUnit.Years));
    return res;
}

function impliedStdDevs(atm, strikes, prices) {
    const result = [];
    for (let i = 0; i < prices.length; i++) {
        result.push(blackFormulaImpliedStdDev1(Option.Type.Call, strikes[i], atm, prices[i], 1.0, 0.0, 0.2, 1E-8, 1000));
    }
    return result;
}

describe(`Markov functional model tests ${version}`, () => {
  it('Testing Markov functional state process...', () => {
      const tolerance = 1E-10;
      const times1 = [], vols1 = [1.0];
      const sp1 = new MfStateProcess(0.00, times1, vols1);
      const var11 = sp1.variance(0.0, 0.0, 1.0);
      const var12 = sp1.variance(0.0, 0.0, 2.0);
      expect(Math.abs(var11 - 1.0)).toBeLessThan(tolerance);
      expect(Math.abs(var12 - 2.0)).toBeLessThan(tolerance);
      const times2 = new Array(2), vols2 = new Array(3);
      times2[0] = 1.0;
      times2[1] = 2.0;
      vols2[0] = 1.0;
      vols2[1] = 2.0;
      vols2[2] = 3.0;
      const sp2 = new MfStateProcess(0.00, times2, vols2);
      const dif21 = sp2.diffusion2(0.0, 0.0);
      const dif22 = sp2.diffusion2(0.99, 0.0);
      const dif23 = sp2.diffusion2(1.0, 0.0);
      const dif24 = sp2.diffusion2(1.9, 0.0);
      const dif25 = sp2.diffusion2(2.0, 0.0);
      const dif26 = sp2.diffusion2(3.0, 0.0);
      const dif27 = sp2.diffusion2(5.0, 0.0);
      expect(Math.abs(dif21 - 1.0)).toBeLessThan(tolerance);
      expect(Math.abs(dif22 - 1.0)).toBeLessThan(tolerance);
      expect(Math.abs(dif23 - 2.0)).toBeLessThan(tolerance);
      expect(Math.abs(dif24 - 2.0)).toBeLessThan(tolerance);
      expect(Math.abs(dif25 - 3.0)).toBeLessThan(tolerance);
      expect(Math.abs(dif26 - 3.0)).toBeLessThan(tolerance);
      expect(Math.abs(dif27 - 3.0)).toBeLessThan(tolerance);
      const var21 = sp2.variance(0.0, 0.0, 0.0);
      const var22 = sp2.variance(0.0, 0.0, 0.5);
      const var23 = sp2.variance(0.0, 0.0, 1.0);
      const var24 = sp2.variance(0.0, 0.0, 1.5);
      const var25 = sp2.variance(0.0, 0.0, 3.0);
      const var26 = sp2.variance(0.0, 0.0, 5.0);
      const var27 = sp2.variance(1.2, 0.0, 1.0);
      expect(Math.abs(var21 - 0.0)).toBeLessThan(tolerance);
      expect(Math.abs(var22 - 0.5)).toBeLessThan(tolerance);
      expect(Math.abs(var23 - 1.0)).toBeLessThan(tolerance);
      expect(Math.abs(var24 - 3.0)).toBeLessThan(tolerance);
      expect(Math.abs(var25 - 14.0)).toBeLessThan(tolerance);
      expect(Math.abs(var26 - 32.0)).toBeLessThan(tolerance);
      expect(Math.abs(var27 - 5.0)).toBeLessThan(tolerance);
      const sp3 = new MfStateProcess(0.01, times2, vols2);
      const var31 = sp3.variance(0.0, 0.0, 0.0);
      const var32 = sp3.variance(0.0, 0.0, 0.5);
      const var33 = sp3.variance(0.0, 0.0, 1.0);
      const var34 = sp3.variance(0.0, 0.0, 1.5);
      const var35 = sp3.variance(0.0, 0.0, 3.0);
      const var36 = sp3.variance(0.0, 0.0, 5.0);
      const var37 = sp3.variance(1.2, 0.0, 1.0);
      expect(Math.abs(var31 - 0.0)).toBeLessThan(tolerance);
      expect(Math.abs(var32 - 0.502508354208)).toBeLessThan(tolerance);
      expect(Math.abs(var33 - 1.01006700134)).toBeLessThan(tolerance);
      expect(Math.abs(var34 - 3.06070578669)).toBeLessThan(tolerance);
      expect(Math.abs(var35 - 14.5935513933)).toBeLessThan(tolerance);
      expect(Math.abs(var36 - 34.0940185819)).toBeLessThan(tolerance);
      expect(Math.abs(var37 - 5.18130257358)).toBeLessThan(tolerance);
  });

  it('Testing Kahale smile section...', () => {
      const tol = 1E-8;
      const atm = 0.05;
      const t = 1.0;
      const strikes0 = [0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10];
      const strikes = strikes0.slice(0, 10);
      const money = [];
      const calls0 = [];
      for (let i = 0; i < strikes.length; i++) {
          money.push(strikes[i] / atm);
          calls0.push(blackFormula1(Option.Type.Call, strikes[i], atm, 0.50 * Math.sqrt(t), 1.0, 0.0));
      }
      const stdDevs0 = impliedStdDevs(atm, strikes, calls0);
      const sec1 = new InterpolatedSmileSection(new Linear())
          .issInit2(t, strikes, stdDevs0, atm);
      const ksec11 = new KahaleSmileSection(sec1, atm, false, false, false, money);
      expect(Math.abs(ksec11.leftCoreStrike() - 0.01)).toBeLessThan(tol);
      expect(Math.abs(ksec11.rightCoreStrike() - 0.10)).toBeLessThan(tol);
      let k = strikes[0];
      while (k <= Array1D.back(strikes) + tol) {
          const pric0 = sec1.optionPrice(k);
          const pric1 = ksec11.optionPrice(k);
          expect(Math.abs(pric0 - pric1)).toBeLessThan(tol);
          k += 0.0001;
      }
      const ksec12 = new KahaleSmileSection(sec1, atm, true, false, false, money);
      expect(Math.abs(ksec12.leftCoreStrike() - 0.02)).toBeLessThan(tol);
      expect(Math.abs(ksec12.leftCoreStrike() - 0.01)).toBeLessThan(tol);
      expect(Math.abs(ksec12.rightCoreStrike() - 0.10)).toBeLessThan(tol);
      for (let i = 1; i < strikes.length; i++) {
          const pric0 = sec1.optionPrice(strikes[i]);
          const pric1 = ksec12.optionPrice(strikes[i]);
          expect(Math.abs(pric0 - pric1)).toBeLessThan(tol);
      }
      k = 0.0010;
      let dig00 = 1.0, dig10 = 1.0;
      while (k <= 2.0 * Array1D.back(strikes) + tol) {
          const dig0 = ksec11.digitalOptionPrice(k);
          const dig1 = ksec12.digitalOptionPrice(k);
          expect(dig0).toBeLessThanOrEqual(dig00 + tol);
          expect(dig0).toBeGreaterThanOrEqual(0.0);
          expect(dig1).toBeLessThanOrEqual(dig10 + tol);
          expect(dig1).toBeGreaterThanOrEqual(0.0);
          dig00 = dig0;
          dig10 = dig1;
          k += 0.0001;
      }
      const ksec13 = new KahaleSmileSection(sec1, atm, false, true, false, money);
      k = Array1D.back(strikes);
      const dig0 = ksec13.digitalOptionPrice(k - 0.0010);
      while (k <= 10.0 * Array1D.back(strikes) + tol) {
          expect(dig0).toBeLessThanOrEqual(dig00 + tol);
          expect(dig0).toBeGreaterThanOrEqual(0.0);
          k += 0.0001;
      }
      const calls1 = Array.from(calls0);
      calls1[0] = (atm - strikes[0]) +
          0.0010;
      const stdDevs1 = impliedStdDevs(atm, strikes, calls1);
      const sec2 = new InterpolatedSmileSection(new Linear())
          .issInit2(t, strikes, stdDevs1, atm);
      const ksec21 = new KahaleSmileSection(sec2, atm, false, false, false, money);
      const ksec22 = new KahaleSmileSection(sec2, atm, true, false, true, money);
      expect(Math.abs(ksec21.leftCoreStrike() - 0.02)).toBeLessThan(tol);
      expect(Math.abs(ksec22.leftCoreStrike() - 0.02)).toBeLessThan(tol);
      expect(Math.abs(ksec21.rightCoreStrike() - 0.10)).toBeLessThan(tol);
      expect(Math.abs(ksec22.rightCoreStrike() - 0.10)).toBeLessThan(tol);
      k = 0.0010;
      dig00 = dig10 = 1.0;
      while (k <= 2.0 * Array1D.back(strikes) + tol) {
          const dig0 = ksec21.digitalOptionPrice(k);
          const dig1 = ksec22.digitalOptionPrice(k);
          expect(dig0).toBeLessThanOrEqual(dig00 + tol);
          expect(dig0).toBeGreaterThanOrEqual(0.0);
          expect(dig1).toBeLessThanOrEqual(dig10 + tol);
          expect(dig1).toBeGreaterThanOrEqual(0.0);
          dig00 = dig0;
          dig10 = dig1;
          k += 0.0001;
      }
      const calls2 = Array.from(calls0);
      calls2[8] = 0.9 * calls2[9] +
          0.1 * calls2[8];
      const stdDevs2 = impliedStdDevs(atm, strikes, calls2);
      const sec3 = new InterpolatedSmileSection(new Linear())
          .issInit2(t, strikes, stdDevs2, atm);
      const ksec31 = new KahaleSmileSection(sec3, atm, false, false, false, money);
      const ksec32 = new KahaleSmileSection(sec3, atm, true, false, true, money);
      expect(Math.abs(ksec31.leftCoreStrike() - 0.01)).toBeLessThan(tol);
      expect(Math.abs(ksec32.leftCoreStrike() - 0.02)).toBeLessThan(tol);
      expect(Math.abs(ksec32.leftCoreStrike() - 0.01)).toBeLessThan(tol);
      expect(Math.abs(ksec31.rightCoreStrike() - 0.08)).toBeLessThan(tol);
      expect(Math.abs(ksec32.rightCoreStrike() - 0.10)).toBeLessThan(tol);
      k = 0.0010;
      dig00 = dig10 = 1.0;
      while (k <= 2.0 * Array1D.back(strikes) + tol) {
          const dig0 = ksec31.digitalOptionPrice(k);
          const dig1 = ksec32.digitalOptionPrice(k);
          expect(dig0).toBeLessThanOrEqual(dig00 + tol);
          expect(dig0).toBeGreaterThanOrEqual(0.0);
          expect(dig1).toBeLessThanOrEqual(dig10 + tol);
          expect(dig1).toBeGreaterThanOrEqual(0.0);
          dig00 = dig0;
          dig10 = dig1;
          k += 0.0001;
      }
  });

  it('Testing Markov functional calibration to one instrument set...', () => {
      const tol0 = 0.0001;
      const tol1 = 0.0001;
      const referenceDate = DateExt.UTC('14,November,2012');
      Settings.evaluationDate.set(referenceDate);
      const flatYts_ = flatYts();
      const flatSwaptionVts_ = flatSwaptionVts();
      const swapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years));
      const volStepDates = [];
      const vols = [];
      vols.push(1.0);
      const money = [];
      money.push(0.1);
      money.push(0.25);
      money.push(0.50);
      money.push(0.75);
      money.push(1.0);
      money.push(1.25);
      money.push(1.50);
      money.push(2.0);
      money.push(5.0);
      const mf1 = new MarkovFunctional().mfInit1(flatYts_, 0.01, volStepDates, vols, flatSwaptionVts_, expiriesCalBasket1(), tenorsCalBasket1(), swapIndexBase, new MarkovFunctional.ModelSettings()
          .init1()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(32)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withAdjustments(MarkovFunctional.ModelSettings.Adjustments.KahaleSmile |
          MarkovFunctional.ModelSettings.Adjustments
              .SmileExponentialExtrapolation)
          .withSmileMoneynessCheckpoints(money));
      const outputs1 = mf1.modelOutputs();
      for (let i = 0; i < outputs1._expiries.length; i++) {
          expect(Math.abs(outputs1._marketZerorate[i] - outputs1._modelZerorate[i]))
              .toBeLessThan(tol0);
      }
      for (let i = 0; i < outputs1._expiries.length; i++) {
          for (let j = 0; j < outputs1._smileStrikes[i].length; j++) {
              expect(Math.abs(outputs1._marketCallPremium[i][j] -
                  outputs1._modelCallPremium[i][j]))
                  .toBeLessThan(tol1);
          }
      }
  });

  it('Testing Markov functional vanilla engines...', () => {
      const tol1 = 0.0001;
      const savedEvalDate = Settings.evaluationDate.f();
      const referenceDate = DateExt.UTC('14,November,2012');
      Settings.evaluationDate.set(referenceDate);
      const flatYts_ = flatYts();
      const md0Yts_ = md0Yts();
      const flatSwaptionVts_ = flatSwaptionVts();
      const md0SwaptionVts_ = md0SwaptionVts();
      const flatOptionletVts_ = flatOptionletVts();
      const md0OptionletVts_ = md0OptionletVts();
      const swapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years));
      const volStepDates = [];
      const vols = [];
      vols.push(1.0);
      const money = [];
      money.push(0.1);
      money.push(0.25);
      money.push(0.50);
      money.push(0.75);
      money.push(1.0);
      money.push(1.25);
      money.push(1.50);
      money.push(2.0);
      money.push(5.0);
      const iborIndex1 = new Euribor(new Period().init1(6, TimeUnit.Months), flatYts_);
      const mf1 = new MarkovFunctional().mfInit1(flatYts_, 0.01, volStepDates, vols, flatSwaptionVts_, expiriesCalBasket1(), tenorsCalBasket1(), swapIndexBase, new MarkovFunctional.ModelSettings()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(32)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withSmileMoneynessCheckpoints(money));
      const outputs1 = mf1.modelOutputs();
      const mfSwaptionEngine1 = new Gaussian1dSwaptionEngine().g1dseInit1(mf1, 64, 7.0);
      const blackSwaptionEngine1 = new BlackSwaptionEngine().bseInit3(flatYts_, flatSwaptionVts_);
      for (let i = 0; i < outputs1._expiries.length; i++) {
          for (let j = 0; j < outputs1._smileStrikes[0].length; j++) {
              const underlyingCall = new MakeVanillaSwap(outputs1._tenors[i], iborIndex1, outputs1._smileStrikes[i][j])
                  .withEffectiveDate(new TARGET().advance1(outputs1._expiries[i], 2, TimeUnit.Days))
                  .receiveFixed(false)
                  .f();
              const underlyingPut = new MakeVanillaSwap(outputs1._tenors[i], iborIndex1, outputs1._smileStrikes[i][j])
                  .withEffectiveDate(new TARGET().advance1(outputs1._expiries[i], 2, TimeUnit.Days))
                  .receiveFixed(true)
                  .f();
              const exercise = new EuropeanExercise(outputs1._expiries[i]);
              const swaptionC = new Swaption(underlyingCall, exercise);
              const swaptionP = new Swaption(underlyingPut, exercise);
              swaptionC.setPricingEngine(blackSwaptionEngine1);
              swaptionP.setPricingEngine(blackSwaptionEngine1);
              const blackPriceCall = swaptionC.NPV();
              const blackPricePut = swaptionP.NPV();
              swaptionC.setPricingEngine(mfSwaptionEngine1);
              swaptionP.setPricingEngine(mfSwaptionEngine1);
              const mfPriceCall = swaptionC.NPV();
              const mfPricePut = swaptionP.NPV();
              expect(Math.abs(blackPriceCall - mfPriceCall)).toBeLessThan(tol1);
              expect(Math.abs(blackPricePut - mfPricePut)).toBeLessThan(tol1);
          }
      }
      const iborIndex2 = new Euribor(new Period().init1(6, TimeUnit.Months), flatYts_);
      const mf2 = new MarkovFunctional().mfInit2(flatYts_, 0.01, volStepDates, vols, flatOptionletVts_, expiriesCalBasket2(), iborIndex2, new MarkovFunctional.ModelSettings()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(16)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withSmileMoneynessCheckpoints(money));
      const blackCapFloorEngine2 = new BlackCapFloorEngine().init3(flatYts_, flatOptionletVts_);
      const mfCapFloorEngine2 = new Gaussian1dCapFloorEngine(mf2, 64, 7.0);
      const c2 = [];
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.01)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.02)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.03)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.04)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.05)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.07)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.10)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.01)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.02)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.03)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.04)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.05)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.07)
          .f());
      c2.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex2, 0.10)
          .f());
      for (let i = 0; i < c2.length; i++) {
          c2[i].setPricingEngine(blackCapFloorEngine2);
          const blackPrice = c2[i].NPV();
          c2[i].setPricingEngine(mfCapFloorEngine2);
          const mfPrice = c2[i].NPV();
          expect(Math.abs(blackPrice - mfPrice)).toBeLessThan(tol1);
      }
      const iborIndex3 = new Euribor(new Period().init1(6, TimeUnit.Months), md0Yts_);
      const mf3 = new MarkovFunctional().mfInit1(md0Yts_, 0.01, volStepDates, vols, md0SwaptionVts_, expiriesCalBasket1(), tenorsCalBasket1(), swapIndexBase, new MarkovFunctional.ModelSettings()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(32)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withSmileMoneynessCheckpoints(money));
      const mfSwaptionEngine3 = new Gaussian1dSwaptionEngine().g1dseInit1(mf3, 64, 7.0);
      const blackSwaptionEngine3 = new BlackSwaptionEngine().bseInit3(md0Yts_, md0SwaptionVts_);
      const outputs3 = mf3.modelOutputs();
      for (let i = 0; i < outputs3._expiries.length; i++) {
          for (let j = 0; j < outputs3._smileStrikes[0].length; j++) {
              const underlyingCall = new MakeVanillaSwap(outputs3._tenors[i], iborIndex3, outputs3._smileStrikes[i][j])
                  .withEffectiveDate(new TARGET().advance1(outputs3._expiries[i], 2, TimeUnit.Days))
                  .receiveFixed(false)
                  .f();
              const underlyingPut = new MakeVanillaSwap(outputs3._tenors[i], iborIndex3, outputs3._smileStrikes[i][j])
                  .withEffectiveDate(new TARGET().advance1(outputs3._expiries[i], 2, TimeUnit.Days))
                  .receiveFixed(true)
                  .f();
              const exercise = new EuropeanExercise(outputs3._expiries[i]);
              const swaptionC = new Swaption(underlyingCall, exercise);
              const swaptionP = new Swaption(underlyingPut, exercise);
              swaptionC.setPricingEngine(blackSwaptionEngine3);
              swaptionP.setPricingEngine(blackSwaptionEngine3);
              const blackPriceCall = swaptionC.NPV();
              const blackPricePut = swaptionP.NPV();
              swaptionC.setPricingEngine(mfSwaptionEngine3);
              swaptionP.setPricingEngine(mfSwaptionEngine3);
              const mfPriceCall = swaptionC.NPV();
              const mfPricePut = swaptionP.NPV();
              const smileCorrectionCall = (outputs3._marketCallPremium[i][j] -
                  outputs3._marketRawCallPremium[i][j]);
              const smileCorrectionPut = (outputs3._marketPutPremium[i][j] -
                  outputs3._marketRawPutPremium[i][j]);
              expect(Math.abs(blackPriceCall - mfPriceCall + smileCorrectionCall))
                  .toBeLessThan(tol1);
              expect(Math.abs(blackPricePut - mfPricePut + smileCorrectionPut))
                  .toBeLessThan(tol1);
          }
      }
      const iborIndex4 = new Euribor(new Period().init1(6, TimeUnit.Months), md0Yts_);
      const mf4 = new MarkovFunctional().mfInit2(md0Yts_, 0.01, volStepDates, vols, md0OptionletVts_, expiriesCalBasket2(), iborIndex4, new MarkovFunctional.ModelSettings()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(32)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withSmileMoneynessCheckpoints(money));
      const blackCapFloorEngine4 = new BlackCapFloorEngine().init3(md0Yts_, md0OptionletVts_);
      const mfCapFloorEngine4 = new Gaussian1dCapFloorEngine(mf4, 64, 7.0);
      const c4 = [];
      c4.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.01)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.02)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.03)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.04)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.05)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Cap, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.06)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.01)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.02)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.03)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.04)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.05)
          .f());
      c4.push(new MakeCapFloor(CapFloor.Type.Floor, new Period().init1(5, TimeUnit.Years), iborIndex4, 0.06)
          .f());
      for (let i = 0; i < c4.length; i++) {
          c4[i].setPricingEngine(blackCapFloorEngine4);
          const blackPrice = c4[i].NPV();
          c4[i].setPricingEngine(mfCapFloorEngine4);
          const mfPrice = c4[i].NPV();
          expect(Math.abs(blackPrice - mfPrice)).toBeLessThan(tol1);
      }
      Settings.evaluationDate.set(savedEvalDate);
  });

  it('Testing Markov functional calibration to two instrument sets...', () => {
      const tol1 = 0.1;
      const savedEvalDate = Settings.evaluationDate.f();
      const referenceDate = DateExt.UTC('14,November,2012');
      Settings.evaluationDate.set(referenceDate);
      const flatYts_ = flatYts();
      const md0Yts_ = md0Yts();
      const flatSwaptionVts_ = flatSwaptionVts();
      const md0SwaptionVts_ = md0SwaptionVts();
      const swapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years));
      const volStepDates = [];
      const vols = [];
      volStepDates.push(new TARGET().advance1(referenceDate, 1, TimeUnit.Years));
      volStepDates.push(new TARGET().advance1(referenceDate, 2, TimeUnit.Years));
      volStepDates.push(new TARGET().advance1(referenceDate, 3, TimeUnit.Years));
      volStepDates.push(new TARGET().advance1(referenceDate, 4, TimeUnit.Years));
      vols.push(1.0);
      vols.push(1.0);
      vols.push(1.0);
      vols.push(1.0);
      vols.push(1.0);
      const money = [];
      money.push(0.1);
      money.push(0.25);
      money.push(0.50);
      money.push(0.75);
      money.push(1.0);
      money.push(1.25);
      money.push(1.50);
      money.push(2.0);
      money.push(5.0);
      const om = new LevenbergMarquardt();
      const ec = new EndCriteria(1000, 500, 1e-2, 1e-2, 1e-2);
      const iborIndex1 = new Euribor(new Period().init1(6, TimeUnit.Months), flatYts_);
      const calibrationHelper1 = [];
      const calibrationHelperVols1 = [];
      calibrationHelperVols1.push(0.20);
      calibrationHelperVols1.push(0.20);
      calibrationHelperVols1.push(0.20);
      calibrationHelperVols1.push(0.20);
      calibrationHelper1.push(new SwaptionHelper().shInit1(new Period().init1(1, TimeUnit.Years), new Period().init1(4, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols1[0])), iborIndex1, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), flatYts_));
      calibrationHelper1.push(new SwaptionHelper().shInit1(new Period().init1(2, TimeUnit.Years), new Period().init1(3, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols1[1])), iborIndex1, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), flatYts_));
      calibrationHelper1.push(new SwaptionHelper().shInit1(new Period().init1(3, TimeUnit.Years), new Period().init1(2, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols1[2])), iborIndex1, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), flatYts_));
      calibrationHelper1.push(new SwaptionHelper().shInit1(new Period().init1(4, TimeUnit.Years), new Period().init1(1, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols1[3])), iborIndex1, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), flatYts_));
      const mf1 = new MarkovFunctional().mfInit1(flatYts_, 0.01, volStepDates, vols, flatSwaptionVts_, expiriesCalBasket1(), tenorsCalBasket1(), swapIndexBase, new MarkovFunctional.ModelSettings()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(32)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withSmileMoneynessCheckpoints(money));
      const mfSwaptionEngine1 = new Gaussian1dSwaptionEngine().g1dseInit1(mf1, 64, 7.0);
      calibrationHelper1[0].setPricingEngine(mfSwaptionEngine1);
      calibrationHelper1[1].setPricingEngine(mfSwaptionEngine1);
      calibrationHelper1[2].setPricingEngine(mfSwaptionEngine1);
      calibrationHelper1[3].setPricingEngine(mfSwaptionEngine1);
      mf1.calibrate(calibrationHelper1, om, ec);
      const ch1 = [];
      ch1.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(4, TimeUnit.Years), flatYts_), new Period().init1(1, TimeUnit.Years))
          .f());
      ch1.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(3, TimeUnit.Years), flatYts_), new Period().init1(2, TimeUnit.Years))
          .f());
      ch1.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(2, TimeUnit.Years), flatYts_), new Period().init1(3, TimeUnit.Years))
          .f());
      ch1.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years), flatYts_), new Period().init1(4, TimeUnit.Years))
          .f());
      for (let i = 0; i < ch1.length; i++) {
          const blackEngine = new BlackSwaptionEngine().bseInit1(flatYts_, calibrationHelperVols1[i]);
          ch1[i].setPricingEngine(blackEngine);
          const blackPrice = ch1[i].NPV();
          const blackVega = ch1[i].result('vega');
          ch1[i].setPricingEngine(mfSwaptionEngine1);
          const mfPrice = ch1[i].NPV();
          expect(Math.abs(blackPrice - mfPrice) / blackVega).toBeLessThan(tol1);
      }
      const iborIndex2 = new Euribor(new Period().init1(6, TimeUnit.Months), md0Yts_);
      const mf2 = new MarkovFunctional().mfInit1(md0Yts_, 0.01, volStepDates, vols, md0SwaptionVts_, expiriesCalBasket1(), tenorsCalBasket1(), swapIndexBase, new MarkovFunctional.ModelSettings()
          .withYGridPoints(64)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(32)
          .withDigitalGap(1e-5)
          .withMarketRateAccuracy(1e-7)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0)
          .withSmileMoneynessCheckpoints(money));
      const calibrationHelper2 = [];
      const calibrationHelperVols2 = [];
      calibrationHelperVols2.push(md0SwaptionVts_.currentLink().volatility1(new Period().init1(1, TimeUnit.Years), new Period().init1(4, TimeUnit.Years), md0SwaptionVts_.currentLink()
          .atmStrike2(new Period().init1(1, TimeUnit.Years), new Period().init1(4, TimeUnit.Years))));
      calibrationHelperVols2.push(md0SwaptionVts_.currentLink().volatility1(new Period().init1(2, TimeUnit.Years), new Period().init1(3, TimeUnit.Years), md0SwaptionVts_.currentLink()
          .atmStrike2(new Period().init1(2, TimeUnit.Years), new Period().init1(3, TimeUnit.Years))));
      calibrationHelperVols2.push(md0SwaptionVts_.currentLink().volatility1(new Period().init1(3, TimeUnit.Years), new Period().init1(2, TimeUnit.Years), md0SwaptionVts_.currentLink()
          .atmStrike2(new Period().init1(3, TimeUnit.Years), new Period().init1(2, TimeUnit.Years))));
      calibrationHelperVols2.push(md0SwaptionVts_.currentLink().volatility1(new Period().init1(4, TimeUnit.Years), new Period().init1(1, TimeUnit.Years), md0SwaptionVts_.currentLink()
          .atmStrike2(new Period().init1(4, TimeUnit.Years), new Period().init1(1, TimeUnit.Years))));
      calibrationHelper2.push(new SwaptionHelper().shInit1(new Period().init1(1, TimeUnit.Years), new Period().init1(4, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols2[0])), iborIndex2, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), md0Yts_));
      calibrationHelper2.push(new SwaptionHelper().shInit1(new Period().init1(2, TimeUnit.Years), new Period().init1(3, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols2[1])), iborIndex2, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), md0Yts_));
      calibrationHelper2.push(new SwaptionHelper().shInit1(new Period().init1(3, TimeUnit.Years), new Period().init1(2, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols2[2])), iborIndex2, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), md0Yts_));
      calibrationHelper2.push(new SwaptionHelper().shInit1(new Period().init1(4, TimeUnit.Years), new Period().init1(1, TimeUnit.Years), new Handle(new SimpleQuote(calibrationHelperVols2[3])), iborIndex2, new Period().init1(1, TimeUnit.Years), new Thirty360(), new Actual360(), md0Yts_));
      const mfSwaptionEngine2 = new Gaussian1dSwaptionEngine().g1dseInit1(mf2, 64, 7.0);
      calibrationHelper2[0].setPricingEngine(mfSwaptionEngine2);
      calibrationHelper2[1].setPricingEngine(mfSwaptionEngine2);
      calibrationHelper2[2].setPricingEngine(mfSwaptionEngine2);
      calibrationHelper2[3].setPricingEngine(mfSwaptionEngine2);
      mf2.calibrate(calibrationHelper2, om, ec);
      const ch2 = [];
      ch2.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(4, TimeUnit.Years), md0Yts_), new Period().init1(1, TimeUnit.Years))
          .f());
      ch2.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(3, TimeUnit.Years), md0Yts_), new Period().init1(2, TimeUnit.Years))
          .f());
      ch2.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(2, TimeUnit.Years), md0Yts_), new Period().init1(3, TimeUnit.Years))
          .f());
      ch2.push(new MakeSwaption()
          .init1(new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years), md0Yts_), new Period().init1(4, TimeUnit.Years))
          .f());
      for (let i = 0; i < ch2.length; i++) {
          const blackEngine = new BlackSwaptionEngine().bseInit1(md0Yts_, calibrationHelperVols2[i]);
          ch2[i].setPricingEngine(blackEngine);
          const blackPrice = ch2[i].NPV();
          const blackVega = ch2[i].result('vega');
          ch2[i].setPricingEngine(mfSwaptionEngine2);
          const mfPrice = ch2[i].NPV();
          expect(Math.abs(blackPrice - mfPrice) / blackVega).toBeLessThan(tol1);
      }
      Settings.evaluationDate.set(savedEvalDate);
  });

  it('Testing Markov functional Bermudan swaption engine...', () => {
      const tol0 = 0.0001;
      const savedEvalDate = Settings.evaluationDate.f();
      const referenceDate = DateExt.UTC('14,November,2012');
      Settings.evaluationDate.set(referenceDate);
      const md0Yts_ = md0Yts();
      const md0SwaptionVts_ = md0SwaptionVts();
      const swapIndexBase = new EuriborSwapIsdaFixA().esInit1(new Period().init1(1, TimeUnit.Years));
      const volStepDates = [];
      const vols = [];
      vols.push(1.0);
      const iborIndex1 = new Euribor(new Period().init1(6, TimeUnit.Months), md0Yts_);
      const mf1 = new MarkovFunctional().mfInit1(md0Yts_, 0.01, volStepDates, vols, md0SwaptionVts_, expiriesCalBasket3(), tenorsCalBasket3(), swapIndexBase, new MarkovFunctional.ModelSettings()
          .withYGridPoints(32)
          .withYStdDevs(7.0)
          .withGaussHermitePoints(16)
          .withMarketRateAccuracy(1e-7)
          .withDigitalGap(1e-5)
          .withLowerRateBound(0.0)
          .withUpperRateBound(2.0));
      const mfSwaptionEngine1 = new Gaussian1dSwaptionEngine().g1dseInit1(mf1, 64, 7.0);
      const underlyingCall = new MakeVanillaSwap(new Period().init1(10, TimeUnit.Years), iborIndex1, 0.03)
          .withEffectiveDate(new TARGET().advance1(referenceDate, 2, TimeUnit.Days))
          .receiveFixed(false)
          .f();
      const europeanExercises = [];
      const expiries = expiriesCalBasket3();
      const europeanSwaptions = [];
      for (let i = 0; i < expiries.length; i++) {
          europeanExercises.push(new EuropeanExercise(expiries[i]));
          europeanSwaptions.push(new Swaption(underlyingCall, europeanExercises[i]));
          Array1D.back(europeanSwaptions).setPricingEngine(mfSwaptionEngine1);
      }
      const bermudanExercise = new BermudanExercise().beInit(expiries);
      const bermudanSwaption = new Swaption(underlyingCall, bermudanExercise);
      bermudanSwaption.setPricingEngine(mfSwaptionEngine1);
      const cachedValues = [
          0.0030757, 0.0107344, 0.0179862, 0.0225881, 0.0243215, 0.0229148,
          0.0191415, 0.0139035, 0.0076354
      ];
      const cachedValue = 0.0327776;
      for (let i = 0; i < expiries.length; i++) {
          const npv = europeanSwaptions[i].NPV();
          expect(Math.abs(npv - cachedValues[i])).toBeLessThan(tol0);
      }
      const npv = bermudanSwaption.NPV();
      expect(Math.abs(npv - cachedValue)).toBeLessThan(tol0);
      Settings.evaluationDate.set(savedEvalDate);
  });
});
