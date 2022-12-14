/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from 'react'
import { DropzoneOptions, useDropzone } from 'react-dropzone'

import useCompressImage from 'hooks/useCompressImage'
import useShrinkVideo from 'hooks/useShrinkVideo'

export default function Home() {
  const [resultVideo, setResultVideo] = useState('')
  const [videoPreview, setVideoPreview] = useState('')
  const videoRef = useRef(null)

  const { shrinkVideo, cancel, isLoading, progress, getThumbnail } =
    useShrinkVideo()
  // const { compress, cancel, isLoading, progress } = useCompressImage()

  const onDrop: DropzoneOptions['onDrop'] = async (acceptedFiles) => {
    if (acceptedFiles[0]) {
      // const thumbnail = await compress(acceptedFiles[0])
      // if (thumbnail) {
      //   setVideoPreview(
      //     URL.createObjectURL(
      //       new Blob([thumbnail.buffer], { type: 'image/jpeg' })
      //     )
      //   )
      // }
      const thumbnail = await getThumbnail(acceptedFiles[0])
      if (thumbnail) {
        setVideoPreview(
          URL.createObjectURL(
            new Blob([thumbnail.buffer], { type: 'image/jpeg' })
          )
        )
      }
      const outputVideo = await shrinkVideo(acceptedFiles[0])
      if (outputVideo) {
        setResultVideo(
          URL.createObjectURL(
            new Blob([outputVideo.buffer], { type: 'video/mp4' })
          )
        )
      }
    }
  }
  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return (
    <div className='container'>
      <div className='my-3 p-5 border bg-light' {...getRootProps()}>
        <input {...getInputProps()} />
        <div>drag n drop or</div>
        <button className='btn btn-primary'>upload</button>
      </div>
      {isLoading && !!progress && progress > 0 && progress < 100 && (
        <button className='btn btn-danger' onClick={() => cancel()}>
          cancel
        </button>
      )}
      {isLoading && !!progress && (
        <div className='progress'>
          <div
            className='progress-bar progress-bar-striped progress-bar-animated'
            role='progressbar'
            aria-label='Basic example'
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >{`${Math.floor(progress)}%`}</div>
        </div>
      )}
      {!!resultVideo && (
        <video
          ref={videoRef}
          src={resultVideo}
          controls
          onLoad={() => URL.revokeObjectURL(resultVideo)}
          className='mt-3'
          style={{ maxWidth: '100%' }}
        />
      )}
      {!!videoPreview && (
        <img
          src={videoPreview}
          alt='thumbnail'
          onLoad={() => URL.revokeObjectURL(videoPreview)}
          style={{ maxWidth: '100%' }}
        />
      )}
    </div>
  )
}
