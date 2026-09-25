# Story9.5工具研究（只读）

实际代码基线6344a53，收口基线a950ea0；日期2026-09-25。独立研究者story95_browser_research核验，主任务再读browsers.json并匿名GET MCR manifest复核digest。没有安装新依赖/拉取镜像/启动9.5浏览器；仅CLI test --help和test/expect/defineConfig导入通过，Node22.22.1。

- 现有playwright1.63.0提供playwright/test，优先复用。@playwright/test1.63.0 registry存在、Node>=20、直接依赖playwright同版本、无peer；无必要不增加别名包。
- browsers.json：Chromium153.0.8010.12/rev1243、Firefox155/rev1543、WebKit26.6/rev2359（Mac14 override2251）。仅9.4有Chromium实际运行证据，其他待9.5运行。
- MCR v1.63.0-noble index sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27；linux/amd64 sha256:bc6ab0d6d44ff4826e4cb8c1e6d801e185bfc42bb0753f8e2a30efc70db054c7。镜像Dockerfile/config声明Node24，必须显式覆盖仓库22.22.1/pnpm11.7.0并实测路径版本；镜像不包含项目npm包。
- Ubuntu26.04官方支持；本机无Docker/Podman命令，功能可本地跑、canonical截图用同noble/amd64镜像。不存在跨WSL/Mac像素基线自动等价。
- 官方镜像依赖含fonts-wqy-zenhei（中文）、fonts-ipafont-gothic、unifont、emoji，不需浮动apt安装Noto。image digest固定原始bytes，实际fc-match/fontconfig/字体hash仍需首个run采集，document.fonts.ready不能单独证明中文fallback。
- 三项目分别基线；Firefox不支持isMobile，共用窄屏不直接套iPhone descriptor。固定locale/timezone/DPR/viewport/clock/data/motion/headless。200%测实际computed字体。截图animations disabled会完成有限动画并触发transitionend，行为时序另验。
- Playwright默认updateSnapshots=missing，常规CI必须明确none；独立候选入口才生成并审阅。retain-on-failure保证第一次失败trace；零用例/启动失败/缺资源不能当成功负例。未知请求和旧owner/重复POST等实际故障必须令门禁失败。
- WebKit是补丁引擎，不等于Safari16.4/iOS或最低真实设备，FF155同样不等于最低128；原IDB/PG/kill/SSE责任保持。

## 官方来源

- https://registry.npmjs.org/@playwright%2ftest/1.63.0
- https://playwright.dev/docs/intro#system-requirements
- https://playwright.dev/docs/docker
- https://mcr.microsoft.com/v2/playwright/manifests/v1.63.0-noble
- https://github.com/microsoft/playwright/blob/v1.63.0/utils/docker/Dockerfile.noble
- https://github.com/microsoft/playwright/blob/v1.63.0/packages/playwright-core/src/server/registry/nativeDeps.ts
- https://playwright.dev/docs/test-snapshots
- https://playwright.dev/docs/api/class-pageassertions#page-assertions-to-have-screenshot-1
- https://playwright.dev/docs/api/class-testconfig#test-config-update-snapshots
- https://playwright.dev/docs/clock
- https://playwright.dev/docs/trace-viewer
- https://playwright.dev/docs/browsers#webkit
