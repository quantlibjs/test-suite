import { Array1D, Array2D, CreditRiskPlus } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql/ql.mjs';

describe('Credit risk plus tests', () => {
    it('Testing extended credit risk plus model against reference values...', () => {
        const tol = 1E-8;
        const sector1Exposure = Array1D.fromSizeValue(1000, 1.0);
        const sector1Pd = Array1D.fromSizeValue(1000, 0.04);
        const sector1Sector = Array1D.fromSizeValue(1000, 0);
        const sector2Exposure = Array1D.fromSizeValue(1000, 2.0);
        const sector2Pd = Array1D.fromSizeValue(1000, 0.02);
        const sector2Sector = Array1D.fromSizeValue(1000, 1);
        const exposure = [];
        Array1D.insertArray(exposure, exposure.length, sector1Exposure);
        Array1D.insertArray(exposure, exposure.length, sector2Exposure);
        const pd = [];
        Array1D.insertArray(pd, pd.length, sector1Pd);
        Array1D.insertArray(pd, pd.length, sector2Pd);
        const sector = [];
        Array1D.insertArray(sector, sector.length, sector1Sector);
        Array1D.insertArray(sector, sector.length, sector2Sector);
        const relativeDefaultVariance = [];
        relativeDefaultVariance.push(0.75 * 0.75);
        relativeDefaultVariance.push(0.75 * 0.75);
        const rho = Array2D.newMatrix(2, 2);
        rho[0][0] = rho[1][1] = 1.0;
        rho[0][1] = rho[1][0] = 0.50;
        const unit = 0.1;
        const cr = new CreditRiskPlus(exposure, pd, sector, relativeDefaultVariance, rho, unit);
        expect(Math.abs(cr.sectorExposures()[0] - 1000.0)).toBeLessThan(tol);
        expect(Math.abs(cr.sectorExposures()[1] - 2000.0)).toBeLessThan(tol);
        expect(Math.abs(cr.sectorExpectedLoss()[0] - 40.0)).toBeLessThan(tol);
        expect(Math.abs(cr.sectorExpectedLoss()[1] - 40.0)).toBeLessThan(tol);
        expect(Math.abs(cr.sectorUnexpectedLoss()[0] - 30.7)).toBeLessThan(0.05);
        expect(Math.abs(cr.sectorUnexpectedLoss()[1] - 31.3)).toBeLessThan(0.05);
        expect(Math.abs(cr.exposure() - 3000.0)).toBeLessThan(tol);
        expect(Math.abs(cr.expectedLoss() - 80.0)).toBeLessThan(tol);
        expect(Math.abs(cr.unexpectedLoss() - 53.1)).toBeLessThan(0.01);
        expect(Math.abs(cr.relativeDefaultVariance() - 0.65 * 0.65))
            .toBeLessThan(0.001);
        expect(Math.abs(cr.lossQuantile(0.99) - 250)).toBeLessThan(0.5);
    });
});
//# sourceMappingURL=creditriskplus.js.map