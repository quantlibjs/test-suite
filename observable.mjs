import { ObservableSettings, Observer, SimpleQuote } from '/ql.mjs';

class UpdateCounter extends Observer {
    constructor() {
        super(...arguments);
        this._counter = 0;
    }
    update() {
        ++this._counter;
    }
    counter() {
        return this._counter;
    }
}

describe('Observer tests', () => {
    it('Testing observable settings...', () => {
        const quote = new SimpleQuote(100.0);
        const updateCounter = new UpdateCounter();
        updateCounter.registerWith(quote);
        expect(updateCounter.counter()).toEqual(0);
        quote.setValue(1.0);
        expect(updateCounter.counter()).toEqual(1);
        ObservableSettings.disableUpdates(false);
        quote.setValue(2.0);
        expect(updateCounter.counter()).toEqual(1);
        ObservableSettings.enableUpdates();
        expect(updateCounter.counter()).toEqual(1);
        ObservableSettings.disableUpdates(true);
        quote.setValue(3.0);
        expect(updateCounter.counter()).toEqual(1);
        ObservableSettings.enableUpdates();
        expect(updateCounter.counter()).toEqual(2);
        const updateCounter2 = new UpdateCounter();
        updateCounter2.registerWith(quote);
        ObservableSettings.disableUpdates(true);
        for (let i = 0; i < 10; ++i) {
            quote.setValue(i);
        }
        expect(updateCounter.counter()).toEqual(2);
        ObservableSettings.enableUpdates();
        expect(updateCounter.counter()).toEqual(3);
        expect(updateCounter2.counter()).toEqual(1);
    });
});