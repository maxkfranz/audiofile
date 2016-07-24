var Audiofile;

(function(){ // scope start

if( !Promise ){
  console.error('Audiofile could not find the `Promise` API; use a polyfil');
}

if( !fetch ){
  console.error('Audiofile could not find the `fetch` API; use a polyfil');
}

var context;
try {
  var AudioContextImpl = window.AudioContext || window.webkitAudioContext;
  context = new AudioContextImpl();
} catch( e ){
  console.error('Audiofile could not find the Web Audio APIs; your browser is not supported');
}

Audiofile = function( opts ){
  if( !( this instanceof Audiofile ) ){
    return new Audiofile( opts );
  }

  this.options = { // defaults
    preload: true
  };

  for( var i in opts ){ this.options[i] = opts[i] }

  this.context = context;

  this.loaded = false;
  this.time = 0;
  this.level = 1;

  if( this.options.preload ){
    this.load();
  }
};

// play a small silent wav file in an <audio> tag to kill the background music
Audiofile.killUserAudio = function(){
  var silenceSrc = 'data:audio/wav;base64,UklGRnwAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgAAAABAP7/AgD//wAAAgD9/wMA/v8BAAAA//8CAP3/AwD+/wEAAAD//wEA//8BAP//AgD+/wEA//8CAP7/AgD+/wEAAQD//wAAAQD+/wMA/f8DAP3/AwD9/wIA';
  var audio = document.createElement('audio');
  var source = document.createElement('source');

  source.src = silenceSrc;
  audio.appendChild( source );
  audio.play();
};

Audiofile.resetUserAudio = Audiofile.killUserAudio;

var afpt = Audiofile.prototype;

afpt.load = function(){
  var audio = this;
  var opts = this.options;

  if( audio.loadingPromise ){
    return audio.loadingPromise;
  } else {
    var load = opts.load || function(){
      return fetch( opts.url, opts.fetch ).then(function( resp ){
        return resp.blob();
      });
    };

    return audio.loadingPromise = load().then(function( blob ){
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

afpt.clone = function(){
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
  if( window.performance && performance.now ){
    return performance.now();
  } else {
    return Date.now();
  }
};

afpt.play = function( time ){
  var audio = this;

  if( this.loaded && !this.playing ){
    time = time === undefined ? this.time : time;

    var cxt = this.context;
    var source = this.source = cxt.createBufferSource();
    var gainNode =  source.gainNode = cxt.createGain();

    gainNode.gain.value = this.level;

    source.buffer = this.buffer;
    source.connect( gainNode );
    gainNode.connect( this.options.output || cxt.destination );

    source.onended = (function(){
      if( source._killedAF ){
        return; // ignore the event if we caused it
      }

      if( this.options.loop ){ // play again
        this.stop().play();
      } else if( this.playing ){ // stop to allow replay support
        this.stop();
      }
    }).bind( this );

    this.playing = true;
    this.time = time;
    this.date = systemDate();

    var timeInSeconds = time / 1000;

    source.start( this.context.currentTime, timeInSeconds );
  }

  return this;
};

afpt.stop = function( time ){
  if( this.loaded ){
    this.time = time === undefined ? 0 : time;
    this.playing = false;

    var src = this.source;
    if( src ){
      src._killedAF = true;
      src.stop( this.context.currentTime );
    }
  }

  return this;
};

afpt.pause = function(){
  return this.stop( this.time + systemDate() - this.date );
};

afpt.progress = function( time ){
  if( time === undefined ){ return this.time; }

  time = Math.max( 0, time ); // or context throws err

  if( this.loaded ){
    if( this.playing ){
      this.pause();
      this.play( time );
    } else {
      this.time = time;
    }
  }

  return this;
};

afpt.progressDelta = function( deltaTime ){
  var time;

  if( this.loaded ){
    var playing = this.playing;

    if( playing ){ this.pause(); }

    this.progress( this.time + deltaTime );

    if( playing ){ this.play(); }
  }

  return this;
};

afpt.rewind = function( deltaTime ){
  if( deltaTime === undefined ){
    this.progress( 0 );
  } else {
    this.progressDelta( -deltaTime );
  }

  return this;
};

afpt.fastforward = function( deltaTime ){
  if( deltaTime === undefined ){
    this.progress( Number.MAX_VALUE );
  } else {
    this.progressDelta( +deltaTime );
  }

  return this;
};

afpt.volume = function( level ){
  if( level !== undefined ){
    this.level = level;

    if( this.playing ){
      this.pause().play();
    }
  } else {
    return this.level;
  }

  return this;
};

afpt.loop = function( bool ){
  if( bool !== undefined ){
    this.options.loop = bool;
  } else {
    return this.options.loop;
  }
};

if( typeof module !== 'undefined' ){
  module.exports = Audiofile;
}

})(); // scope end
