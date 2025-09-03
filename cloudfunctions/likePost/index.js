// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

/**
 * 点赞/取消点赞帖子
 * @param {Object} event - 请求参数
 * @param {string} event.postId - 帖子ID
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  // 解构参数
  const { postId } = event
  
  try {
    // 查询帖子信息
    const postResult = await db.collection('forum_posts').doc(postId).get()
    const post = postResult.data
    
    // 检查用户是否已点赞
    const likedBy = post.likedBy || []
    const isLiked = likedBy.includes(openid)
    
    let updateData = {}
    let liked = false
    
    if (isLiked) {
      // 如果已点赞，取消点赞
      updateData = {
        likes: _.inc(-1),
        likedBy: _.pull(openid)
      }
      liked = false
    } else {
      // 如果未点赞，添加点赞
      updateData = {
        likes: _.inc(1),
        likedBy: _.addToSet(openid)
      }
      liked = true
    }
    
    // 更新帖子点赞信息
    await db.collection('forum_posts').doc(postId).update({
      data: updateData
    })
    
    // 查询更新后的点赞数
    const updatedPostResult = await db.collection('forum_posts').doc(postId).get()
    const updatedPost = updatedPostResult.data
    
    return {
      success: true,
      liked,
      likes: updatedPost.likes
    }
  } catch (err) {
    console.error('点赞操作失败', err)
    return {
      success: false,
      error: err
    }
  }
}