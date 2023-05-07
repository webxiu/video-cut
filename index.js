const path = require("path");
const fs = require("fs-extra");
const cp = require("child_process");
const utils = require("./utils");

// 获取路径
const { inputDir, outputDir, logoPath, endPath, audioPath, sticker, min, max, limit, split, scale } = utils.getParams();
const ffmpegPath = path.join(__dirname, "ffmpeg.exe");
const ffprobePath = path.join(__dirname, "ffprobe.exe");
const inputPaths = utils.getFilePath(inputDir);
const disTime = utils.randomRange(min, max); // 随机时间区间
fs.emptyDirSync(outputDir); // 清空输出目录
fs.emptyDirSync("./temp"); // 清空输出目录
const filters = inputPaths.filter((item) => item.indexOf("望远镜") > -1);
console.log("==输入==>:", inputPaths, "\n", filters);
console.log("==输出==>:", outputDir, "\n");

filters.forEach(async (dir, index) => {
  const ext = path.extname(dir);
  const fileName = path.basename(dir, ext);
  // 获取文件信息
  const fileInfo = await utils.getFileInfo(ffprobePath, dir);
  const { width, height, duration } = fileInfo["streams"][0];
  const { size } = fileInfo.format;
  console.log("fileInfo:", { width, height, duration, size, format: ext });
  let startTime = 0;
  let num = 0;

  while (startTime <= duration && limit) {
    ++num;
    let tEnd = startTime + disTime;
    let endTime = tEnd > duration ? duration : tEnd;
    if (endTime - startTime < limit) return;

    const tmepDir = "/temp";
    const scaleTempPath = path.join(__dirname, tmepDir, `scale_temp${ext}`);
    const rotateOutTemp = path.join(__dirname, tmepDir, `rotate_temp${ext}`);
    const stickerTempPath = path.join(__dirname, tmepDir, `sticker_temp${ext}`);
    const concatTempPath = path.join(__dirname, tmepDir, `concat_temp${ext}`);
    const audioTempPath = path.join(__dirname, tmepDir, `audio_temp${ext}`);
    const realImg = path.join(outputDir, `${fileName}_${num}_${utils.getNowTime()}.jpg`);
    const realPath = path.join(outputDir, `${fileName}_${num}_${utils.getNowTime()}${ext}`);

    const contMovie = `movie=${logoPath.path}[water_mark];[input_mark][water_mark]overlay=x=(W-w)/2:y=(H-h)/2`;
    const contText = `,drawtext=text='我是内容水印9':x=400:y=500:fontsize=60:fontcolor=yellow:shadowy=2`;

    const command = {
      // 水印 缩放
      scale: `-i ${dir} -vf ${contMovie}${contText} -ss 00:00:${startTime} -to 00:00:${endTime} -acodec copy -copyts -y ${scaleTempPath}`,
      // 缩放裁剪
      // scale: `-i ${dir} -filter_complex [0:v]scale=ceil(iw*1.2):ceil(ih*1.2),crop=1080:1920 -c:a copy -y ${scaleTempPath}`.split(' '),
      // 横屏转竖屏
      rotate: `-i ${scaleTempPath} -lavfi [0:v]scale=iw:2*trunc(iw*16/18),boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1,scale=1080:1920 -acodec copy -y ${rotateOutTemp}`,
      // 添加贴纸
      sticker: `-i ${rotateOutTemp} -i ${sticker.path} -filter_complex overlay=${sticker.x}:${sticker.y} -acodec copy -y ${stickerTempPath}`,
      // 视频转ts
      concat_1: `-i ${stickerTempPath} -c copy -vbsf h264_mp4toannexb -y temp/combine_1.ts`,
      concat_2: `-i ${endPath} -c copy -vbsf h264_mp4toannexb -y temp/combine_2.ts`,
      // 合并视频 生产封面(第6帧作为)
      concat: `-i concat:temp/combine_1.ts|temp/combine_2.ts -vf select='eq(n,5)',drawtext=text='我是封面水印':x=400:y=400:fontsize=60:fontcolor=blue:shadowy=2 -vframes 1 ${realImg} -acodec copy -y ${concatTempPath}`,
      // 视频原声中添加音频
      mergeAudio: `-i ${audioPath} -i ${concatTempPath} -filter_complex amix=inputs=2 -shortest -y ${audioTempPath}`,
      // 合并封面
      // concatCover: `-i concat:${realImg}|${concatTempPath} -acodec copy -y ${realPath}`,
      concatCover: `-i ${audioTempPath} -i ${realImg} -filter_complex "[1:v]scale=iw:-1[logo];[0:v][logo]overlay=W:H" -c:a copy ${realPath}`,
    };

    const res = await utils.spawn(ffmpegPath, command["scale"]);
    if (res.code === 0) {
      console.log(`缩放_第${index + 1}_${num}个成功 时长: ${disTime}`, res);
    } else {
      console.log(`缩放_第${index + 1}_${num}个失败 时长: ${disTime}`, res);
    }
    startTime += disTime;

    await utils.spawn(ffmpegPath, command["rotate"], 2000);
    await utils.spawn(ffmpegPath, command["sticker"], 2000);
    await utils.spawn(ffmpegPath, command["concat_1"], 2000);
    await utils.spawn(ffmpegPath, command["concat_2"], 2000);
    const res2 = await utils.spawn(ffmpegPath, command["concat"], 2000);
    // await utils.spawn(ffmpegPath, command["mergeAudio"], 2000);
    // await utils.spawn(ffmpegPath, command["concatCover"], 2000);
    if (res2.code === 0) {
      console.log(`合并_第${index + 1}_${num}个成功 时长: ${disTime}`, res2);
    } else {
      console.log(`合并_第${index + 1}_${num}个失败 时长: ${disTime}`, res2);
    }
  }
});
