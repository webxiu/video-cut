const path = require("path");
const fs = require("fs-extra");
const minimist = require("minimist");
const { getVideoDurationInSeconds } = require("get-video-duration");

const utils = require("./utils");
const ffmpegPath = path.join(__dirname, "ffmpeg.exe");
const args = require("minimist")(process.argv.slice(2));
const inputDir = args["inputPath"] || "C:\\Users\\EDY\\Desktop\\input"; // 输入路径
const outRoot = args["outPath"] || `C:\\Users\\EDY\\Desktop\\output`; // 输出路径
const min = args["minLength"] || 13;
const max = args["maxLength"] || 15;
const limit = args["minLimit"] || 10;
// const logoPath = "C:\\Users\\EDY\\Desktop\\image\\baidu_logo.png";
const logoPath = "./baidu_logo.png";

const inputPaths = utils.getFilePath(inputDir);
const disTime = utils.randomRange(min, max); // 随机时间区间
const endPaths = "C:\\Users\\EDY\\Desktop\\end\\end.mp4"; // 片尾视频
fs.emptyDirSync(outRoot); // 情况输出目录

console.log("==输入==>:", inputPaths);
console.log("==输出==>:", outRoot, "\n");

inputPaths.forEach(async (dir, index) => {
  const ext = path.extname(dir);
  const fileName = path.basename(dir, ext);

  // 获取文件总时长
  const duration = await getVideoDurationInSeconds(dir);
  let startTime = 0;
  let pos = 0;
  while (startTime < duration && limit) {
    ++pos;
    let tEnd = startTime + disTime;
    let endTime = tEnd > duration ? duration : tEnd;
    if (endTime - startTime < limit) return;
    const outPath = path.join(outRoot, `${fileName}_${pos}_${utils.getNowTime()}_${ext}`);
    // 测试命令
    const cc = {
      // 水印 分割 裁剪 缩放
      111: ["-i", dir, "-vf", `movie=${logoPath}[water_mark];[input_mark][water_mark]overlay=300:200,scale=iw*1.2:ih*1.2,drawtext=fontcolor=white:fontsize=40:text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2,crop=1920:1080`, "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-acodec", "copy", "-y", outPath],
      // 封面
      fengmian: ["-i", "input.mp4", "-vf", "select='eq(n,9)',drawtext=fontcolor=white:fontsize=40:text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2", "-vframes", "1", "output_%d.jpg"],
      222: ["-i", dir, "-vf", `movie=${logoPath}[water_mark];[input_mark][water_mark]overlay=300:200,scale=iw*1.2:ih*1.2,drawtext=fontcolor=white:fontsize=40:text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2,crop=1920:1080`, "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-i", endPaths, "-map", "[out]", "-acodec", "copy", "-y", outPath],
      test: ["-i", "input.mp4", "-ss", "00:00:00", "-t", "10", "-c:v", "copy", "-c:a", "copy", "part1.mp4", "-i", "end.mp4", "-filter_complex", "[0:v]scale=iw:-1,setsar=1/1[v];[1:v]scale=1920:1080,setpts=PTS+10/TB[ovrl];[v][ovrl]overlay=(main_w-overlay_w)/2:main_h-overlay_h-50", "-map", "[out]", "-pix_fmt", "yuv420p", "-c:a", "copy", "output.mp4"],
      concat: ["-i", `concat:${dir}|${endPaths}`, "-acodec", "copy", "-y", outPath],
      textLogo: ["-i", dir, "-vf", "movie=logo.png[water_mark];[input_mark][water_mark]overlay=300:200,drawtext=fontcolor=white:fontsize=40:text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2,scale=iw*2:-2,crop=960:820:0:0,", "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-acodec", "copy", "-y", outPath],
    };
    const command = cc["111"];
    console.log(command);

    const res = await utils.spawn(ffmpegPath, command);
    if (res.code === 0) {
      console.log(`第${index + 1}_${pos}个成功`, res);
    } else {
      console.log(`第${index + 1}_${pos}个失败`, res);
    }
    startTime += disTime;
    const cc2 = {
      concat: ["-i", `concat:${dir}|${endPaths}`, "-acodec", "copy", "-y", outPath],
    };
    const res2 = await utils.spawn(ffmpegPath, command);
  }
});
