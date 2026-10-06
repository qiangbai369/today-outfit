# 穿搭照相馆

挑选角色与四季穿搭，选择表情动作和摄影棚光线，收藏并下载喜欢的照片。

- [进入穿搭照相馆](https://qiangbai369.github.io/today-outfit/)
- [旧版穿搭与旅行衣橱](https://qiangbai369.github.io/today-outfit/legacy/)
- [源码仓库](https://github.com/qiangbai369/today-outfit)

当前 v2.0.0：吴心媛、陈墨白、顾书宁，每人四季各两套，共24套完整穿搭、72个动作。支持自然光、暖光、柔冷光和900×1200 PNG下载。顾书宁轻挥手仅在手腕局部摆动，身体保持固定。桌面与手机共用网址，沿用已确认的简洁摄影棚布局。

新版收藏独立保存，旧版搭配与旅行清单可从“旧版”入口继续查看。收藏位于当前浏览器，不跨设备自动同步；本地预览收藏也不会自动同步到线上。未改动旧版衣橱、推荐、旅行和存储实现。

## 本地运行

```sh
python3 serve.py --port 8876
```

首页 http://127.0.0.1:8876/ ；旧版 http://127.0.0.1:8876/legacy/ 。运行不需要账号或API Key。

## 维护

GitHub Pages从main分支根目录发布。完整穿搭运行文件沿用 `previews/complete-looks/`，根首页通过相对base路径复用它；旧版入口 `legacy/index.html` 继续使用原根目录脚本和素材。两版收藏使用不同的存储名称，禁止清理真实收藏。

使用Node.js20以上，安装开发依赖后运行：

```sh
npm install
npx playwright install chromium
npm run check
npm test
npm run test:smoke -- https://qiangbai369.github.io/today-outfit/
```

`runtime-manifest.json`核对两版运行资源。修改完整穿搭后先验收，再运行 `node tools/check-complete-looks.cjs --record` 和 `node tools/update-runtime-manifest.cjs` 更新清单。旧版浏览器回归改为访问 `/legacy/`；动作与光线验证继续覆盖完整穿搭。

制作日志、个人参考照片及原始生成记录仅保留在本地 `output/` 和 `source-art/`，不上传。发布内容说明见 [v2.0.0](docs/release-v2.0.0.md)。真实iPhone、安卓和微信浏览器尚未实机验收。
