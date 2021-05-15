# Repeaters

A utility to create tracked, recurring, timed routines which repeat forever (or until aborted).

## Install

```sh
npm install @flamescape/repeaters
```

## Example Usage

```js
const {RepeaterCollection} = require('@flamescape/repeaters');

const repeaters = new RepeaterCollection();

const repeatingTask = repeaters.add(async ({signal, delta, abort, count}) => {
    console.log(`Task interation #${count}`);
    console.log(`Milliseconds since last run: ${delta}`);

    await someLengthyAsyncFunc();

    if (signal.aborted) return; // if aborted, return early

    await anotherLengthyAsyncFunc();

}, {
    delay: 1000, // start running tasks after 1 second
    interval: 30*1000, // run task every 30 seconds
});

repeatingTask.on('run', (params) => console.log('run', params));
repeatingTask.on('abort', () => console.log('aborting'));
repeatingTask.on('aborted', () => console.log('aborted'));
repeatingTask.on('error', (err) => console.log('error', err));

setTimeout(() => {
    // abort after 5 minutes
    repeatingTask.abort();
}, 5*60*1000);

```

## API

### new RepeaterCollection();

Creates an empty collection of `Repeater`s.

#### RepeaterCollection#add(callback, options);

Create & add a new tracked `Repeater` to the collection.

* `callback`: A function to be called at the specified interval. The callback will be called until the `Repeater` is `abort()`ed.
* `options`:
    * `interval`: Milliseconds between each run of the task (defaults to 0 - runs immediately after previous invocation is complete).
    * `delay`: Milliseconds before the first run of the task (defaults to 0).
    * `context`: The `this` context to bind to the callback.

Returns: `Repeater`

#### RepeaterCollection#abort();

Calls `abort()` on every `Repeater` in the collection, attempting to stop any running tasks.

Returns a `Promise` which resolves after all running tasks have ended and are no longer scheduled to run.

### `Repeater`

#### Repeater#abort();

Stops the recurring task and attempts to signal to any running task that it should return early.

Returns a `Promise` which resolves after the current running task has ended or when no more tasks are scheduled to run.

#### Repeater#on(eventName, listener)
#### Repeater#once(eventName, listener)
#### Repeater#removeListener(eventName, listener)

(See https://nodejs.org/api/events.html)
