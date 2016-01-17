var Audiofile;

(function(){ // scope start

if( !Promise ){
  console.error('Audiofile could not find the `Promise` API; use a polyfil');
}

if( !fetch ){
  console.error('Audiofile could not find the `fetch` API; use a polyfil');
}

Audiofile = function( opts ){
  if( !( this instanceof Audiofile ) ){
    return new Audiofile( opts );
  }

  this.options = { // defaults
    preload: true
  };

  for( var i in opts ){ this.options[i] = opts[i] }

  try {
    this.context = new AudioContext();
  } catch( e ){
    console.error('Audiofile could not find the Web Audio APIs; your browser is not supported');
  }

  this.loaded = false;
  this.time = 0;

  if( this.options.preload ){
    this.load();
  }
};

Audiofile.prototype.load = function(){
  var audio = this;
  var opts = this.options;

  if( audio.loadingPromise ){
    return audio.loadingPromise;
  } else {
    return audio.loadingPromise = fetch( opts.url, opts.fetch ).then(function( resp ){
      return resp.blob();
    }).then(function( blob ){
      return new Promise(function( resolve, reject ){
        var reader = new FileReader();

        reader.onload = function( e ){
          resolve( reader.result );
        };

        reader.onerror = function( e ){
          reject( e );
        };

        reader.readAsArrayBuffer( blob );
      });
    }).then(function( arrayBuffer ){
      // some browsers don't support the direct promise syntax yet
      return new Promise(function( resolve, reject ){
        audio.context.decodeAudioData( arrayBuffer, resolve, reject );
      });
    }).then(function( buffer ){
      return audio.buffer = buffer;
    }).then(function( buffer ){
      audio.loaded = true;

      return buffer;
    });
  }
};

Audiofile.clone = function(){
  var opts = {};
  for( var i in this.options ){ opts[i] = this.options[i] }
  opts.preload = false;

  var audio = new Audiofile( opts );

  // if the calling audio file is loaded or in progress, then grab its cache
  // (avoids having to load twice)
  if( this.loadingPromise ){
    audio.loadingPromise = this.loadingPromise.then(function( buffer ){
      audio.buffer = buffer;
      audio.loaded = true;

      return buffer;
    });
  }

  return audio;
};

var systemDate = function(){
  // use the higher accuracy performance.now() by default
  if( performance && performance.now ){
    return performance.now();
  } else {
    return Date.now();
  }
};

Audiofile.prototype.play = function( time ){
  var audio = this;

  if( this.loaded && !this.playing ){
    time = time === undefined ? this.time : time;

    var source = this.source = this.context.createBufferSource();

    source.buffer = this.buffer;
    source.connect( this.context.destination );

    source.onended = (function(){
      if( this.playing && !source._killedAF ){
        this.stop();
      }
    }).bind( this );

    this.playing = true;
    this.time = time;
    this.date = systemDate();

    var timeInSeconds = time / 1000;

    source.start( this.context.currentTime, timeInSeconds );
  }
};

Audiofile.prototype.stop = function( goToTime ){
  if( this.loaded ){
    this.time = goToTime === undefined ? 0 : goToTime;
    this.playing = false;

    var src = this.source;
    if( src ){
      src._killedAF = true;
      src.stop();
    }
  }
};

Audiofile.prototype.pause = function( got ){
  this.stop( this.time + systemDate() - this.date );
};

Audiofile.prototype.progress = function( time ){
  if( time === undefined ){ return this.time; }

  time = Math.max( 0, time ); // or context throws err

  if( this.loaded ){
    if( this.playing ){
      this.stop();
      this.play( time );
    } else {
      this.time = time;
    }
  }
};

Audiofile.prototype.rewind = function( deltaTime ){
  if( deltaTime === undefined ){
    this.progress( 0 );
  } else {
    this.progress( this.time - deltaTime );
  }
};

Audiofile.prototype.fastforward = function( deltaTime ){
  if( deltaTime === undefined ){
    this.progress( Number.MAX_VALUE );
  } else {
    this.progress( this.time + deltaTime );
  }
};

if( typeof module !== 'undefined' ){
  module.exports = Audiofile;
}

})(); // scope end
