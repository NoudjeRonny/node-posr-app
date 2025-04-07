import express from 'express';
import { protectedRoute } from '../middlewares/authMiddleware.js';
import multer from 'multer';
import Path from 'path';
import { title } from 'process';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import { unlink } from 'fs';
const router = express.Router();

// set up storage egine using multer
const storage = multer.diskStorage({
  destination: function(req,file,cb){
    cb(null, 'uploads/');
  },
  filename: function(req,file,cb){
    cb(null,Date.now()+ Path.extname(file.originalname));
  }
});

// initize upload variables with the storage engine
const upload = multer({storage: storage})


// route for home page
  router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = 2;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const totalPosts = await Post.countDocuments().exec();
  const posts = await Post.find()
      .populate({ path: 'user', select: '-password' })
      .sort({ _id: -1 })
      .limit(limit)
      .skip(startIndex)
      .exec();

  const pagination = {
      currentPage: page,
      totalPage: Math.ceil(totalPosts / limit),
      hasNextPage: endIndex < totalPosts,
      hasPrevPage: startIndex > 0,
      nextPage: page + 1,
      prevPage: page - 1
  };

  res.render('index', { title: 'HOME PAGE', active: 'home', posts, pagination });
  });

// route for my post
router.get('/my-posts',protectedRoute, async(req,res)=>{

    try {
        const userId = req.session.user._id;
        const user = await User.findById(userId).populate('posts');
        if(!user){
            req.flash('error','User not  foud!');
           return res.redirect('/');
        }
res.render('posts/my-post',{
    title:'MY POST',
    active: 'my_posts',
    posts: user.posts
});


    } catch (error) {
        console.error(error);
        req.flash('error','something when wrong when fetching the post');
        res.redirect('/my-posts');
    }
});
// route for create post
router.get('/create-post',protectedRoute,(req,res)=>{
res.render('posts/create-post',{title:'CREATE POST', active:'create_post'});
});
// edit post
router.get('/edit-post/:id',protectedRoute, async(req,res)=>{
  
  try {
  const postid = req.params.id;
  const post = await Post.findById(postid);

  if(!post){
  req.flash('error','Post not found');
  return res.redirect('/my-posts');
  }

    res.render('posts/edit-post',{title:'Edit Post', active:'edit_post',post});
    
  } catch (error) {
    console.error(error);
    req.flash('error','somethig went wrong');
    res.redirect('/my-posts');
  }
});

// edit post route
router.post('/update-post/:id',protectedRoute,upload.single('image'), async(req,res)=>{
try {
  const postid = req.params.id;
  const post = await Post.findById(postid);

  if(!post){
    req.flash('error','Post not found');
    return res.redirect('/my-posts');
    }

    post.title = req.body.title;
    post.content = req.body.content;
    post.slug = req.body.title.replace(/\s+/g, '-').toLowerCase();

    if(req.file){
     unlink(Path.join(process.cwd(),'uploads', post.image), (err)=>{
      if(err){
        console.error(err);
        req.flash('error','path coulnot be found');
      }
     });
      post.image = req.file.filename;
    }
   await post.save();
   req.flash('success','post Updated successfully');
   res.redirect('/my-posts');

} catch (error) {
  console.error(error);
  req.flash('error','somethig went wrong');
  res.redirect('/my-posts');
}
});

// route for view post using slug
router.get('/post/:slug', async (req, res) => {
  try {
      const postSlug = req.params.slug;
      const post = await Post.findOne({ slug: postSlug }).populate('user'); // Find post by slug

      if (!post) {
          req.flash('error', 'Post not found');
          return res.redirect('/my-posts');
      }

      res.render('posts/view-post', {
          title: "View Post",
          active: 'view_post',
          post // pass the post data to the view
      });
  } catch (error) {
      console.error(error);
      req.flash('error', 'Something went wrong');
      res.redirect('/my-posts');
  }
});

// router for handling create new post
router.post('/create-post',protectedRoute,upload.single('image'), async(req,res)=>{

    try {
        
    const {title,content}= req.body;
    const image = req.file.filename;
    const slug = title.replace(/\s+/g, '-').toLowerCase();
    const user = await User.findById(req.session.user._id);

    // create new post
    const post = new Post({title,slug,content,image,user});

    // save post in user post array
    await User.updateOne({_id:req.session.user._id},{$push:{posts:post._id}}), //push to push in the postID field
    await post.save();
    req.flash('success','post created successfully');
    res.redirect('/my-posts');
    } catch (error) {
        console.error(error);
        req.flash('error','something went wrong');
        res.redirect('/create-post');
    }
})

// hanadling delete post

router.post('/delete-post/:id',protectedRoute,async(req, res)=>{
  console.log("delete post  service is been getting ")
try {
  const postId = req.params.id;
  const post = await Post.findById(postId);
  if(!post){
    req.flash("error","Post not found");
    return res.redirect('/my-posts');
  }

  await User.updateOne({_id:req.session.user._id}, {$pull: {posts: postId}});
  await Post.deleteOne({_id:postId});

  unlink(Path.join(process.cwd(), 'uploads') + '/' + post.image, (err)=>{
    if(err){
      console.error(err);
    }
  });

  req.flash("success","Post Successfully Deleted!");
  res.redirect("/my-posts");



} catch (error) {
  console.error(error);
  req.flash("error","Something went Wrong!");
  res.redirect('/my-posts');
}
});


export default router;