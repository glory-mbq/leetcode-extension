# LeetCode (glory-mbq fork)

本 fork 基于 ccagml 的 LeetCode 插件，默认在点击 **Code Now** 后显示左侧题目、右侧代码，并在 VS Code 集成浏览器中打开题目底部的 **Discussion / Solution**。

## 安装此版本

1. 从 [GitHub Releases](https://github.com/glory-mbq/leetcode-extension/releases) 下载 `.vsix`。
2. 在 VS Code 扩展面板的菜单中选择 **Install from VSIX...**。
3. 禁用原版 `ccagml.vscode-leetcode-problem-rating`，再重新加载窗口。本 fork 保留原来的命令、视图和配置名称，两个版本不应同时启用。

推荐的用户设置（`settings.json`）：

```json
{
  "leetcode-problem-rating.showDescription": "In Webview",
  "leetcode-problem-rating.enableSideMode": true,
  "leetcode-problem-rating.editor.codePosition": "right",
  "leetcode-problem-rating.problemLinks.openIn": "integratedBrowser",
  "workbench.browser.newTabPlacement": "activeGroup"
}
```

`editor.codePosition` 可设置为 `left`，题目、内置题解和提交结果会显示在代码的另一栏。关闭分栏模式或关闭 Webview 题干时，代码仍在第一栏打开。

网页浏览沿用 VS Code 的浏览器放置及会话存储设置；首次访问力扣可能需要单独登录。旧版 VS Code 没有集成浏览器时会提示升级，并提供手动选择的外部浏览器入口。需要始终在外部浏览器打开时，将 `problemLinks.openIn` 设置为 `externalBrowser`。

代码文件上方的 **Solution** 仍使用原插件的内置题解功能；题目底部的 **Solution** 打开完整网页。

## 本地开发

```powershell
npm ci
npm test
npm run test:extension
npm run watch
```

`test:extension` 使用本机安装的 VS Code，在独立的用户数据和扩展目录中检查编辑器分栏、焦点、题解/提交结果、链接消息与真实集成浏览器命令。可通过 `VSCODE_EXECUTABLE_PATH` 指定 VS Code 可执行文件。测试不登录力扣，也不提交题目。

按 F5 选择 **Debug LeetCode Fork** 可启动开发窗口。打包命令：

```powershell
npx @vscode/vsce package -o leetcode-glory-mbq.vsix
```

以下保留上游项目说明。

<p align="center">
  <a href="https://github.com/ccagml/leetcode-extension/actions/workflows/release.yml">
    <img src="https://img.shields.io/github/actions/workflow/status/ccagml/vscode-leetcode-problem-rating/release.yml?branch=release" alt="">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=ccagml.vscode-leetcode-problem-rating">
    <img src="https://img.shields.io/visual-studio-marketplace/d/ccagml.vscode-leetcode-problem-rating.svg?style=flat-square" alt="">
  </a>
  <a href="https://github.com/ccagml/leetcode-extension/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/ccagml/vscode-leetcode-problem-rating" alt="">
  </a>
</p>

# 概要设计

- 在 VS Code 中解决 Leetcode 问题
- Leetcode 只提供了简单、中等、困难的难度区分。题目与题目之间难度差别很大，因此需要客观的分数对题目难度进行打分
- 增加中文官方的每日一题
- 修复 tag 分类错误
- 增加精选分类
- 增加剑指 Offer、面试金典相关内容
- 增加一键提交全部题目测试用例功能
- 尝试不需要额外安装 node 环境,使用 vscode 自带的 node 版本
- 从[zerotrac.github.io](https://zerotrac.github.io/leetcode_problem_rating/data.json)获取数据进行缓存,数据更新时,可以尝试使用 deleteAllCache,重新获取数据
- [新增区块测试用例](#区块测试用例)
- [新增搬砖功能(重复练习?)](#搬砖功能的说明)
- [状态栏增加简易计时器](#状态栏增加简易计时器)
- [新增一个 remark 功能](#新增在工作目录存放数据)
- [新增题目自定义分类](#新增在工作目录存放数据)
- [答案不同上色,配置默认不开启](#插件配置项)
- 增加获取中文站的题解
- 增加 cpp、js、py3 一些题目的 debug(参考 wangtao0101 项目,有问题提 issues)
- [有些题目原插件无法调试,请尝试配置区域调试参数](#区域调试参数的一些说明)
- [国际站修改登录方式 cRUL 方式登录](#cRUL 登录)
- [增加近期竞赛回顾](#近期竞赛回顾)

# 关于本项目

- [项目地址:https://github.com/ccagml/leetcode-extension/](https://github.com/ccagml/leetcode-extension/)
- [报告问题](https://github.com/ccagml/leetcode-extension/issues)
- [疑难解答](https://github.com/LeetCode-OpenSource/vscode-leetcode/wiki/%E7%96%91%E9%9A%BE%E8%A7%A3%E7%AD%94)
- [常见问题](https://github.com/LeetCode-OpenSource/vscode-leetcode/wiki/%E5%B8%B8%E8%A7%81%E9%97%AE%E9%A2%98)
- 趁着现在只有<img src="https://img.shields.io/github/stars/ccagml/vscode-leetcode-problem-rating" alt="">提交一个 PR 就能成为项目元老了

## 快速开始

![quickstart](https://www.ccagml.com/wp-content/uploads/2022/10/quickstart.gif)

## tag 分类

![tag](https://www.ccagml.com/wp-content/uploads/2022/10/tag.gif)

## 查询功能

![search](https://www.ccagml.com/wp-content/uploads/2022/10/search.gif)

## 近期竞赛回顾

![search](./resources/leetcode-extension-recentcontests.gif)

  - 近期比赛数据和比赛的题目通过中文官网在线获取
  - 国际站并无对应api，因此即使在国际站点下也是通过中文站点获取的数据，同时由于没有登录参数，可能存在无法获取数据的情况。

## 区块测试用例

### 例子(cpp 文件为例)

```
// @lcpr case=start
// "PAYPALISHIRINGGGG"\n3\n
// @lcpr case=end
```

### 说明

- 以 @lcpr case=start 开头
- 第二行存放原本手动填写测试用例
- 以 @lcpr case=end 结尾

### 一键提交的用例去重

- 简单的比较这些用例字符串是否相同

## 状态栏增加简易计时器

- 查看一个题目时会开始计时,提交一个题目通过后会停止计时

## 国际站 cRUL 登录

- 使用谷歌浏览器或者其他浏览器
- F12 查看登录国际站后的请求
- 选中复制最后一个 graphql 请求
- 右键->复制-> 以 cURL(bash)格式复制
- 插件登录选择 使用 cURL Cookie 方式登录,输入账号,输入复制来的 cURL(bash)格式请求数据

## 区域调试参数的一些说明

### 如果有些题目无法 debug,请尝试配置 diy 参数区

1. 例子 cpp 2544 题为例
   ```
   // @lcpr-div-debug-arg-start
   // funName= alternateDigitSum
   // paramTypes= ["number"]
   // @lcpr-div-debug-arg-end
   ```
2. diy 参数说明

- funName:函数名,既本次解决方法的函数名
- paramTypes:函数的输入参数,是一个字符串数组类型
  - 可填入内容为以下字符串
    - "number"
      - 类型说明:数字
    - "number[]"
      - 类型说明:数字数组
    - "number[][]"
      - 类型说明:数字二维数组
    - "string"
      - 类型说明:字符串
    - "string[]"
      - 类型说明:字符串数组
    - "string[][]"
      - 类型说明:字符串二维数组
    - "ListNode"
      - 类型说明:链表
    - "ListNode[]"
      - 类型说明:链表数组
    - "character"
      - 类型说明:字节
    - "character[]"
      - 类型说明:字节数组
    - "character[][]"
      - 类型说明:字节二维数组
    - "NestedInteger[]"
      - 类型说明:数组
    - "MountainArray"
      - 类型说明:数组
    - "TreeNode"
      - 类型说明:树节点

<!-- ## TODO 看到一些可能会用得上的功能

- (完成) 在文件里面插入一些测试用例?
- (完成) 不是中文站点,直接隐藏账号密码登录的方式
- 默认的工作目录修改 不再是.leetcode(不改了)
- (完成)想做一个可以根据计算下次回顾本题的功能?
- (需要在设置的工作目录中存放多个文件?)
- (完成) Test 按钮应该不在需要 case 和 allcase 只要留下输入的功能
- 备忘录功能(数据直接放设置的工作目录?用 github 同步?)
- 获取提交历史(直接找官方的提交数据)
- 提交答案与期望答案不同的地方?
- (完成)做题目计时
- (完成)还没出分前周赛题目显示 未评分(需要官网获取最新几期的题目编号)
- (完成)在线获取周赛编号下的题目
- 将搜索功能中的竞赛修改为在线获取题目，将周赛与双周赛分开，同时可以检索未出分前的竞赛题目
- 将近期竞赛的显示数量修改为可配置选项
- -->

## 搬砖功能的说明

### 功能设想

- 重复做 x 天之前的题目(正确提交后 x 天再做本题)
- 重复练习可以提高水平?(待定验证)
- 有什么学习方法可以与我交流,这个方法我也不知道有没有用

### 新增在工作目录存放数据

- 目录说明

  > workspace/ 工作目录
  >
  > > .lcpr_data/ 存数据
  > >
  > > > bricks.json
  > >
  > > > remark 备注数据
  > > >
  > > > > qid 备注 remark 数据
  > >
  > > > group.json

### bricks.json 存放格式

```
{
   version: 1,
   all_bricks: {
     [qid]: {
        submit_time: [], // 上次提交的时间
        type: 1, // 类型
     },
   },
 };

```

### group.json 存放格式

```
{
    "version": 1,
    "all_group": [
        {
            "name": "www",  // 分类名称
            "time": 1669791273308, // 分类编号
            "qid_list": [   // 该分类的题目qid
                "1000229",
                "1000231"
            ]
        }
    ]
}
```

## 运行条件

- [VS Code 1.57.0+](https://code.visualstudio.com/)
- [Node.js 10+](https://nodejs.org)
  > 注意：请确保`Node`在`PATH`环境变量中。您也可以通过设定 `leetcode.nodePath` 选项来指定 `Node.js` 可执行文件的路径。

## 插件配置项

| 配置项名称<font color=red>显示红色为与官方配置有不同的地方</font>     | 描述                                                                                                                                                                                                                                                                                                                                                                                                          | 默认值                                                           |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| <font color=red>leetcode-problem-rating.hideSolved</font>             | 指定是否要隐藏已解决的问题                                                                                                                                                                                                                                                                                                                                                                                    | `false`                                                          |
| <font color=red>leetcode-problem-rating.bricksReviewDay</font>             | 设置x天后复习                  |  [1,4,7,14,28,60 ]                                                      |
| <font color=red>leetcode-problem-rating.showLocked` </font>           | 指定是否显示付费题目，只有付费账户才可以打开付费题目                                                                                                                                                                                                                                                                                                                                                          | `false`                                                          |
| <font color=red>leetcode-problem-rating.defaultLanguage</font>        | 指定答题时使用的默认语言，可选语言有：`bash`, `c`, `cpp`, `csharp`, `golang`, `java`, `javascript`, `kotlin`, `mysql`, `php`, `python`,`python3`,`ruby`, `rust`, `scala`, `swift`, `typescript`                                                                                                                                                                                                               | `N/A`                                                            |
| <font color=red>leetcode-problem-rating.useWsl</font>                 | 指定是否启用 WSL                                                                                                                                                                                                                                                                                                                                                                                              | `false`                                                          |
| <font color=red>leetcode-problem-rating.endpoint</font>               | 指定使用的终端，可用终端有：`leetcode`, `leetcode-cn`                                                                                                                                                                                                                                                                                                                                                         | <font color=red>leetcode.cn</font>                               |
| <font color=red>leetcode-problem-rating.workspaceFolder</font>        | 指定保存文件的工作区目录例如/home/${USERNAME}/leetcode, 现在会尝试从系统环境变量读取 USERNAME 对应的值, 例如环境变量中 USERNAME 是 ccagml,那么就会是/home/ccagml/leetcode 录                                                                                                                                                                                                                                  | `""`                                                             |
| <font color=red>leetcode-problem-rating.workspaceFolderList</font>    | 多个等待选择的工作区目录,如果 workspaceFolder 目录不存在,尝试从 workspaceFolderList 选取可用目录                                                                                                                                                                                                                                                                                                              | `["path1", "path2"]`                                             |
| <font color=red>leetcode-problem-rating.filePath</font>               | 指定生成题目文件的相对文件夹路径名和文件名。点击查看[更多详细用法](https://github.com/LeetCode-OpenSource/vscode-leetcode/wiki/%E8%87%AA%E5%AE%9A%E4%B9%89%E9%A2%98%E7%9B%AE%E6%96%87%E4%BB%B6%E7%9A%84%E7%9B%B8%E5%AF%B9%E6%96%87%E4%BB%B6%E5%A4%B9%E8%B7%AF%E5%BE%84%E5%92%8C%E6%96%87%E4%BB%B6%E5%90%8D)。 额外拓展\${yyyymmdd}对应年月日 20230720、\${timestamp}对应时间戳格式、\${cn_name}题目的中文名称 |                                                                  |
| <font color=red>leetcode-problem-rating.enableStatusBar</font>        | 指定是否在 VS Code 下方显示插件状态栏。 <font color=red>增加周赛分数据</font>                                                                                                                                                                                                                                                                                                                                 | `true`                                                           |
| <font color=red>leetcode-problem-rating.editor.shortcuts</font>       | 指定在编辑器内所自定义的快捷方式。可用的快捷方式有: `submit`, `test`, `star`, `solution`, `description`, <font color=red>case</font>, <font color=red>allcase</font> 。                                                                                                                                                                                                                                       | <font color=red>["submit, case, allcase, test, solution"]</font> |
| <font color=red>leetcode-problem-rating.enableSideMode</font>         | 指定在解决一道题时，是否将`问题预览`、`高票答案`与`提交结果`窗口集中在编辑器的第二栏。                                                                                                                                                                                                                                                                                                                        | `true`                                                           |
| <font color=red>leetcode-problem-rating.nodePath</font>               | 指定 `Node.js` 可执行文件的路径。如：C:\Program Files\nodejs\node.exe                                                                                                                                                                                                                                                                                                                                         | `node`                                                           |
| <font color=red>leetcode-problem-rating.showCommentDescription</font> | 指定是否要在注释中显示题干。                                                                                                                                                                                                                                                                                                                                                                                  | `false`                                                          |
| <font color=red>leetcode-problem-rating.useEndpointTranslation</font> | 是否显示翻译版本内容。                                                                                                                                                                                                                                                                                                                                                                                        | `true`                                                           |
| <font color=red>leetcode-problem-rating.sortStrategy</font>           | 排序的选项。<font color=red>Acceptance Rate (Ascending):通过率递增 Acceptance Rate (Descending):通过率递减 Score (Ascending):分数递增 Score (Descending):分数递减</font>                                                                                                                                                                                                                                      | <font color=red>None</font>                                      |
| <font color=red>leetcode-problem-rating.pickOneByRankRangeMin</font>  | 随机一题的最小浮动,随机一题最低分(你的竞赛分+本配置)。                                                                                                                                                                                                                                                                                                                                                        | <font color=red>50</font>                                        |
| <font color=red>leetcode-problem-rating.pickOneByRankRangeMax</font>  | 随机一题的最大浮动,随机一题最高分(你的竞赛分+本配置)。                                                                                                                                                                                                                                                                                                                                                        | <font color=red>150</font>                                       |
| <font color=red>leetcode-problem-rating.hideScore</font>              | 隐藏分数相关的题目。Score:隐藏有分数的题目, NoScore:隐藏没有分数的题目, ScoreRange:隐藏分数范围外的题目                                                                                                                                                                                                                                                                                                       | <font color=red>None</font>                                      |
| <font color=red>leetcode-problem-rating.useVscodeNode</font>          | 默认情况下使用 VsCode 自带 Node 环境,不需要额外安装 Node 环境                                                                                                                                                                                                                                                                                                                                                 | <font color=red>true</font>                                      |
| <font color=red>leetcode-problem-rating.answerDiffColor</font>        | 答案不同的地方上色                                                                                                                                                                                                                                                                                                                                                                                            | <font color=red>false</font>                                     |

## 更新日志

请参考[更新日志](CHANGELOG.md)

## 鸣谢

- 本插件基于[LeetCode-OpenSource](https://github.com/LeetCode-OpenSource)的[vscode-leetcode](https://github.com/LeetCode-OpenSource/vscode-leetcode/)
- 题目分数数据基于[zerotrac](https://github.com/zerotrac)的[leetcode_problem_rating](https://github.com/zerotrac/leetcode_problem_rating/)每周的更新
- 插件 debug 参考[wangtao0101](https://github.com/wangtao0101/vscode-debug-leetcode)
- 插件 使用谷歌浏览器复制为 cUrl 方式登录 参考[StevenJohnston](https://github.com/StevenJohnston/leetcode-cli)

<!-- ## 编译插件的相关信息

### 系统信息

```
PRETTY_NAME="Ubuntu 22.04 LTS"
NAME="Ubuntu"
VERSION_ID="22.04"
VERSION="22.04 (Jammy Jellyfish)"
VERSION_CODENAME=jammy
ID=ubuntu
ID_LIKE=debian
HOME_URL="https://www.ubuntu.com/"
SUPPORT_URL="https://help.ubuntu.com/"
BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/"
PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy"
UBUNTU_CODENAME=jammy
```

### node 版本

```
    v16.17.0
```

### npm 版本

```
    8.15.0
```

### 更新指令

```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
```

### 安装 node 依赖

```
    npm install
```

### 编译 ts 生成 js

```
    sudo apt install node-typescript
    tsc
```

### 打包生成 vscode 插件

#### 安装 vsce

```
    sudo npm i vsce -g
```

#### 执行打包

```
    vsce package
```

-->
