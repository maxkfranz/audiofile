if( !Promise ){
  console.error('Audiofile could not find the `Promise` API; use a polyfil');
}

if( !fetch ){
  console.error('Audiofile could not find the `fetch` API; use a polyfil');
}

var Audiofile = function( opts ){
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

        reader.addEventListener('load', function( e ){
          resolve( reader.result );
        });

        reader.addEventListener('error', function( e ){
          reject( e );
        });

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
      audio.buffer = this;
      audio.loaded = true;

      return buffer;
    });
  }

  return audio;
};

Audiofile.prototype.play = function( time ){
  if( this.loaded && !this.playing ){
    time = time === undefined ? this.time : time;

    var source = this.source = this.context.createBufferSource();

    source.buffer = this.buffer;
    source.connect( this.context.destination );
    source.loop = !!this.options.loop;

    this.playing = true;
    this.time = time;
    this.date = this.systemDate();

    var timeInSeconds = time/1000;

    audio.source.start( 0, timeInSeconds );
  }
};

Audiofile.prototype.progress = function( time ){
  if( time === undefined ){ return this.time; }

  if( this.loaded ){
    this.time = time;

    if( this.playing ){
      this.pause();
      this.play();
    }
  }
};

Audiofile.prototype.pause = function(){
  if( this.loaded ){
    audio.source.stop(0);

    this.playing = false;
    this.time += this.systemDate() - this.date;
  }
};

Audiofile.prototype.stop = function(){
  if( this.loaded ){
    audio.source.stop(0);

    this.playing = false;
    this.time = 0;
  }
};

Audiofile.prototype.systemDate = function(){
  // use the higher accuracy performance.now() by default
  if( performance && performance.now ){
    return performance.now();
  } else {
    return Date.now();
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
