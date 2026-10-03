# 项目交接 · 2026-10-03

最新：用户已确认并授权把当前版本更新到 today-outfit 正式GitHub Pages，发布版本 v1.1.0。手机端已有自适应布局，本轮检查手机画幅，真实手机/微信尚未实机验收。旧互动摄影棚和 v1.0.0 保留；发布验证日志 output/release-v1.1.0/，说明 docs/release-v1.1.0.md。本地独立备份 today-outfit-backups/。下面未发布的描述是本轮发布前状态。

- 目录：/Users/zen/Documents/ChatGPT/制作/today-outfit；独立Git，main，origin qiangbai369/today-outfit。本轮及前轮本地修改均未提交/推送。公开站 https://qiangbai369.github.io/today-outfit/ 仍是旧正式版本；旧互动摄影棚是另一项目，不能混用。
- 目标：简约实用“今天怎么穿”，先用途/季节→建议或逛衣橱→逐件调整/锁定→保存；1—7天旅行与去重行李继续保留。只留摄影棚，无衬线、当前桌面布局、两入口、两标签及右栏收起保留。角色顺序吴心媛sweet、陈墨白cool、顾书宁literary，身份/比例不能重做；收藏不能清理。
- 用户已批准陈墨白四季各2套新服装，已接入33件透明分件＋2公共包；旧单品/旧收藏仍有效。现83设计/95适配，活跃单品35/30/30。不继续扩款。
- 本轮已做：推荐返回“选衣服”；用途不符的共用短提示；简短推荐理由；“换一件”全部兼容候选；用途＋季节主条件/其他默认折叠；约会/聚会/逛街/打卡权重细分。冷暖/步行/锁定/排除/拥有仍为原硬约束。
- 人物：三人独立睁眼/半闭/闭眼310ms眨眼；吴心媛保留开心笑/鼓脸，陈墨白微挑眉/轻扬唇，顾书宁专注/会意笑。局部眉眼嘴不带衣物，不歪头。暖冷光加入弱二维局部明暗，预览/照片/缩略图同源；不是3D物理重照明。旧肢体动作固定衣服不兼容，明确禁用并保留代码素材。
- 验证：69/69完整回归、292运行文件校验通过；桌面首排/单滚动、390/820画幅、三人换装→动作→标签→保存重开、暖冷光照片与缩略图匹配、建议、锁定/勾选、旧记录、旅行通过。吴心媛4套在真实浏览器缩放0.8/1/1.25/1.5核对眨眼和照片下载。原3条真实收藏保留，新增“穿搭流程与表情核对”。未验证真手机/微信、公开站本轮变化、全部任意混搭及旧禁用动作。
- 修复启动偶发卡住：捕获核心脚本连接重置；本地Python默认连接队列5，48并发请求21次重置。serve.py队列64、动态端口正确后48/48成功、30次启动无失败，浏览器检查改用真实项目服务后69/69通过；8876已重启。旧失败日志保留。几何压缩眼睛会拉睫毛，已废弃，最终为真实半闭眼局部素材。

关键文件：index.html、app-v2.js、style-v2.css；catalog/model/rules/travel/renderer/storage/motions-v2.js；data/catalog.js、data/needs.js、data/cool-capsule.js；运行assets/，旧动作legacy/studio-model.js。独立数据库today-outfit-plans-v1、session today-outfit-session-v1，不迁移/删除真实收藏。

眨眼assets/v2/{角色}/blink-{detail,half}.png；新表情cool/personality-{brow,smirk}.png、literary/personality-{focus,knowing}.png。局部生成原件和完整提示词只在source-art/blink-refinement/、source-art/personality-refinement/；编译tools/build-blink-detail.cjs、tools/build-personality-detail.cjs。不要用完整生成图替换穿搭人物。

当前重要未提交：前轮摄影棚/边栏/陈墨白分件及目录变更、删除生活背景；本轮app/index/style/needs/model/rules/renderer/motions及清单、10个新眼部表情PNG、serve.py和测试/文档变更。没有撤销旧改动、切分支或提交。runtime-manifest.json随有意修改更新。

启动：python3 serve.py --port 8876；本地 http://127.0.0.1:8876/ 。检查：npm run check；NODE_PATH=/Users/zen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules npm test。不需要装新动画框架或读取API Key。

本轮详情：docs/guidance-face-refinement-2026-10-03.md；历史审计docs/character-flow-audit-2026-10-03.md，正式发布基线docs/release-v1.md。日志/截图output/guidance-blink-review/，最终verified-regression.log和final-preview.png。output/、source-art/仅本地，不发布。

**当前任务：发布并保存v1.1.0，核对公开网址及手机画幅操作。** 用户已给最终发布确认，无需再请求发布权限；完成后只汇报结果，不继续扩款或改人物。
