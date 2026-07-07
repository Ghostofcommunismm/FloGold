# Vue3 + Vite + Capacitor Android App

一个使用 **Vue 3**、**Vite** 和 **Capacitor** 构建的 Android 应用项目。

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架
- **Vite** - 下一代前端构建工具
- **Capacitor** - 跨平台原生运行时
- **TypeScript** - 类型安全的 JavaScript 超集

## 项目结构

```
├── android/                 # Android 原生项目
├── public/                  # 静态资源
├── src/                     # Vue 源代码
│   ├── assets/             # 资源文件
│   ├── components/         # Vue 组件
│   ├── App.vue             # 根组件
│   └── main.ts             # 入口文件
├── capacitor.config.ts     # Capacitor 配置
├── index.html              # HTML 入口
├── package.json            # 项目配置
└── tsconfig.json           # TypeScript 配置
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

启动 Vite 开发服务器（支持热更新）：

```bash
npm run dev
```

### 构建 Android 应用

1. 构建前端资源：
```bash
npm run build
```

2. 同步到 Android 项目：
```bash
npx cap sync
```

3. 在 Android Studio 中打开项目：
```bash
npx cap open android
```

或使用一键命令：

```bash
npm run android
```

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run cap:sync` | 同步到原生平台 |
| `npm run cap:open` | 打开 Android Studio |
| `npm run cap:run` | 直接运行到设备/模拟器 |
| `npm run android` | 构建 + 同步 + 打开 Android Studio |

## Capacitor 常用命令

```bash
# 添加平台
npx cap add android

# 同步 web 资源到原生项目
npx cap sync

# 打开 IDE
npx cap open android

# 运行应用（需要连接设备或启动模拟器）
npx cap run android
```

## 开发工作流

1. 使用 `npm run dev` 进行前端开发
2. 修改代码后，浏览器会自动热更新
3. 准备测试时，执行 `npm run build && npx cap sync`
4. 使用 `npx cap run android` 或通过 Android Studio 运行

## 注意事项

- 确保已安装 [Android Studio](https://developer.android.com/studio)
- 首次使用需要配置 Android SDK 和环境变量
- 如需添加其他 Capacitor 插件，请参考 [Capacitor 文档](https://capacitorjs.com/docs/plugins)
