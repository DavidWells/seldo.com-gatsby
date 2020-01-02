import React, {useState,useEffect} from "react"
import Layout from "../../components/layout"
import SEO from "../../components/seo"
import slugify from "@sindresorhus/slugify"

const AdminPage = ({pageContext}) => {

  const [user, setUser] = useState(false)
  const [postList, setPostList] = useState([])
  let [post,setPost] = useState({
    title: '',
    codename: '',
    body: ''
  })
  let [postResult,setPostResult] = useState('')
  const [originalCodename,setOriginalCodename] = useState(false)

  const updatePostList = async () => {
    let pRes = await fetch("/.netlify/functions/list_posts")
    let pJson = await pRes.json()
    setPostList(pJson.rows)
  }

  const fetchUserData = async () => {
    let uRes = await fetch("/.netlify/functions/read_userdata")
    let uJson = await uRes.json()
    setUser(uJson)
  }
  
  useEffect(() => {
    fetchUserData()
    updatePostList()
  }, [])    

  const selectPost = async (codename) => {
    let res = await fetch(`/.netlify/functions/get_post?codename=${codename}`)
    let json = await res.json()
    setPost(json)
    setOriginalCodename(json.codename)
  }

  const deletePost = async (event,draft) => {
    if (post.id) {
      let res = await fetch(
        `/.netlify/functions/delete_post`,
        {
          method: "POST",
          body: JSON.stringify(post)
        }
      )
      if (res.status === 200) {
        let result = await res.json()
        if (result.action === "deleted") {
          postResult = "Post deleted."
        } else {
          postResult = "Something happend but I dunno what?"
        }
        // this completely resets the editor because no spread "...post"
        post = {
          title: '',
          codename: '',
          body: ''
        }        
      }
    } else {
      postResult = "No post selected to delete"
    }
    setPost(post)
    setOriginalCodename(false)
    setPostResult(postResult)
    updatePostList()
  }

  const createOrUpdatePost = async (event,draft) => {
    let res = await fetch(
      `/.netlify/functions/save_post`,
      {
        method: "POST",
        body: JSON.stringify({
          ...post,
          draft,
          originalCodename
        })
      }
    )
    if (res.status === 200) {
      // TODO: display a preview
      let result = await res.json()
      if (result.action === "created") {
        postResult = "New post created!"
      } else if (result.action === "updated") {
        postResult = "Post updated!"
      } else {
        postResult = "Something good happend but I dunno what?"
      }
      post = result.post
    }
    setPost(post)
    setOriginalCodename(post.codename)
    setPostResult(postResult)
    updatePostList()
  }

  const handleChange = (event) => {
    if (event.target.name === "title") {
      post.codename = slugify(event.target.value)
    }

    setPost({      
      ...post,
      [event.target.name]: event.target.value
    })
  }

  return (  
    <Layout>
      <SEO title="Manage posts" />
      { user.username ? (
        <>
          <div className="postForm">
            <div className="postResult">{postResult}</div>
            <input type="hidden" name="id" value={post.id} />
            <p>Title: <input type="text" name="title" value={post.title} onChange={handleChange} /></p>
            <p>Slug: <input type="text" name="codename" value={post.codename} onChange={handleChange} /></p>
            <input type="hidden" name="original_codename" value={originalCodename} />
            <p><textarea name="body" value={post.body} onChange={handleChange} /></p>
            <p><button onClick={(e) => {createOrUpdatePost(e,true)}}>Save draft</button></p>
            <p><button onClick={(e) => {createOrUpdatePost(e,false)}}>Publish</button></p>
            <p><button onClick={(e) => {deletePost(e)}} disabled={post.id ? false : true}>Delete</button></p>
          </div>
          <div className="postList">
            <ul>
            {
              postList.map( (post) => {
                return (
                  <li key={post.codename}><button onClick={ () => {selectPost(post.codename)}}>{post.title}</button></li>
                )
              })
            }
            </ul>
          </div>
        </>
      ) : (
        <>
          <p>If you're not authed you won't see anything.</p>
          <p>Maybe you want to <a href="/login">log in</a>?</p>
        </>
      )}
    </Layout>
  )
}

export default AdminPage