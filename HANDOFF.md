# 项目交接

当前独立项目目录：/Users/zen/Documents/ChatGPT/制作/today-outfit。
目标：实用穿搭入口和旅行衣橱，保留当前三角色、50款/90适配和已有完整功能。用户已确认本版并授权正式发布；旧互动摄影棚独立保留。

入口index.html；核心*-v2.js、data/、legacy/；运行素材assets/，制作原PNG本地source-art/。独立数据库today-outfit-plans-v1，session today-outfit-session-v1；不清空旧收藏。
启动：python3 serve.py --port 8876。检查：npm run check、npm test；线上：node tools/smoke-site.cjs https://qiangbai369.github.io/today-outfit/ 。详情docs/release-v1.md，日志仅本地output/release/。

独立Git仓库，分支main。52/52回归通过，209运行资源核对通过；根首页实际检查三角色换装→眨眼→标签→保存重开、建议试穿、三日旅行/行李、照片下载及刷新后收藏，均正常。日志output/release/local-tests.log和local-smoke.log。

正在首次发布到qiangbai369/today-outfit，公开网址为https://qiangbai369.github.io/today-outfit/。线上检查尚待执行，不视为通过。下一步只完成本版本GitHub Pages发布及线上核对，不扩充功能。
