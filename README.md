# 豆谱 DOUPU

把照片变成真正可以照着拼的 Hama Midi 拼豆效果图和图纸。

豆谱完全在浏览器本地处理图片：选择 JPG、PNG、WebP 等浏览器支持的图片，调整图案宽度、颜色数量、抖动和白底处理，随后下载带物料清单的 PDF 或图纸 PNG。

## 功能

- 使用 Hama 官方色号组织材料清单，按品牌、色号、名称和颗数统计
- 通过 CIEDE2000 感知色差匹配实体色盘，并支持 Floyd–Steinberg 抖动
- 效果图模拟单颗拼豆；图纸包含格内符号和每 5 格加粗辅助线
- PDF 自动按 32 × 42 格切成多张 A4 比例页面，并附总览和备料清单
- 图片在本机解码并由 Web Worker 处理，不上传到服务器
- 支持拖放、粘贴和文件选择；输入最大 40 MB，长边会在本地压缩至 2048 px
- 桌面与移动端自适应

## 本地开发

```bash
npm install
npm run dev
```

检查与构建：

```bash
npm test
npm run build
```

## 技术结构

- React 19 + TypeScript + Vite
- Web Worker 负责缩图后的调色板筛选、色差匹配和抖动
- Canvas 负责效果图、图纸和导出画布
- jsPDF 在需要导出时动态加载；上传和导出均无需后端
- GSAP 仅用于方法说明的轻量滚动编排

## 色号说明

材料编号依据 Hama 发布的 2026 Mini / Midi 色卡整理。代码中的 HEX 只用于屏幕预览，并不代表官方色值；实物颜色会受到材质、批次、光线和屏幕校准影响，购买前请对照实体色卡。

研究与设计出处见 [REFERENCES.md](./REFERENCES.md)。

## License

[MIT](./LICENSE)
