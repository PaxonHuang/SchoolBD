// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

/**
 * 收藏/取消收藏帖子
 * @param {Object} event - 请求参数
 * @param {string} event.postId - 帖子ID
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { postId } = event
  
  // 参数校验
  if (!postId) {
    return {
      success: false,
      error: '帖子ID不能为空'
    }
  }
  
  try {
    // 查询帖子是否存在
    const postResult = await db.collection('forum_posts').doc(postId).get()
    
    if (!postResult.data) {
      return {
        success: false,
        error: '帖子不存在'
      }
    }
    
    const post = postResult.data
    const collectedBy = post.collectedBy || []
    const isCollected = collectedBy.includes(openid)
    
    let updateData = {}
    let collected = false
    
    if (isCollected) {
      // 取消收藏
      updateData.collectedBy = _.pull(openid)
      collected = false
    } else {
      // 收藏
      updateData.collectedBy = _.addToSet(openid)
      collected = true
    }
    
    // 更新帖子收藏状态
    await db.collection('forum_posts').doc(postId).update({
      data: updateData
    })
    
    // 如果收藏，添加到用户收藏列表
    if (collected) {
      try {
        await db.collection('user_collections').add({
          data: {
            userId: openid,
            postId: postId,
            createTime: new Date().toISOString(),
            type: 'forum_post'
          }
        })
      } catch (err) {
        console.log('添加用户收藏记录失败', err)
      }
    } else {
      // 取消收藏，从用户收藏列表中删除
      try {
        await db.collection('user_collections').where({
          userId: openid,
          postId: postId,
          type: 'forum_post'
        }).remove()
      } catch (err) {
        console.log('删除用户收藏记录失败', err)
      }
    }
    
    return {
      success: true,
      collected
    }
  } catch (err) {
    console.error('收藏操作失败', err)
    return {
      success: false,
      error: err
    }
  }
}