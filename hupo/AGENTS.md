# 胡珀 · 穿搭照相馆
独立入口/hupo/，当前3套写实人物和15件单品，复用已确认原人物，不再生成人脸。不得与mobile/卡通版收藏或缓存合并。收藏hupo-outfit-favorites-v1；离线scope为/hupo/，缓存按scope隔离。
先读根HANDOFF.md和docs/mobile-next-2026-11-03.md。此目录JS/CSS为mobile版的独立发布副本；同步交互修改时保留hupo的data、收藏键、导出名称、白色背景及metadata。素材来源和生成提示保存在output/mobile-next-2026-11-03，仅本地，禁止发布个人原始参考PNG与来源记录。
修改后node tools/build-hupo-pwa.cjs、node tools/update-runtime-manifest.cjs及npm run check；必要时npm test。根清单需显式加入新增运行文件。禁止清除真实收藏。
