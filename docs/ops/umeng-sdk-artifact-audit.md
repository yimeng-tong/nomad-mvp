# 友盟原生SDK制品核验（2026-09-19）

本次直接核验官方分发的真实制品，没有初始化SDK、加载真实AppKey或发送事件。当前候选版本固定在
`ops/telemetry/umeng-sdk-lock.json`；版本/校验和由实际仓库和归档取得，不使用动态`+`依赖。

| 平台 | 制品 | 固定版本 | 来源 |
| --- | --- | --- | --- |
| Android | common | 9.9.10 | [Maven Central](https://repo.maven.apache.org/maven2/com/umeng/umsdk/common/9.9.10/) |
| Android | asms | 1.8.7.2 | [Maven Central](https://repo.maven.apache.org/maven2/com/umeng/umsdk/asms/1.8.7.2/) |
| iOS | UMCommon | 7.6.7 | [已发布Podspec](https://trunk.cocoapods.org/api/v1/pods/UMCommon/specs/7.6.7)指向的友盟OSS |
| iOS | UMDevice | 3.6.0 | [已发布Podspec](https://trunk.cocoapods.org/api/v1/pods/UMDevice/specs/3.6.0)指向的友盟OSS |

四份原档SHA256和API/manifest结构在`evidence/story-1-6-umeng-sdk-2026-09-19/artifact-audit.json`（implementation-artifacts内）。
Android同时与仓库发布SHA256核对；iOS以发布Podspec指向的原档计算摘要，不能声称有独立厂商签名证明。

## 已证实的接入约束

- Android common的manifest带`com.google.android.gms.permission.AD_ID`和`freemme.permission.msa`；两AAR没有manifest声明的自动启动组件。
  这不证明运行时没有自动采集。实际并入App前应按已批准能力移除不需要的广告/设备权限，并检查最终merged manifest。
- asms含arm64-v8a/armeabi-v7a/x86库，不含x86_64；探针需匹配ABI，不能以x86_64加载失败推断真实arm设备能力。
- Android public API有privacy提交、手动页面模式、事件上报、profile退出与disable。实际字节码确认`MobclickAgent.disable()`只将AnalyticsConfig.enable置false，没有取消网络或删缓存的调用。
  此事实只约束该方法本身，不等于已证明其他路径完全不能停止；完整关闭语义尚待隔离运行验证。
- Android `submitPolicyGrantResult(false)`会投递内部工作事件，因此不能把调用返回当成撤回/清理完成屏障。
- iOS公开header有`setAnalyticsEnabled:`、`setAutoPageEnabled:`、`enablePi:`和独立ASA/SKAN开关；已有统计开关不证明在途请求/缓存已同步清除。
  `clearPreProperties`只是预置属性接口，不能冒充全缓存擦除。
- iOS两包是XCFramework，均包含arm64设备和arm64/x86_64模拟器切片及PrivacyInfo.xcprivacy；原zip有版本号外层目录。
  可以据此准备确定性SPM本地binary target，但尚未证明Mac编译/签名/设备运行；不盲猜远程zip布局能被SwiftPM直接接受。
- 不加入uyumao/ABTest/UAPM等可选采集模块；不把公共SDK依赖下载称为U-App/U-Link实际查询验收。

## 可重跑静态检查

```sh
python3 scripts/telemetry/audit-umeng-sdk.py \
  --javap /path/to/jdk/bin/javap \
  --cache-dir /tmp/nomad-umeng-audit-cache \
  --output /tmp/nomad-umeng-audit.json
```

只访问固定HTTPS源，核对锁定摘要并限制下载/归档大小；不执行jar/SDK代码。缓存损坏和非允许源反例已通过。
报告明确`runtimeIntegrationApproved=false`、SDK未初始化、供应商事件0。当前应用工程还未加入这些依赖。

## 立即后续

首先在独立Android探针验证真实SDK的许可/禁用/缓存/线程生命周期，网络必须限定本地替身并阻断外部供应商；
不能为了测关闭行为向用户现有友盟应用发送未授权事件。当前WSL无/dev/kvm，正在安装匹配asms ABI的Android29 x86软件模拟器，
文件仅在Git忽略的`.local-tools/`，不接触现有手机或个人浏览器。模拟器仍不替代双端物理设备验收。
若关闭/清缓存不能满足现有TelemetrySession.close语义，应据运行证据调整适配器生命周期或保留明确门槛，不能写一个返回成功的空close。
Mac/签名/设备和法律/U-Link问题继续待回；其他独立实施保持推进。


## 已执行的Android离线探针

独立`ops/telemetry/android-probe`使用上述固定真实SDK，36 tasks/21s编译通过；D8报告供应商字节码stack-map警告，构建成功且下面实际加载执行。
探针与Nomad App分开，只有全零合成AppKey，非导出Activity；仅专用`nomad-umeng-fixture` Android29 x86模拟器可由root启动。
`scripts/telemetry/run-android-sdk-probe.py`在安装后、启动前核对目标/ABI/UID，为探针UID设置并验证IPv4和IPv6 OUTPUT REJECT，结束后再次验证并保留规则。
仅清理此专用模拟器中本探针包的合成数据；没有操作真实Nomad包或连接的物理设备。全部五个阶段通过后已force-stop探针，模拟器已请求关机。

`android-lifecycle.json`记录真实SDK初始化flag从false变true。调用disable、privacy(false)、profile sign-off、clearPreProperties后，10秒末仍有9文件/42460字节；只读文件元数据确认有`ua.db`、SDK envelope和identity文件，没有读取缓存正文。
这证明该调用组合没有完成本机SDK状态擦除；**不能据此推断某条事件在撤回后上传或被接收**，因为本轮出站受阻，且未检查缓存正文。线程观测0只是堆栈采样，不等于所有内部工作已停止。
下一适配器必须明确逻辑投递scope与供应商进程/缓存生命周期，不能把`disable()`返回值或等待10秒当成功清理屏障。
实际供应商到达、iOS运行、真实许可/法律保留策略仍未核验。此门槛保留在1.0/1.6；不妨碍准备下一独立1.7合同。
