import { Handle, SimpleQuote, Stock } from 'https://cdn.jsdelivr.net/npm/@quantlib/ql@latest/ql.mjs';
import { Flag } from '/test-suite/utilities.mjs';

describe('LazyObject tests', () => {
    it('Testing that lazy objects discard notifications after the first...', () => {
        const q = new SimpleQuote(0.0);
        const s = new Stock(new Handle(q));
        const f = new Flag();
        f.registerWith(s);
        s.NPV();
        q.setValue(1.0);
        expect(f.isUp()).toEqual(true);
        f.lower();
        q.setValue(2.0);
        expect(f.isUp()).toEqual(false);
        f.lower();
        s.NPV();
        q.setValue(3.0);
        expect(f.isUp()).toEqual(true);
    });
    
    it('Testing that lazy objects forward all notifications when told...', () => {
        const q = new SimpleQuote(0.0);
        const s = new Stock(new Handle(q));
        s.alwaysForwardNotifications();
        const f = new Flag();
        f.registerWith(s);
        s.NPV();
        q.setValue(1.0);
        expect(f.isUp()).toEqual(true);
        f.lower();
        q.setValue(2.0);
        expect(f.isUp()).toEqual(true);
    });
});