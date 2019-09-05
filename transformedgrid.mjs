import { BoundedGrid, TransformedGrid } from '/ql.mjs';
class PlusOne {
    f(x) {
        return x + 1;
    }
}
describe('transformed grid', () => {
    it('Testing transformed grid construction...', () => {
        const p1 = new PlusOne();
        const grid = BoundedGrid(0, 100, 100);
        const tg = new TransformedGrid().init2(grid, p1);
        expect(Math.abs(tg.grid(0) - 0.0)).toBeLessThan(1e-5);
        expect(Math.abs(tg.transformedGrid(0) - 1.0)).toBeLessThan(1e-5);
    });
});
//# sourceMappingURL=transformedgrid.js.map