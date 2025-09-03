# 论坛模块图标

本目录用于存放论坛模块相关的图标资源。

## 必需图标

请将以下图标放置在此目录中：

1. `forum-active.png` - 底部Tab栏选中状态的论坛图标
2. `forum-inactive.png` - 底部Tab栏未选中状态的论坛图标
3. `like.png` - 点赞图标（未点赞状态）
4. `like-active.png` - 点赞图标（已点赞状态）
5. `comment.png` - 评论图标
6. `share.png` - 分享图标
7. `collect.png` - 收藏图标（未收藏状态）
8. `collect-active.png` - 收藏图标（已收藏状态）
9. `back.png` - 返回按钮图标
10. `reply.png` - 回复图标
11. `empty-comment.png` - 空评论状态图标
12. `not-found.png` - 内容不存在图标
13. `default-avatar.png` - 默认头像图标

## 图标规范

- 底部Tab栏图标尺寸：48px × 48px
- 功能图标尺寸：32px × 32px
- 状态图标尺寸：160px × 160px
- 图标颜色：
  - 主色调：#3A7BF8（蓝色）
  - 未选中/未激活状态：#999999（灰色）
  - 警告/错误状态：#FF3B30（红色）
  - 成功/完成状态：#4CD964（绿色）

## 使用说明

在WXML文件中使用图标的示例：

```xml
<image class="icon" src="/assets/icons/forum/forum-active.png" mode="aspectFit"></image>
```

请确保路径正确，以 `/assets/icons/forum/` 开头。