import React, { Fragment, useState,useRef} from 'react';
import Message from './Message';
import Progress from './Progress';
import axios,{ CancelToken, isCancel } from 'axios';

const FileUpload = () => {
  let [file, setFile] = useState('');
  let [filename, setFilename] = useState('Choose File');
  let [uploadedFile, setUploadedFile] = useState({});
  let [message, setMessage] = useState('');
  let [uploadPercentage, setUploadPercentage] = useState(0);
  const cancelFileUpload = useRef(null);

  const onChange = e => {
    setFile(e.target.files[0]);
    setFilename(e.target.files[0].name);
  };

  const onSubmit = async e => {
    e.preventDefault();
    setMessage('');

    try {
      let fileId = `${filename}-${file.lastModified}`;
      const res = await axios.get('/status', {
        headers: {
          'Content-Type': 'multipart/form-data',
          "size": file.size.toString(),
          "x-file-id": fileId,
          'name': filename
        },
      
      });
     
      console.log("response of server"+JSON.stringify(res));
      console.log("res.status "+res.data.status )
      if(res.data.status === 'file is present'){
        alert(res.data.status);
        return;
      }

      let uploadedBytes = res.data.uploaded;
      if(res.data.uploaded==null)
      {
        uploadedBytes =0;
      }
      console.log("uploaded bytes is"+uploadedBytes)
      console.log("uploaded bytes"+uploadedBytes)
      console.log("file size"+ file.size)
      console.log("upload slice"+file.slice(uploadedBytes, file.size +1 ))
      console.log("upload slice length"+file.slice(uploadedBytes, file.size +1 ).size.toString())
     
       const res2 = await axios.post('/upload',file.slice(uploadedBytes, file.size +1 ) , {
        headers: {
         // 'Content-Type': 'multipart/form-data',
         'Content-Type': undefined,
         'Accept': 'application/json, text/plain, */*',
         
          "size": file.size.toString(),
          "x-file-id": fileId,
          'name': filename,
          "x-start-byte": uploadedBytes.toString()

        },
       onUploadProgress: progressEvent => {

        const {loaded, total} = progressEvent;
        let percent = Math.floor( (loaded * 100) / total )
        console.log( `${loaded}kb of ${total}kb | ${percent}%` );


          if( uploadedBytes === 0)
          {
            console.log("entered in if  uploaded bytes =0")
          setUploadPercentage(
            parseInt(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            )
          );
            }
            else{
              let extraBytes=uploadedBytes+loaded
              console.log("entered in else  uploaded bytes =0")
              setUploadPercentage(
                parseInt(
                  Math.round((extraBytes * 100) / file.size)
                )
              );

            }
          console.log(" uploadPercentage"+uploadPercentage);
          if(uploadPercentage >= 100){
            filename= "";
            file = null;
          }

         },

        cancelToken: new CancelToken(
          cancel => (cancelFileUpload.current = cancel)
      )
      });
     console.log("request2"+res2)
      console.log("res 2 in strigify form"+JSON.stringify(res2))

     const { fileName, filePath } = res2.data;

      setUploadedFile({ fileName, filePath });

      setMessage('File Uploaded');
      console.log("uploaded percentage after response"+uploadPercentage)

     // setUploadPercentage(0)
     setTimeout(() => {
     
      setUploadPercentage(
        parseInt(
          0
        )
      );
    }, 1000);

     // setUploadPercentage(0)
    
    } catch (err) {
      console.log(err)
     /* if (err.response.status === 500) {
        setMessage('There was a problem with the server');
      } else {
        setMessage(err.response.data.msg);
      }*/

      if (isCancel(err)) {
        alert(err.message);
    }
    }
  };
  const cancelUpload = () => {
    if (cancelFileUpload.current)
        cancelFileUpload.current("User has canceled the file upload.");
};


  return (
    <Fragment>
      {message ? <Message msg={message} /> : null}
      <form onSubmit={onSubmit}>
        <div className='custom-file mb-4'>
          <input
            type='file'
            className='custom-file-input'
            accept=" video/*" 
            id='customFile'
            onChange={onChange}
          />
          <label className='custom-file-label' htmlFor='customFile'>
            {filename}
          </label>
        </div>

        <Progress percentage={uploadPercentage} />

        <input
          type='submit'
          value='Upload - Resume'
          className='btn btn-primary btn-block mt-4'
        />
         <div className="col-auto">
                              <input
                                  type='button'
                                   value='Pause'
                                    className='btn btn-primary btn-block mt-4'
                                
                                    onClick={() => cancelUpload()}
                                >
                                    
                                </input>
          </div>
      </form>
      {uploadedFile ? (
        <div className='row mt-5'>
          <div className='col-md-6 m-auto'>
            <h3 className='text-center'>{uploadedFile.fileName}</h3>
            <img style={{ width: '100%' }} src={uploadedFile.filePath} alt='' />
          </div>
        </div>
      ) : null}
    </Fragment>
  );
};

export default FileUpload;
