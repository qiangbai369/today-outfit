# 项目交接

当前独立项目目录：/Users/zen/Documents/ChatGPT/制作/today-outfit。
目标：实用穿搭入口和旅行衣橱，保留当前三角色、50款/90适配和已有完整功能。用户已确认本版并授权正式发布；旧互动摄影棚独立保留。

入口index.html；核心*-v2.js、data/、legacy/；运行素材assets/，制作原PNG本地source-art/。独立数据库today-outfit-plans-v1，session today-outfit-session-v1；不清空旧收藏。
启动：python3 serve.py --port 8876。检查：npm run check、npm test；线上：node tools/smoke-site.cjs https://qiangbai369.github.io/today-outfit/ 。详情docs/release-v1.md，日志仅本地output/release/。

独立Git仓库，分支main。52/52回归通过，209运行资源核对通过；根首页实际检查三角色换装→眨眼→标签→保存重开、建议试穿、三日旅行/行李、照片下载及刷新后收藏，均正常。日志output/release/local-tests.log和local-smoke.log。

已正式发布：GitHub https://github.com/qiangbai369/today-outfit；网站 https://qiangbai369.github.io/today-outfit/。GitHub Pages来源main根目录，运行基线4ba78c0。公开网址209份资源全部HTTP200，三角色换装/眨眼/标签/保存重开、建议试穿、三日旅行/行李/保存、照片下载及刷新收藏均已实测；无JS错误或资源错误。桌面1280×900、手机画幅390×844通过，真实手机/微信未实机验收；未适配旧肢体动作仍明确禁用。日志output/release/public-smoke.log和smoke-results.json，实际截图public-desktop.png/public-mobile.png。

常规Git上传遇HTTP/2错误及HTTP/1.1超时，改用GitHub官方Git数据接口；每个图像blob及完整230文件tree哈希核对一致，远程/本地主分支已同步。核对记录output/release/api-publication.json。旧character-studio主分支仍为840d738d04df4453b78e38127738bc058ef18ee7；旧209运行文件不变。

下一步等用户提出本独立网站的后续需求，再在本目录继续；当前发布任务已完成，不自动扩充或重做布局。
