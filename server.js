const express = require('express');
const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors({origin: '*'}));
app.use(bodyParser.urlencoded({ extended: true }));


// Upload Endpoint
let uploads = {};
app.post('/upload', (req, res,next) => {

  let fileId = req.headers['x-file-id'];
  let startByte = parseInt(req.headers['x-start-byte'], 10);
  let name = req.headers['name'];
  let fileSize = parseInt(req.headers['size'], 10);
  
  if(uploads[fileId] && fileSize == uploads[fileId].bytesReceived){
    res.end();
    return;
  }

  if (!fileId) {
      res.writeHead(400, "No file id");
      res.end(400);
  }
 
  if (!uploads[fileId]) 
      uploads[fileId] = {};

  let upload = uploads[fileId];
  let fileStream;

  if(!startByte){
      
      upload.bytesReceived = 0;
      let name = req.headers['name'];
      fileStream = fs.createWriteStream(`./name/${name}`, {
        flags: 'w'
      });
  }else{
      if (upload.bytesReceived != startByte) {
          res.writeHead(400, "Wrong start byte");
          res.end(upload.bytesReceived);
          return;
        }
        // append to existing file
        fileStream = fs.createWriteStream(`./name/${name}`, {
          flags: 'a'
        });
  }
 
  let uploadBytesReceived=upload.bytesReceived
  var number=upload.bytesReceived;
  // req.unpipe(fileStream);
 req.on('data', function(data,uploadBytesReceived) {
     
    console.log("data length is"+data.length);
     number+=data.length;
    console.log("number is"+number)
     
    }); 
    
    upload.bytesReceived=upload.bytesReceived+number
    req.pipe(fileStream);

    // when the request is finished, and all its data is written
    fileStream.on('close', function() {
      console.log("number is"+number)
      upload.bytesReceived=number
      console.log(upload.bytesReceived, fileSize);
      console.log("file size is"+fileSize)
      console.log("number is"+number)
      if (upload.bytesReceived == fileSize) {
        console.log("Upload finished");
        delete uploads[fileId];

        console.log("upload object when upload is completed"+JSON.stringify(uploads))
  
        // can do something else with the uploaded file here
        res.send({'status': 'uploaded'});
        res.end();
      } else {
        // connection lost, we leave the unfinished file around
        console.log("File unfinished, stopped at " + upload.bytesReceived);
        res.writeHead(500, "Server Error");
        res.end();
      }
    });
  
    // in case of I/O error - finish the request
    fileStream.on('error', function(err) {
      console.log("fileStream error", err);
      res.writeHead(500, "File error");
      res.end();
    });
  
});

app.get('/status', (req, res) =>{
  //console.log('came');
  console.log("entered in status block");
  let fileId = req.headers['x-file-id'];
  let name = req.headers['name'];
  let fileSize = parseInt(req.headers['size'], 10);
  console.log(name);
  console.log ("uploads[fileId] in satus part "+uploads[fileId]);
  if(name){
    try{
      let stats = fs.statSync('name/' +  name);
      if(stats.isFile())
      {
        console.log(`fileSize is ${fileSize} and already uploaded file size ${stats.size}`);
        if(fileSize == (stats.size)){
          console.log("inside if condition to check whether it is returning or not")
          res.send({'status': 'file is present', "uploaded" : (stats.size)})
          return;
        }

        console.log ("uploads[fileId] in status part"+uploads[fileId]);
        if(!uploads[fileId])
          uploads[fileId] = {}
        console.log ("uploads[fileId]"+uploads[fileId]);
        uploads[fileId]['bytesReceived'] = stats.size;
        console.log("upload object"+uploads);
        console.log("upload object"+JSON.stringify(uploads));

        console.log(uploads[fileId], stats.size);
      }
    }catch(er){

    }
    
  }
  let upload = uploads[fileId];
  if(upload)
      res.send({"uploaded" : upload.bytesReceived});
  else
      res.send({"uploaded" : 0});
  
});

app.listen(5005, () => console.log('Server Started...'));

