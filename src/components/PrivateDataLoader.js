import React, {useState} from 'react';
import {useDropzone} from 'react-dropzone';

import Image from 'react-bootstrap/Image'

export default function PrivateDataLoader({set}) {
  const [files, setFiles] = useState([]);
  const {
    acceptedFiles,
    fileRejections,
    getRootProps,
    getInputProps
  } = useDropzone({
    accept: 'image/png',
    maxFiles:1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      //set(acceptedFiles[0])
      setFiles(
        acceptedFiles.map((file) =>
            Object.assign(file, {
              preview: URL.createObjectURL(file)
            })
        )
      );
      set(acceptedFiles[0])
    },
  });

  const acceptedFileItems = acceptedFiles.map(file => {
    return(
      <li key={file.path}>
        {file.path} - {file.size} bytes
      </li>
    )
  });

  const fileRejectionItems = fileRejections.map(({ file, errors }) => (
    <li key={file.path}>
      {file.path} - {file.size} bytes
      <ul>
        {errors.map(e => (
          <li key={e.code}>{e.message}</li>
        ))}
      </ul>
    </li>
  ));

  return (
    <section className="container">
      <div {...getRootProps({ className: 'dropzone' })}>
        <input {...getInputProps()} />
        { files.length ?
          <Image src={files[0].preview} alt="" fluid  style={{height: "300px"}}/>
        :
          <>
            <p>
              Drag 'n' drop some files here
              <br/>
              or click to select files
            </p>
            <em>(Only *.png images will be accepted)</em>
          </>
        }

      </div>
      <aside>
        { files.length ?
        <ul><li key={files[0].path}>
        {files[0].path} - {files[0].size} bytes
      </li></ul>
      : null }
      </aside>
    </section>
  );

}