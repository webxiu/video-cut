const path = require("path");
const fs = require("fs-extra");
const cp = require("child_process");
const utils = require("./utils");

// 获取路径
const { inputDir, outputDir, logoPath, endPath, sticker, min, max, limit, split, scale } = utils.getParams();
const ffmpegPath = path.join(__dirname, "ffmpeg.exe");
const ffprobePath = path.join(__dirname, "ffprobe.exe");
const inputPaths = utils.getFilePath(inputDir);
const disTime = utils.randomRange(min, max); // 随机时间区间
fs.emptyDirSync(outputDir); // 清空输出目录
fs.emptyDirSync("./temp"); // 清空输出目录
const filters = inputPaths.filter((item) => item.indexOf("车内_横屏") > -1);
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

  while (startTime < duration && limit) {
    ++num;
    let tEnd = startTime + disTime;
    let endTime = tEnd > duration ? duration : tEnd;
    if (endTime - startTime < limit) return;

    const tmepDir = "/temp";
    const scaleTempPath = path.join(__dirname, tmepDir, `scale_temp${ext}`);
    const stickerTempPath = path.join(__dirname, tmepDir, `加贴纸_1.mp4`);
    const rotateOutTemp = path.join(__dirname, tmepDir, "rotate_temp.mp4");
    const realImg = path.join(outputDir, `${fileName}_${num}_${utils.getNowTime()}.jpg`);
    const realPath = path.join(outputDir, `${fileName}_${num}_${utils.getNowTime()}${ext}`);

    const command = {
      // 水印 裁剪 缩放
      mian: ["-i", dir, "-vf", `movie=${logoPath.path}[water_mark];[input_mark][water_mark]overlay=x=(W-w)/2:y=(H-h)/2,scale=ceil(iw*1.2):ceil(ih*1.2),drawtext=text='我是内容水印':x=400:y=500:fontsize=60:fontcolor=yellow:shadowy=2`, "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-acodec", "copy", "-y", scaleTempPath],
      // 缩放裁剪
      // main: `-i ${dir} -filter_complex [0:v]scale=ceil(iw*1.2):ceil(ih*1.2),crop=1080:1920 -c:a copy -y ${scaleTempPath}`.split(' '),

      rotate: ["-i", scaleTempPath, "-lavfi", "[0:v]scale=iw:2*trunc(iw*16/18),boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1,scale=1080:1920", "-y", rotateOutTemp],
      sticker: ["-i", rotateOutTemp, "-i", sticker.path, "-filter_complex", `overlay=${sticker.x}:${sticker.y}`, "-y", stickerTempPath],
      // 视频转ts
      concat_1: ["-i", stickerTempPath, "-c", "copy", "-vbsf", "h264_mp4toannexb", "-y", "temp/combine_1.ts"],
      concat_2: ["-i", endPath, "-c", "copy", "-vbsf", "h264_mp4toannexb", "-y", "temp/combine_2.ts"],
      // 合并视频 封面(第10帧作为)
      concat: ["-i", `concat:temp/combine_1.ts|temp/combine_2.ts`, "-vf", "select='eq(n,9)',drawtext=text='我是封面水印':x=400:y=400:fontsize=60:fontcolor=blue:shadowy=2", "-vframes", "1", realImg, "-acodec", "copy", "-y", realPath],

      // =======================横屏转竖屏1080*1920============================
      // 不裁剪  差  快 --- ok
      // h_v: 'ffmpeg -i input2.mp4 -lavfi "[0:v]scale=iw:2*trunc(iw*16/18),boxblur=luma_radius=min(h\,w)/20:luma_power=1:chroma_radius=min(cw\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1" -y 不裁剪.mp4',
      // 裁剪  好 慢 --- 会缩小
      // h_v: 'ffmpeg -i input2.mp4 -lavfi "[0:v]scale=256/81*iw:256/81*ih,boxblur=luma_radius=min(h\,w)/40:luma_power=3:chroma_radius=min(cw\,ch)/40:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1,crop=w=iw*81/256" -y 裁剪.mp4',
      h_v: ["-i", "input_v.mp4", "-lavfi", "[0:v]scale=iw:2*trunc(iw*16/18),boxblur=luma_radius=min(h\\,w)/20:luma_power=1:chroma_radius=min(cw\\,ch)/20:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1,scale=1080:1920", "-y", "output.mp4"],
      // =======================添加mov贴纸============================
      sticker2: "ffmpeg -i shu_22.mp4 -i 贴纸1.mov -filter_complex overlay=0:0 -y 合并后.mp4",

      // ======================合并============================
      all: ["-i", dir, "-vf", `movie=${logoPath}[water_mark];[input_mark][water_mark]overlay=x=(W-w)/2:y=(H-h)/2,scale=iw*1.2:ih*1.2,drawtext=text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2,crop=1920:1080`, "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-acodec", "copy", "-y", scaleTempPath],
    };

    const res = await utils.spawn(ffmpegPath, command["mian"]);
    if (res.code === 0) {
      console.log(`转换_第${index + 1}_${num}个成功 时长: ${disTime}`, res);
    } else {
      console.log(`转换_第${index + 1}_${num}个失败 时长: ${disTime}`, res);
    }
    startTime += disTime;

    await utils.spawn(ffmpegPath, command["rotate"]);
    await utils.spawn(ffmpegPath, command["sticker"]);
    // await utils.spawn(ffmpegPath, command["concat_1"], 2000);
    // await utils.spawn(ffmpegPath, command["concat_2"]);
    // const res2 = await utils.spawn(ffmpegPath, command["concat"]);
    // if (res2.code === 0) {
    //   console.log(`合并_第${index + 1}_${num}个成功 时长: ${disTime}`, res2);
    // } else {
    //   console.log(`合并_第${index + 1}_${num}个失败 时长: ${disTime}`, res2);
    // }
  }
});
