# 今天怎么穿

根据今天的安排寻找穿搭灵感，换单件、锁定喜欢的衣服，保存搭配；旅行时安排逐日穿搭并整理行李。

- 在线使用：[今天怎么穿](https://qiangbai369.github.io/today-outfit/)
- 独立仓库：[today-outfit](https://github.com/qiangbai369/today-outfit)
- 上一版：[互动摄影棚](https://qiangbai369.github.io/character-studio/)；两个网站分别维护。

## 当前功能

三位角色：吴心媛、陈墨白、顾书宁。50款设计，每人30件适配单品，共90份角色服装适配；按用途、季节和冷暖看建议，也可直接逛衣橱。支持单件替换、锁定再搭、已有单品偏好、保存重开、1—7天旅行、去重行李清单、背景光线和纯图照片下载。

保存内容位于使用者自己的浏览器，不上传服务器；不同设备或浏览器不自动同步。可以下载照片、清单和方案。两版网站使用不同的存储名称；本地预览中的收藏不自动迁移到线上。

## 本地启动

```sh
python3 serve.py --port 8876
```

打开 http://127.0.0.1:8876/ 。运行不需要npm、API Key或账号。GitHub Pages从`main`分支根目录发布；所有运行资源均使用相对路径。

## 检查与维护

使用Node.js20以上，安装开发依赖后运行：

```sh
npm install
npx playwright install chromium
npm run check
npm test
node tools/smoke-site.cjs https://qiangbai369.github.io/today-outfit/
```

`runtime-manifest.json`校验运行资源；`tests/`覆盖换装、建议、旅行、保存、错误恢复、分类滚动和眼部眨眼。`tools/smoke-site.cjs`可以检查本地或线上正式入口。

运行所需源码和图片全部随仓库发布。制作期原PNG在本地`source-art/`，原项目和旧能力仍保留；不把制作日志或个人参考照片发布到仓库。已知动作兼容边界和发布记录见[发布说明](docs/release-v1.md)。
