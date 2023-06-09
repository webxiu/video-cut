# 视频批量处理需求

1. 视频分割（可配置秒数），例：视频随机分割 17 秒；
2. 可放大缩小（x1.2）；
3. 加水印点赞订阅贴纸+mov 动效；
4. 加片尾；
5. 设置视频封面+文案；
6. 横竖屏转换（可配置比例 1080\*1920）
7. 视频格式选择 MP4 分辨率 1080\*1920HD
8. 音频（勾选导出音频）

## 操作步骤

进入 D:\workspace\ffmpeg 目录执行一下命令

`node .\index.js --inputPath=C:\Users\EDY\Desktop\input --outPath=C:\Users\EDY\Desktop\output --minLength=13 --maxLength=15 --minLimit=10`
`ffmpeg -i input.mp4 -ss 00:00:00 -t 10 -c:v copy -c:a copy part1.mp4 -i end.mp4 -filter_complex "[0:v]scale=iw:-1,setsar=1/1[v];[1:v]scale=1920:1080,setpts=PTS+10/TB[ovrl];[v][ovrl]overlay=(main_w-overlay_w)/2:main_h-overlay_h-50" -map "[out]" -pix_fmt yuv420p -c:a copy output.mp4`

## 添加封面

`ffmpeg -i input.mp4 -vf "select='eq(n,9)',drawtext=fontfile=/path/to/font.ttf:text='测试封面'" -vframes 1 output.jpg`

## 背景模糊

`ffmpeg -i input.mp4 -lavfi "[0:v]scale=256/81*iw:256/81*ih,boxblur=luma_radius=min(h\,w)/40:luma_power=3:chroma_radius=min(cw\,ch)/40:chroma_power=1[bg];[bg][0:v]overlay=(W-w)/2:(H-h)/2,setsar=1,crop=w=iw*81/256"  output.mp4`

const command = {
// 宽屏:水印 分割 裁剪 缩放
mian: ["-i", dir, "-vf", `movie=${logoPath}[water_mark];[input_mark][water_mark]overlay=x=(W-w)/2:y=(H-h)/2,scale=iw*1.2:ih*1.2,drawtext=fontcolor=white:fontsize=40:text='我是水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2,crop=1920:1080`, "-ss", `00:00:${startTime}`, "-to", `00:00:${endTime}`, "-acodec", "copy", "-y", outTempPath],
// 视频转 ts
concat_1: ["-i", outTempPath, "-c", "copy", "-vbsf", "h264_mp4toannexb", "-y", "temp/1.ts"],
concat_2: ["-i", endPath, "-c", "copy", "-vbsf", "h264_mp4toannexb", "-y", "temp/2.ts"],
// 合并视频 封面(第 10 帧作为)
concat: ["-i", `concat:temp/1.ts|temp/2.ts`, "-vf", "select='eq(n,9)',drawtext=fontcolor=white:fontsize=40:text='我是封面水印文字':x=400:y=400:fontsize=60:fontcolor=yellow:shadowy=2", "-vframes", "1", realImg, "-acodec", "copy", "-y", realPath],
};

- inputPath: 输入目录(读取该目录下的视频文件)
- outPath: 输出目录
- minLength: 随机截最小时间
- maxLength: 随机截最大时间
- minLimit: 低于限制时间， 视频丢弃
-

## 备注

`2023年05月04日`

- -vf" 不能和-filter_complex 混合一起
- -filter_complex,overlay=x=W-w:y=H-h"// W 视频宽, H 视频高, w:水印宽, h:水印高
- scale=iw*1.2:ih*1.2,crop=640:ih:0:0"
- crop=1080:1920
- scale=iw*1.2:ih*1.2,crop=1080:1920:0:0
-
-

```

```
