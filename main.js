require('dotenv').config();

const express = require('express');
const app = express(); 

const setupSwagger = require('./swagger');
setupSwagger(app);

const userRouter = require('./users/user.route');
const connectToDb = require('./db/connectToDB');
const authRouter = require('./auth/auth.route');
const isAuth = require('./middlewares/isAuth.middleware');
const postRouter = require('./posts/posts.route');
const commentRouter = require('./comments/comment.route');
const cors = require('cors');
const { upload } = require('./config/clodinary.config');

app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

app.use('/users', isAuth, userRouter);
app.use('/posts', isAuth, postRouter);
app.use('/auth', authRouter);
app.use('/comments', commentRouter); 

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'Image upload failed' });
  }
  res.status(200).json({ url: req.file.path });
});

app.get('/', (req, res) => {
  res.send('hello world');
});


connectToDb()
  .then(() => {
    app.listen(3000, () => {
      console.log('Server running on http://localhost:3000');
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
  });
