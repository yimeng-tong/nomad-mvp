# Repository Structure

The implemented workspace layout is documented in `source-tree.md`. This file remains as a
compatibility pointer because older documents link to it; do not use the former RN/Flutter TBD
proposal as an implementation source.


## Approved UI directories (implementation pending, 2026-09-20)

9.3在apps/mobile/src/ui/{primitives,components,styles}建立共享源码，9.4在该workspace独立配置Storybook/MSW与lint，9.5建立浏览器用例/快照及CI产物目录；9.6读取adapter与9.7路由各自独立模块。当前单一前端不先创建packages/ui。目录及依赖由各Story实际交付，本文不表示已存在。
