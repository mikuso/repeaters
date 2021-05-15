const EventEmitter = require('events');

class Repeater extends EventEmitter {
    /**
     * Create a new repeater
     * @param {Function} callback A function to be called on each repetition.
     * @param {Object}   options  Repeater options
     * @param {Number}   options.interval  Milliseconds between each invocation of the callback
     * @param {Number}   options.delay  Milliseconds before first invocation
     * @param {Object}   options.context  The "this" context of the callback
     */
    constructor(callback, options) {
        super();

        if (callback === undefined) {
            throw Error("Callback must be provided");
        }
        if (options === undefined) {
            throw Error("Options must be provided");
        }

        if (typeof options === 'number') {
            options = {interval: options};
        }

        if (options.context) {
            callback = callback.bind(options.context);
        }
        this._callback = callback;

        if (typeof options.interval !== 'number') {
            options.interval = 0;
        }
        this._intervalMs = options.interval;

        if (typeof options.delay !== 'number') {
            options.delay = 0;
        }
        this._delay = Math.max(options.delay, 0);

        this._aborted = false;
        this._abortSignal = Object.defineProperty({}, 'aborted', {
            get: ()=>this._aborted,
            set: ()=>{throw Error("Cannot set aborted property. Use abort() instead")},
        });

        this._lastRunTime = null;
        this._lastRunResolve = null;
        this._lastRunPromise = null;

        this._runThis = this._run.bind(this);
        this._runParams = {
            abort: () => {
                const aborting = this.abort();
                this._completeRun();
                return aborting;
            },
            signal: this._abortSignal,
            delta: 0,
            count: 0,
        };

        this._scheduleStart();
    }

    /**
     * Attempt to abort iteration in progress and prevent all future iterations
     * @return {Promise} Fulfilled when current iteration (if any) has ended
     */
    async abort() {
        if (this._aborted) return;
        // set flag so that we don't perform any more runs
        this._aborted = true;
        this.emit('abort');

        if (this._timer) {
            // clear any scheduled runs
            clearTimeout(this._timer);
            this._timer = null;
            this._timerMs = null;
        }

        if (this._lastRunPromise) {
            // if a run is already in progress, wait for it to complete
            await this._lastRunPromise;
        }
        this.emit('aborted');
    }

    _scheduleStart() {
        this._timerMs = this._delay;
        this._timer = setTimeout(this._runThis, this._delay);
    }

    async _run() {
        if (this._aborted) return;

        const now = Date.now();
        const delta = this._lastRunTime ? (now - this._lastRunTime) : null;
        this._lastRunTime = now;

        this._runParams.delta = delta;
        this._runParams.count++;

        this._lastRunPromise = new Promise(resolve => {
            this._lastRunResolve = resolve;
        });

        try {
            this.emit('run', this._runParams);
            await this._callback(this._runParams);
        } catch (err) {
            this.emit('error', err);
        } finally {
            this._completeRun();
        }
    }

    _completeRun() {
        if (this._lastRunResolve) {
            this._lastRunResolve();
        }

        if (this._aborted) return;

        if (this._intervalMs !== this._timerMs || !this._timer || !this._timer.refresh) {
            // create a new timeout object
            this._timerMs = this._intervalMs;
            this._timer = setTimeout(this._runThis, this._intervalMs);
        } else {
            // reuse old timeout object
            this._timer.refresh();
        }
    }
}

module.exports = Repeater;
