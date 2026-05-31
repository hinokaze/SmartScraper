# 图标文件说明

## 当前配置

✅ 已配置 SVG 矢量图标 (`icon.svg`)

- **位置**: `extension/assets/icon.svg`
- **格式**: SVG (可缩放矢量图形)
- **优势**: 单一文件支持所有尺寸，清晰度高

## 自定义图标

如需替换为自定义图标：

### 方案 A: 使用 SVG (推荐)
1. 准备 128x128 的 SVG 文件
2. 替换 `assets/icon.svg`
3. 重新构建：`npm run build`

### 方案 B: 使用 PNG
1. 准备以下尺寸的 PNG 图片：
   - 16x16
   - 32x32
   - 48x48
   - 128x128
2. 放置在 `assets/` 目录下（如 `icon-16.png`, `icon-32.png` 等）
3. 修改 `manifest.json` 中的图标路径
4. 重新构建：`npm run build`

## 在线工具

- SVG 编辑：https://www.figma.com/
- PNG 转 ICO：https://www.icoconverter.com/
