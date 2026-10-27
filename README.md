# Download Source Router

一个基于来源网页域名自动整理下载文件的 Chrome 扩展。扩展会将文件保存到 Chrome 默认下载目录下的指定相对子目录，不会改变浏览器的默认下载根目录。

## 主要功能

- 按发起下载网页的域名匹配存放目录。
- 支持完整网址、域名、子域名、`localhost`、IP 地址和可选端口匹配。
- 子域名规则优先于主域名规则，例如 `download.example.com` 优先于 `example.com`。
- 每条规则可设置 Tag，默认值为 `default`；相同 Tag 的规则会分组显示并可折叠。
- 支持将规则导出为 JSON，以及合并导入其他配置。
- 导入时保留本地独有规则；路径或 Tag 冲突时可分别选择本地值或导入值。
- 新导入或已解决冲突的规则以黄色标记，未解决的冲突以红色标记。
- 存在未解决冲突时，仅保存无冲突配置，并保留原有的冲突规则。
- 支持中文和英文界面，可在设置页切换；首次使用时跟随 Chrome 界面语言。

## 匹配与下载规则

- “区分端口”关闭时，同一主机的所有端口共用一条规则；开启后可分别配置。
- 域名规则会匹配其子域名，但不会误匹配名称相似的其他域名。
- 相对路径为空、没有匹配规则或无法识别下载来源时，保持 Chrome 原本决定的文件路径。
- 当 `referrer` 不可用时，扩展会依次尝试关联标签页、已记录的标签页地址和当前活动标签页。
- 文件名冲突时使用 Chrome 的 `uniquify` 策略自动生成不重复的名称。

## 适用环境

- Google Chrome 或其他兼容 Manifest V3、`chrome.downloads`、`chrome.storage` 和 `chrome.tabs` API 的 Chromium 浏览器。
- 主要面向桌面浏览器；移动版 Chrome 不支持常规桌面扩展。
- 存放路径始终相对于浏览器设置的默认下载目录。

## 技术实现

- Manifest V3
- 原生 JavaScript、HTML 和 CSS，无前端框架及远程脚本依赖
- Chrome Extensions API：`downloads`、`storage`、`tabs`
- Chrome `_locales` 与本地语言词典实现中英文界面
- 用户规则、语言和界面设置保存在 `chrome.storage.local`

## 本地安装

1. 在地址栏打开 `chrome://extensions/`。
2. 开启右上角的“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本工程目录。
5. 点击扩展图标并打开设置页，添加规则后点击“保存设置”。

修改源码后，需要在 `chrome://extensions/` 中点击扩展的刷新按钮。

## Chrome 设置建议

在 `chrome://settings/downloads` 中设置默认下载位置。若希望文件自动归档，建议关闭“下载前询问每个文件的保存位置”。

## 注意事项

- Chrome 扩展只能指定默认下载目录内的相对路径，不能借此写入任意绝对路径。
- 修改规则、完成导入或解决冲突后，需要点击“保存设置”才会生效。
- 未解决的导入冲突不会覆盖原有本地规则。
- 导入文件必须是本扩展导出的有效 JSON 配置，且大小不能超过 1 MB。
- 扩展需要 `tabs` 权限识别下载来源，需要 `downloads` 权限调整保存路径，需要 `storage` 权限保存配置。
- 配置和来源匹配信息保存在浏览器本地，工程未实现向外部服务器上传数据的功能。

## 工程文件

```text
background.js     下载来源识别和路径路由
options.html/js   规则设置、Tag 分组、导入导出和冲突处理
popup.html/js     工具栏弹窗
i18n.js           设置页和弹窗的中英文文案
styles.css        页面样式
_locales/         Chrome 扩展名称、描述和工具栏文案
icons/            扩展图标
manifest.json     Manifest V3 配置
```
