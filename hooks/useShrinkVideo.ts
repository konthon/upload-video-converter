import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { useEffect, useState } from 'react'

import type { CreateFFmpegOptions, FFmpeg } from '@ffmpeg/ffmpeg'

const getFileNames = (file: File) => {
  const inputFileName = file.name
  const outputFileName = inputFileName.replace(/\.([^.]+)$/, '-output.$1')
  return { inputFileName, outputFileName }
}

const useShrinkVideo = (options?: CreateFFmpegOptions) => {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg>()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const shrinkVideo = async (videoInput: File, maxHeight: number = 720) => {
    const { inputFileName, outputFileName } = getFileNames(videoInput)
    if (ffmpeg) {
      setIsLoading(true)
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load()
      }
      ffmpeg.FS('writeFile', `"${inputFileName}"`, await fetchFile(videoInput))
      ffmpeg.setProgress(({ ratio }) => {
        setProgress(Math.abs(ratio * 100))
      })
      await ffmpeg.run(
        '-i',
        `"${inputFileName}"`,
        '-preset',
        'ultrafast',
        '-c:v',
        'libx264',
        '-crf', // 0-51 lossless-lossy (df: 23) https://superuser.com/a/677580
        '32',
        '-vf',
        `scale=-1:'min(${maxHeight},ih)'`,
        // '-b:v',
        // '64K',
        '-r',
        '24',
        // '-c:a',
        // 'aac',
        outputFileName
      )
      const outputVideo = ffmpeg.FS('readFile', outputFileName)
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

  // https://stackoverflow.com/a/44073745
  const getThumbnail = async (videoInput: File, maxHeight: number = 720) => {
    const { inputFileName } = getFileNames(videoInput)
    if (ffmpeg) {
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load()
      }
      ffmpeg.FS('writeFile', `"${inputFileName}"`, await fetchFile(videoInput))
      await ffmpeg.run(
        '-i',
        `"${inputFileName}"`,
        '-vf',
        'select=eq(n\\,0)',
        '-vf',
        `scale=-1:'min(${maxHeight},ih)'`,
        '-q:v',
        '5',
        'thumbnail.jpg'
      )
      const thumbnail = ffmpeg.FS('readFile', 'thumbnail.jpg')
      return thumbnail
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && !ffmpeg) {
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
        ffmpeg.exit()
      }
    }
  }, [])

  return {
    ffmpeg,
    shrinkVideo,
    cancel,
    getThumbnail,
    isLoading,
    progress,
  }
}

export default useShrinkVideo
