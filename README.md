# 校园跑腿小程序 - 论坛模块

## 项目概述

本项目是校园跑腿小程序的论坛模块重构，在原有的底部Tab导航栏（首页、订单、我的）基础上，新增"论坛"模块，为用户提供交流互动的平台。

## 技术栈

- 微信小程序原生开发
- 微信云开发（数据库、云函数、云存储）
- WeUI组件库

## 目录结构

```
miniprogram/
├── assets/                  # 静态资源
│   └── icons/
│       └── forum/           # 论坛模块图标
├── components/              # 自定义组件
│   └── forum/               # 论坛相关组件
│       ├── comment-item/    # 评论项组件
│       └── post-card/       # 帖子卡片组件
├── pages/                   # 页面
│   ├── forum/               # 论坛主页
│   ├── post-detail/         # 帖子详情页
│   └── publish-post/        # 发布帖子页
└── templates/               # 模板
    └── forum-templates.wxml # 论坛相关模板

cloudfunctions/
├── addComment/              # 添加评论云函数
├── addPost/                 # 发布帖子云函数
├── getComments/             # 获取评论列表云函数
├── getPostDetail/           # 获取帖子详情云函数
├── getPostList/             # 获取帖子列表云函数
└── likePost/                # 点赞帖子云函数
```

## 功能模块

### 1. 论坛主页

- 帖子列表展示（支持分页加载）
- 分类标签栏（全部、学习、生活、交友等）
- 悬浮式发帖按钮
- 帖子搜索功能
- 排序方式切换（最新、最热）

### 2. 帖子详情页

- 帖子内容展示
- 评论列表展示（支持分页加载）
- 点赞、收藏、分享功能
- 评论输入框（支持回复特定评论）

### 3. 发布帖子页

- 标题输入框
- 内容输入框
- 图片上传功能（最多9张）
- 分类选择功能

## 数据结构

### 帖子表（forum_posts）

| 字段名 | 类型 | 说明 |
|-------|------|------|
| _id | string | 帖子ID（自动生成） |
| title | string | 帖子标题 |
| content | string | 帖子内容 |
| images | array | 图片列表 |
| category | string | 分类ID |
| categoryName | string | 分类名称 |
| authorId | string | 作者ID |
| createTime | string | 创建时间 |
| updateTime | string | 更新时间 |
| likes | number | 点赞数 |
| comments | number | 评论数 |
| views | number | 浏览量 |
| likedBy | array | 点赞用户ID列表 |
| collectedBy | array | 收藏用户ID列表 |

### 评论表（forum_comments）

| 字段名 | 类型 | 说明 |
|-------|------|------|
| _id | string | 评论ID（自动生成） |
| postId | string | 帖子ID |
| content | string | 评论内容 |
| images | array | 图片列表 |
| authorId | string | 作者ID |
| createTime | string | 创建时间 |
| likes | number | 点赞数 |
| likedBy | array | 点赞用户ID列表 |
| replyTo | string | 回复的评论ID（可选） |

## 云函数说明

### getPostList

获取帖子列表，支持分类筛选、关键词搜索和排序。

**参数：**
- category: 分类（可选）
- pageNum: 页码，从0开始
- pageSize: 每页数量
- sortBy: 排序方式（new=最新, hot=最热）
- keyword: 搜索关键词（可选）

### getPostDetail

获取帖子详情，包括作者信息、点赞状态等。

**参数：**
- postId: 帖子ID

### addPost

发布新帖子，包含内容安全检查。

**参数：**
- title: 帖子标题
- content: 帖子内容
- images: 图片列表（可选）
- category: 分类
- categoryName: 分类名称

### getComments

获取帖子评论列表，支持分页。

**参数：**
- postId: 帖子ID
- pageNum: 页码，从0开始
- pageSize: 每页数量

### addComment

添加评论，支持回复特定评论。

**参数：**
- postId: 帖子ID
- content: 评论内容
- images: 图片列表（可选）
- replyTo: 回复的评论ID（可选）

### likePost

点赞/取消点赞帖子。

**参数：**
- postId: 帖子ID

## 使用说明

1. 在微信开发者工具中导入项目
2. 开通云开发并创建相应的数据库集合
3. 上传并部署云函数
4. 在云存储中创建论坛图片目录
5. 运行项目，进入论坛模块

## 注意事项

1. 首次使用需要登录微信账号
2. 图片上传有大小限制，建议压缩后上传
3. 内容发布会进行安全检查，违规内容将被拦截

## 未来计划

1. 增加用户主页功能
2. 增加帖子举报功能
3. 增加话题标签功能
4. 增加帖子置顶功能
5. 增加管理员后台功能