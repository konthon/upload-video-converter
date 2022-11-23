import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg'
import { useEffect, useState } from 'react'

import type { CreateFFmpegOptions, FFmpeg } from '@ffmpeg/ffmpeg'

const useCompressImage = (options?: CreateFFmpegOptions) => {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg>()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  // https://stackoverflow.com/a/44073745
  const compress = async (file: File, maxHeight: number = 720) => {
    const inputFileName = file.name
    if (ffmpeg) {
      setIsLoading(true)
      if (!ffmpeg.isLoaded()) {
        await ffmpeg.load()
      }
      ffmpeg.FS('writeFile', `"${inputFileName}"`, await fetchFile(file))
      ffmpeg.setProgress(({ ratio }) => {
        setProgress(Math.abs(ratio * 100))
      })
      await ffmpeg.run(
        '-i',
        `"${inputFileName}"`,
        '-vf',
        'select=eq(n\\,0)',
        '-vf',
        `scale=-1:'min(${maxHeight},ih)'`,
        '-q:v',
        '5',
        'output.jpg'
      )
      const output = ffmpeg.FS('readFile', 'output.jpg')
      setIsLoading(false)
      return output
    }
  }

  const cancel = () => {
    if (ffmpeg && ffmpeg.isLoaded()) {
      ffmpeg.exit()
      setIsLoading(false)
      setProgress(0)
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
    compress,
    cancel,
    isLoading,
    progress,
    ffmpeg,
  }
}

export default useCompressImage
