const path = require("path");
const fs = require("fs-extra");
const { getVideoDurationInSeconds } = require("get-video-duration");
const utils = require("./utils");

// 获取路径
const { inputDir, outputDir, logoPath, endPath, min, max, limit } = utils.getParams();
const ffmpegPath = path.join(__dirname, "ffmpeg.exe");
const inputPaths = utils.getFilePath(inputDir);
const disTime = utils.randomRange(min, max); // 随机时间区间
fs.emptyDirSync(outputDir); // 清空输出目录
fs.emptyDirSync("./temp"); // 清空输出目录

console.log("==输入==>:", inputPaths);
console.log("==输出==>:", outputDir, "\n");

inputPaths.forEach(async (dir, index) => {
  const ext = path.extname(dir);
  const fileName = path.basename(dir, ext);
  // 获取文件总时长
  const duration = await getVideoDurationInSeconds(dir);
  let startTime = 0;
  let num = 0;

  while (startTime < duration && limit) {
    ++num;
    let tEnd = startTime + disTime;
    let endTime = tEnd > duration ? duration : tEnd;
    if (endTime - startTime < limit) return;
    const outTempPath = path.join("./temp", `${fileName}_${num}_${utils.getNowTime()}${ext}`);
    const realPath = path.join(outputDir, `${fileName}_${num}_${utils.getNowTime()}${ext}`);
    const realImg = path.join(outputDir, `${fileName}_${num}_${utils.getNowTime()}.jpg`);

    const command = {
      // 水印 分割 裁剪 缩放
      mian: ["-i", dir, "-vf", `movie=${logoPath}[water_mark];[input_mark][water_mark]overlay=300:200,scale=iw*1.2:ih*1.2,drawtext=fontcolor=white:fontsize=40:text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2,crop=1920:1080`, "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-acodec", "copy", "-y", outTempPath],
      // 视频转ts
      concat_1: ["-i", outTempPath, "-c", "copy", "-vbsf", "h264_mp4toannexb", "-y", "temp/1.ts"],
      concat_2: ["-i", endPath, "-c", "copy", "-vbsf", "h264_mp4toannexb", "-y", "temp/2.ts"],
      // 合并视频 封面(第10帧作为)
      concat: ["-i", `concat:temp/1.ts|temp/2.ts`, "-vf", "select='eq(n,9)',drawtext=fontcolor=white:fontsize=40:text='我是封面水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2", "-vframes", "1", realImg, "-acodec", "copy", "-y", realPath],
    };

    const res = await utils.spawn(ffmpegPath, command["mian"]);
    if (res.code === 0) {
      console.log(`转换_第${index + 1}_${num}个成功 时长: ${disTime}`, res);
    } else {
      console.log(`转换_第${index + 1}_${num}个失败 时长: ${disTime}`, res);
    }
    startTime += disTime;

    await utils.spawn(ffmpegPath, command["concat_1"]);
    await utils.spawn(ffmpegPath, command["concat_2"]);
    const res2 = await utils.spawn(ffmpegPath, command["concat"]);
    if (res2.code === 0) {
      console.log(`合并_第${index + 1}_${num}个成功 时长: ${disTime}`, res2);
    } else {
      console.log(`合并_第${index + 1}_${num}个失败 时长: ${disTime}`, res2);
    }
  }
});
