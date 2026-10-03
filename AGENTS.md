# Today Outfit

独立实用穿搭网站，来自用户已确认的完整衣橱版本。用户已明确授权本项目正式发布到独立GitHub仓库及公开GitHub Pages网址；旧character-studio网站保持不变。

保留现有简约布局、无衬线、人物身份/比例及服装素材。角色依次为吴心媛(sweet)、陈墨白(cool)、顾书宁(literary)。用途为上课、上班、约会、聚会、演出、逛街、短途旅行、长途旅行、景点打卡。不能将固定全身旧动作叠到单件换装上；暂不兼容入口明确disabled，旧动作目录保留。

主入口index.html。运行素材assets/；50款设计data/catalog.js；条件data/needs.js；换装/推荐/旅行/渲染/存储为根目录*-v2.js。旧面部动作定义legacy/studio-model.js。数据库today-outfit-plans-v1、session today-outfit-session-v1，与旧站隔离，禁止清理真实收藏。

修改前看HANDOFF.md和docs/release-v1.md。python3 serve.py --port8876；npm run check；npm test。运行清单runtime-manifest.json需要随有意修改更新。output/及source-art/留在本地，不发布密码、密钥、个人参考照片或制作日志。当前授权只正式化及发布现有版本，不扩充款式/推荐或重做布局。
