const Repeater = require('./repeater');

class RepeaterCollection {
    constructor() {
        this._repeaters = new Set();
    }

    /**
     * Create a new repeater
     * @param {Function} callback A function to be called on each repetition.
     * @param {Object}   options  Repeater options
     * @param {Number}   options.interval  Milliseconds between each invocation of the callback
     * @param {Number}   options.delay  Milliseconds before first invocation
     * @param {Object}   options.context  The "this" context of the callback
     */
    add(callback, options) {
        const repeater = new Repeater(callback, options);
        this._repeaters.add(repeater);
        repeater.once('aborted', () => this._repeaters.delete(repeater));
        return repeater;
    }

    /**
     * Abort all repeaters and wait for them to end
     * @return {Promise} Fulfilled when all repeaters have ended execution
     */
    async abort() {
        const allRepeaters = Array.from(this._repeaters.values());
        await Promise.all(allRepeaters.map(rep => rep.abort()));
    }
}

module.exports = RepeaterCollection;
