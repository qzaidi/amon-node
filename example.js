var Amon = require('./lib/amon');

var amon = new Amon({ 
                           'host'    : 'localhost',
                           'port': 5464, 
                           'app_key' : 'rfDDiy8sDJWhynxQXV2DXzel2W3KR6P6pFsF5NdOKNI' }
                   );

amon.on('error', function(error,data) {
  // alternative logger
  console.log(data);
});

var image_dictionary={
  "Image": {
	"Width":800,
	"Height":600,
	"Title":"View from 15th Floor",
	"Url": "http://static.amon.cx/3490fdd.png",
	"Thumbnail":
	{
	  "Url":"http://static.amon.cx/1232323.png",
	  "Height": 125,
	  "Width": 100
	}
  }
};

amon.log(image_dictionary, ['Martin','images', 'debug']);

amon.log('zeromq node js log message', 'Martin');

//amon.log('log message', ['Martin', 'user_data', 'debug'])
//amon.log('log message', ['John', 'benchmark'])

process.addListener('uncaughtException', function(err) {
	amon.handle(err);
});

try {
  throw new Error("Test Error 1");
} catch(error) {
  console.log("Error occurred ", error.message);
  amon.handle(error);
}

throw new Error("Test Error 2");
