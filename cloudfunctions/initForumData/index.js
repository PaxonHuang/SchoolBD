// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  try {
    // 1. 初始化用户信息（如果不存在）
    const userResult = await db.collection('users').where({
      _openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      await db.collection('users').add({
        data: {
          _openid: openid,
          nickName: '测试用户',
          avatarUrl: '',
          createTime: new Date().toISOString()
        }
      })
    }
    
    // 2. 创建测试帖子
    const postResult = await db.collection('forum_posts').add({
      data: {
        title: '欢迎来到校园论坛',
        content: '这是一个测试帖子，你可以在这里点赞和评论。分享你的校园生活，交流学习经验，发布闲置物品等。',
        summary: '这是一个测试帖子，你可以在这里点赞和评论。',
        images: [],
        category: 'notice',
        categoryName: '通知',
        authorId: openid,
        likes: 0,
        likedBy: [],
        comments: 0,
        collectedBy: [],
        views: 0,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString()
      }
    })
    
    // 3. 创建更多测试帖子
    const testPosts = [
      {
        title: '寻找一起学习的小伙伴',
        content: '期末考试快到了，想找几个同学一起在图书馆复习，互相监督，共同进步！有意向的同学可以评论留言。',
        category: 'help',
        categoryName: '求助'
      },
      {
        title: '出售二手自行车',
        content: '毕业了，自行车便宜出售，九成新，骑行舒适，有需要的同学联系我。',
        category: 'idle',
        categoryName: '闲置'
      },
      {
        title: '食堂新菜品真好吃',
        content: '今天食堂推出了新菜品，味道超级棒，推荐大家去尝试！',
        category: 'chat',
        categoryName: '吐槽'
      }
    ]
    
    for (let post of testPosts) {
      await db.collection('forum_posts').add({
        data: {
          ...post,
          summary: post.content.substring(0, 50) + '...',
          images: [],
          authorId: openid,
          likes: Math.floor(Math.random() * 10),
          likedBy: [],
          comments: Math.floor(Math.random() * 5),
          collectedBy: [],
          views: Math.floor(Math.random() * 100),
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString()
        }
      })
    }
    
    // 4. 添加一条测试评论
    await db.collection('forum_comments').add({
      data: {
        postId: postResult._id,
        content: '这是第一条评论，欢迎大家一起交流！',
        images: [],
        authorId: openid,
        likes: 0,
        likedBy: [],
        createTime: new Date().toISOString()
      }
    })
    
    return {
      success: true,
      message: '论坛数据初始化成功',
      postId: postResult._id
    }
  } catch (err) {
    console.error('初始化论坛数据失败', err)
    return {
      success: false,
      error: err.toString()
    }
  }
}