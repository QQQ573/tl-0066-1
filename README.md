# 快闪店理货员 - Flash Store Inventory

一款基于 Phaser 3 + TypeScript 开发的俯视角理货小游戏。

## 游戏介绍

快闪店闭店前要把端盒拆成单盒上架，实习生常把 Labubu 与 DIMOO 混进同一陈列槽。作为理货员，你需要：

- 将传送带送来的混装端盒拖入拆盒区
- 点击拆盒，散出 4-6 个单盒图标
- 将单盒拖入对应系列的槽位（槽位颜色与系列绑定）
- 在 8 分钟内完成 12 批拆摆
- 错放扣陈列分，连续 2 次错放触发整批返工（耗时长但不额外扣分）
- 第三关加入隐藏款规则：隐藏款拖入常规槽位直接失败本批
- **高峰催单波次**：特定批次触发催单，需在倒计时内完成指定系列的入槽数量，达标奖励，超时惩罚

## 技术栈

- **框架**: Phaser 3.70+
- **语言**: TypeScript 5.3+
- **构建工具**: Vite 5.0+
- **部署**: Docker + Nginx

## 快速开始

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### 生产构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

### Docker 部署

```bash
# 使用 docker-compose 构建并启动
docker-compose up -d --build
```

访问 http://localhost:8080

```bash
# 停止服务
docker-compose down
```

## 游戏操作

- **鼠标/触控拖拽**: 将端盒从传送带拖到拆盒区
- **点击**: 在拆盒区点击端盒进行拆盒
- **拖拽**: 将散出的单盒拖入对应颜色的槽位

## 关卡 JSON 配置说明

关卡配置文件位于 `src/config/levels/level*.json`

### 顶层字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `levelId` | `number` | 关卡唯一标识 | `1` |
| `levelName` | `string` | 关卡名称 | `"新手训练日"` |
| `totalBatches` | `number` | 总批次数 | `12` |
| `gameDuration` | `number` | 游戏时长（秒） | `480` |
| `interferenceRatio` | `number` | 干扰盒比例（0-1） | `0.3` |
| `hasHiddenRule` | `boolean` | 是否启用隐藏款规则 | `false` |
| `series` | `Series[]` | 系列配置数组 | - |
| `slots` | `Slot[]` | 槽位配置数组 | - |
| `conveyorBelt` | `ConveyorBelt` | 传送带配置 | - |
| `unpackZone` | `UnpackZone` | 拆盒区配置 | - |

### Series（系列配置）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | `string` | 系列唯一 ID | `"LABUBU"` |
| `name` | `string` | 系列显示名称 | `"Labubu"` |
| `color` | `number` | 系列主题色（十进制） | `16739229` (0xff6b9d) |
| `borderColor` | `number` | 系列边框色（十进制） | `16728193` (0xff4081) |
| `isHidden` | `boolean` | 是否为隐藏款系列 | `false` |

**颜色值说明**: 使用十进制表示十六进制颜色。例如：
- 粉色 `#ff6b9d` = `0xff6b9d` = `16739229`
- 蓝色 `#4fc3f7` = `0x4fc3f7` = `5227511`

### Slot（槽位配置）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | `string` | 槽位唯一 ID | `"slot-1"` |
| `seriesId` | `string` | 绑定的系列 ID | `"LABUBU"` |
| `x` | `number` | 槽位左上角 X 坐标 | `200` |
| `y` | `number` | 槽位左上角 Y 坐标 | `520` |
| `width` | `number` | 槽位宽度 | `80` |
| `height` | `number` | 槽位高度 | `80` |
| `isHidden` | `boolean` | 是否为隐藏款隔离槽 | `false` |

### ConveyorBelt（传送带配置）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `x` | `number` | 传送带左上角 X 坐标 | `0` |
| `y` | `number` | 传送带左上角 Y 坐标 | `200` |
| `width` | `number` | 传送带宽度 | `1280` |
| `speed` | `number` | 传送带移动速度（像素/秒） | `80` |

### UnpackZone（拆盒区配置）

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `x` | `number` | 拆盒区左上角 X 坐标 | `440` |
| `y` | `number` | 拆盒区左上角 Y 坐标 | `300` |
| `width` | `number` | 拆盒区宽度 | `400` |
| `height` | `number` | 拆盒区高度 | `180` |

### 配置示例

```json
{
  "levelId": 1,
  "levelName": "新手训练日",
  "totalBatches": 12,
  "gameDuration": 480,
  "interferenceRatio": 0.3,
  "hasHiddenRule": false,
  "series": [
    {
      "id": "LABUBU",
      "name": "Labubu",
      "color": 16739229,
      "borderColor": 16728193
    },
    {
      "id": "DIMOO",
      "name": "Dimoo",
      "color": 5227511,
      "borderColor": 16321
    }
  ],
  "slots": [
    {
      "id": "slot-1",
      "seriesId": "LABUBU",
      "x": 200,
      "y": 520,
      "width": 80,
      "height": 80
    }
  ],
  "conveyorBelt": {
    "x": 0,
    "y": 200,
    "width": 1280,
    "speed": 80
  },
  "unpackZone": {
    "x": 440,
    "y": 300,
    "width": 400,
    "height": 180
  }
}
```

## 游戏规则详解

### 计分规则

- 正确放置: +100 分
- 错误放置: -50 陈列分
- 连续 2 次错误: 触发整批返工（耗时 30 秒，不额外扣分）
- 隐藏款放错常规槽位: 本批直接失败

### 关卡特色

- **第 1 关 (新手训练日)**: 2 个系列（Labubu + Dimoo），30% 干扰率，无隐藏款
- **第 2 关 (繁忙周末)**: 3 个系列（Labubu + Dimoo + Molly），50% 干扰率，传送带提速
- **第 3 关 (隐藏款警戒)**: 5 个系列（含隐藏款），60% 干扰率，隐藏款必须放入隔离槽

### 结算统计

- 完成/失败批次数
- 返工次数
- 平均拆摆秒数
- 总错放次数
- 最终得分 & 陈列分
- 最易混系列排行榜（Top 5）

## 项目结构

```
├── src/
│   ├── config/
│   │   ├── constants.ts          # 游戏常量
│   │   └── levels/
│   │       ├── level1.json       # 关卡1配置
│   │       ├── level2.json       # 关卡2配置
│   │       └── level3.json       # 关卡3配置
│   ├── gameobjects/
│   │   ├── EndBoxGameObject.ts   # 端盒游戏对象
│   │   └── SingleBoxGameObject.ts # 单盒游戏对象
│   ├── scenes/
│   │   ├── BootScene.ts          # 启动场景
│   │   ├── MenuScene.ts          # 菜单场景
│   │   ├── GameScene.ts          # 游戏主场景
│   │   └── ResultScene.ts        # 结算场景
│   ├── types/
│   │   └── game.ts               # TypeScript 类型定义
│   ├── utils/
│   │   └── levelLoader.ts        # 关卡加载与工具函数
│   ├── main.ts                   # 游戏入口
│   └── vite-env.d.ts             # Vite 环境声明
├── Dockerfile                    # Docker 镜像构建
├── docker-compose.yml            # Docker Compose 配置
├── nginx.conf                    # Nginx 配置
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## License

MIT
