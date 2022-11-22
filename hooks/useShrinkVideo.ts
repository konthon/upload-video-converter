import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { useEffect, useState } from 'react'

import type { CreateFFmpegOptions, FFmpeg } from '@ffmpeg/ffmpeg'

const useShrinkVideo = (options?: CreateFFmpegOptions) => {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg>()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const shrinkVideo = async (file: File, maxWidth: number = 480) => {
    if (ffmpeg) {
      setIsLoading(true)
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load()
      }
      ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file))
      ffmpeg.setProgress(({ ratio }) => {
        setProgress(Math.abs(ratio * 100))
      })
      await ffmpeg.run(
        '-i',
        'input.mp4',
        '-c:v',
        'libx264',
        '-vf',
        `scale='min(${maxWidth},iw)':-1`,
        '-c:a',
        'copy',
        'output.mp4'
      )
      const outputVideo = ffmpeg.FS('readFile', 'output.mp4')
      setIsLoading(false)
      setProgress(0)
      return outputVideo
    }
  }

  const cancel = () => {
    if (ffmpeg && ffmpeg.isLoaded()) {
      ffmpeg.exit()
      setIsLoading(false)
      setProgress(0)
    }
  }

  const getVideoPreview = (
    video: HTMLVideoElement,
    format: string = 'jpeg',
    quality: number = 0.8
  ) => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context2D = canvas.getContext('2d')
    if (context2D) {
      context2D.drawImage(video, 0, 0)

      const dataUri = canvas.toDataURL(`image/${format}`, quality)
      // const data = dataUri.split(',')[1]
      // const mimeType = dataUri.split(';')[0].slice(5)

      // const bytes = Buffer.from(data, 'base64').toString()
      // const arrBuffer = new ArrayBuffer(bytes.length)
      // let arr = new Uint8Array(arrBuffer)

      // for (let index = 0; index < bytes.length; index++) {
      //   arr[index] = bytes.charCodeAt(index)
      // }

      // return {
      //   blob: new Blob([arr], { type: mimeType }),
      //   dataUri,
      //   format,
      // }
      return {
        src: dataUri,
      }
    }
    // return {
    //   blob: null,
    //   dataUri: null,
    //   format,
    // }
    return { src: '' }
  }

  useEffect(() => {
    console.log('initialize ffmpeg')
    if (typeof window !== 'undefined') {
      const initializedFFmpeg = createFFmpeg({
        log: true,
        corePath: `${window.location.origin}/scripts/ffmpeg-core.js`,
        ...options,
      })
      setFfmpeg(initializedFFmpeg)
    }
    setIsLoading(false)
    return () => {
      if (ffmpeg && ffmpeg.isLoaded()) {
        console.log('exit ffmpeg')
        ffmpeg.exit()
      }
    }
  }, [])

  return {
    shrinkVideo,
    cancel,
    isLoading,
    progress,
    ffmpeg,
    getVideoPreview,
  }
}

export default useShrinkVideo
