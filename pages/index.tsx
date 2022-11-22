import { createFFmpeg, fetchFile, FFmpeg } from "@ffmpeg/ffmpeg";
import { useEffect, useState } from "react";
import { DropzoneOptions, FileWithPath, useDropzone } from "react-dropzone";

const MAX_WIDTH = 480; // 480p

export default function Home() {
  const [resultVideo, setResultVideo] = useState("");
  const [ffMpeg, setFfMpeg] = useState<FFmpeg>();
  const [progress, setProgress] = useState<number>();

  const onDrop: DropzoneOptions["onDrop"] = async (
    acceptedFiles: FileWithPath[]
  ) => {
    if (acceptedFiles[0] && ffMpeg) {
      console.log(acceptedFiles[0].path);
      if (!ffMpeg.isLoaded()) {
        await ffMpeg.load();
      }
      ffMpeg.FS("writeFile", "input.mp4", await fetchFile(acceptedFiles[0]));
      ffMpeg.setProgress(({ ratio }) => {
        setProgress(Math.abs(ratio * 100));
      });
      await ffMpeg.run(
        "-i",
        "input.mp4",
        "-c:v",
        "libx264",
        "-vf",
        `scale='min(${MAX_WIDTH},iw)':'min(${MAX_WIDTH},ih)'`,
        // `scale=iw*${targetScale}:ih*${targetScale}`,
        "-c:a",
        "aac",
        "output.mp4"
      );
      const outputVideo = ffMpeg.FS("readFile", "output.mp4");
      if (outputVideo) {
        setResultVideo(
          URL.createObjectURL(
            new Blob([outputVideo.buffer], { type: "video/mp4" })
          )
        );
      }
    }
  };
  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  useEffect(() => {
    const init = () => {
      const initialFFmpeg = createFFmpeg({
        log: true,
        corePath: "http://localhost:3000/scripts/ffmpeg-core.js",
      });
      setFfMpeg(initialFFmpeg);
    };
    init();
  }, []);

  return (
    <div className="container">
      <div className="my-3 p-5 border bg-light" {...getRootProps()}>
        <input {...getInputProps()} />
        <div>drag n drop or</div>
        <button className="btn btn-primary">upload</button>
      </div>
      {ffMpeg &&
        ffMpeg.isLoaded() &&
        !!progress &&
        progress > 0 &&
        progress < 100 && (
          <button
            className="btn btn-danger"
            onClick={() => {
              ffMpeg.exit();
            }}
          >
            cancel
          </button>
        )}
      {!!progress && (
        <div className="progress">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            role="progressbar"
            aria-label="Basic example"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >{`${Math.floor(progress)}%`}</div>
        </div>
      )}
      {!!resultVideo && (
        <video
          src={resultVideo}
          controls
          onLoad={() => URL.revokeObjectURL(resultVideo)}
          className="mt-3"
          style={{ maxWidth: "100%" }}
        />
      )}
    </div>
  );
}
