# audiofile

Dead easy audio


## Factsheet

* Permissive MIT license
* Designed both for app UI and game usecases
* Automatic caching and preloading
* Audiofiles are replayable
* Rapid fire sound support
* Play multiple audiofiles simultaneously
* Maintains the user's background music on mobile (a killer feature if you want to allow the user to play their own music or podcasts while playing your app/game)
* Promise support
* npm/browserify/webpack and global browser module support
* Desktop and mobile browsers support
* Chaining support
* Demo included


## Prerequisites

* [`Promise`](https://developer.mozilla.org/en-US/docs/Mozilla/JavaScript_code_modules/Promise.jsm/Promise) : [`thenable`](https://github.com/rse/thenable) and [`es6-promise`](https://github.com/jakearchibald/es6-promise) are good polyfills
* [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) :  [`whatwg-fetch`](https://github.com/github/fetch) is a good polyfill
* [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) : Native support for the Web Audio API is required in order to produce the audio


## Installation

Install with npm:

```
npm install audiofile
```

Alternatively, you can just download `audiofile.js` and use `<script>` tags.


## Usage

### Initialisation

The library exposes the `Audiofile` object, from which you can create instances:

```js
var af = new Audiofile({ /* options... */ });
```

The use of the new keyword is optional, so you could instead do:

```js
var audiofile = require('audiofile');
var af = audiofile({ /* options... */ });
```

The `options` object can contain these fields:

* `url` : The URL of the audio (mandatory if using `fetch`).
* `fetch` : A fetch [init options object](https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch#Parameters), allowing you to customise the request headers et cetera (fetch defaults are default here, i.e. plain HTTP GET).
* `load` : An alternative to `fetch`.  When specified, `fetch` is ignored the `load` promise is used to get the file.  The promise is expected to resolve to a `Blob`.
* `preload` : Whether or not to load the audio on object creation (default `true`).
* `loop` : Whether to infinitely loop the audio (default `false`).
* `volume` : The volume of the audio in percent (0 to 1 inclusive; default `1`).  Values greater than 1 boost the volume.
* `output` : Redirects the output of the audiofile to the specified `AudioNode`, allowing for postprocessing of the audio (system audio is the default).

### Audiofile.killUserAudio()

If you want to disable the user's own background audio (e.g. music, podcasts), then you must call this function.  This is useful in games with their own background music.  By default, the user's background audio is respected.

```js
Audiofile.killUserAudio();
```

You may alternatively call this:

```js
Audiofile.resetUserAudio();
```

### af.clone()

Calling `af.clone()` returns a new audiofile that has the same cached audio as the calling audiofile.  The cloned audiofile can be played independently of the calling audiofile.  This is especially useful for rapid fire usecases.

```js
var af2 = af.clone();
```

### af.load()

Calling `af.load()` returns a promise that is fulfilled when loading is completed.  It's useful if you want to load the audio at a particular time, and it's generally useful for detecting when you can play.

```js
af.load().then(function(){
  console.log('audiofile loaded');
});
```

If you want a quick synchronous check if the audiofile is loaded or not, just read `af.loaded`:

```js
if( af.loaded ){
  console.log('do something');
} else {
  console.log('do something else');
}
```

### af.play()

Play the audiofile at its current progress level.

```js
af.play();
```

### af.pause()

Pause the audiofile at its current progress level.  It can be resumed via `af.play()`.

```js
af.pause();
```

### af.stop()

Stop playback of the audiofile and resets its progress to the beginning.

```js
af.stop();
```

### af.progress()

Get or set the progress of the audiofile in milliseconds.

```js
var time = af.progress(); // get progress

af.progress( 2*time ); // progress twice as far
```

### af.progressDelta()

Set the progress of the audiofile relatively in milliseconds.  Positive values fastforward the audiofile, and negative values rewind the audiofile.

```js
af.progressDelta( 1000 ); // fastforward 1 second
```

There are also aliases:

```js
af.rewind( 1000 ); // same as af.progressDelta( -1000 )
af.fastforward( 1000 ); // same as af.progressDelta( 1000 )
```

### af.volume()

Get or set the volume level as a percent (0 to 1 inclusive).  Values greater than 1 boost the volume.

```js
var vol = af.volume(); // current level

af.volume(0.5); // set level to 50%
```

### af.loop()

Get or set whether looping is enabled.  This is useful if you want to reconfigure an audiofile.

```js
var looping = af.loop();

af.loop( false ); // turn off looping
```
