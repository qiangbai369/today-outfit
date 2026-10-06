# 穿搭照相馆 · v2.0.0 当前维护入口

用户于2026-10-07确认将完整穿搭版正式发布到既有today-outfit GitHub Pages，保留旧版入口，新版收藏独立保存，统一名称为“穿搭照相馆”。默认index.html通过base复用previews/complete-looks/；原衣橱入口legacy/index.html通过base复用原根目录文件。24套与72动作已验收，禁止重复生成或恢复失败的单件拆层办法。旧版存储继续保留，新版沿用today-outfit-complete-preview-favorites-v1/session-v1；不得清理真实收藏。

修改前看HANDOFF.md与docs/release-v2.0.0.md。保留已确认布局、完整穿搭、手腕局部挥动、光线、收藏及下载。runtime-manifest.json覆盖两版；有意修改并验收后更新预览清单与根清单。npm run check；npm test。output/与source-art/以及sources.json制作来源记录仅本地，不发布。

---
以下为旧版背景，运行入口已迁至legacy/index.html：

# Today Outfit

独立实用穿搭网站，来自用户已确认的完整衣橱版本。用户已明确授权本项目正式发布到独立GitHub仓库及公开GitHub Pages网址；旧character-studio网站保持不变。

保留现有简约布局、无衬线、人物身份/比例及服装素材。角色依次为吴心媛(sweet)、陈墨白(cool)、顾书宁(literary)。用途为上课、上班、约会、聚会、演出、逛街、短途旅行、长途旅行、景点打卡。不能将固定全身旧动作叠到单件换装上；暂不兼容入口明确disabled，旧动作目录保留。

主入口index.html。运行素材assets/；83款设计data/catalog.js与data/cool-capsule.js；条件data/needs.js；换装/推荐/旅行/渲染/存储为根目录*-v2.js。旧面部动作定义legacy/studio-model.js。数据库today-outfit-plans-v1、session today-outfit-session-v1，与旧站隔离，禁止清理真实收藏。

修改前看HANDOFF.md和docs/release-v1.1.0.md。python3 serve.py --port8876；npm run check；npm test。运行清单runtime-manifest.json需要随有意修改更新。output/及source-art/留在本地，不发布密码、密钥、个人参考照片或制作日志。当前授权只正式化及发布现有版本，不扩充款式/推荐或重做布局。
