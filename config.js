module.exports = {
  // 输入目录
  inputPath: "C:\\Users\\ghtee\\Desktop\\input",
  // 输出目录
  outputDir: "C:\\Users\\ghtee\\Desktop\\output",
  // 片尾文件路径
  endPath: "G:\\workspace\\youjia\\贴纸和片尾\\片尾.mp4",
  // 添加音频
  audioPath: "C:\\Users\\ghtee\\Desktop\\input\\audio.mp3",
  // 水印logo
  logoPath: { path: "./baidu_logo.png", x: 0, y: 0 },
  // 封面标题
  coverTitle: {
    text: "测试封面",
    fontcolor: "white",
    fontsize: 40,
    shadowy: 22,
    x: 0,
    y: 0,
  },
  // mov贴纸路径
  sticker: {
    path: "G:\\workspace\\youjia\\贴纸和片尾\\贴纸1.mov",
    x: 0,
    y: 0,
  },
  // 视频最小长度
  minLength: 13, //13
  // 视频最大长度
  maxLength: 15, //15
  // 视频截取尾部最小长度, 小于设置值视频截取不保留
  minLimit: 8, //10
  // 是否分割视频: yes/no
  split: "yes",
  // 缩放比例
  scale: 1.2,
};
