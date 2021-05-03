const express = require('express');
const dotenv = require('dotenv');
const config = require('config');
const cors = require('cors');
const { default: axios } = require('axios');
const authenticateUser = require('./middleware/auth');

dotenv.config({ path: './config/config.env' });

const app = express();

// body parser
app.use(express.json());

// cors
app.use(cors());
// heroku setup
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// routes
// @desc:    ?send state and client_id to client
// @route:   ?/secrets
// @access:  ?public
app.get('/api/secrets', (req, res) => {
  res.json({
    state: config.get('state'),
    client_id: config.get('client_id'),
  });
});
// to make it safe

// @desc:    ?exchange code for token and validate user with token
// @route:   ?/auth/:code
// @access:  ?public
app.get('/api/auth/:code', async (req, res) => {
  const { code } = req.params;

  try {
    const token = await getAuthToken(code);

    if (token.errorMsg) {
      return res.status(token.status).json({
        errorMsg: token.errorMsg,
      });
    }

    // use to validate token
    const validatedUser = await validateUser(token);

    if (validatedUser.errorMsg) {
      return res.status(validatedUser.status).json({
        errorMsg: validatedUser.errorMsg,
      });
    }

    res.json({
      token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      errorMsg: 'Server error',
    });
  }
});

// @desc:    ?sign in user with token
// @route:   ?/dashboard
// @access:  ?private
app.post('/api/dashboard', authenticateUser, (req, res) => {
  const {
    username,
    email,
    id,
    avatar_url,
    repos_url,
    gists_url,
    html_url,
  } = req.user;

  res.json({
    user: {
      username,
      email,
      id,
      avatar_url,
      repos_url,
      gists_url,
      html_url,
    },
  });
});

// @desc:    ?sign in user with token
// @route:   ?/repos:user
// @access:  ?private
app.get('/api/repos:user', authenticateUser, (req, res) => {
  const { user } = req.params;

  try {
    // send request to github api for a user repos
  } catch (err) {
    console.log(err);
    res.status(500).json({
      errorMsg: 'Server error',
    });
  }
});

const getAuthToken = async (code) => {
  try {
    const res = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: config.get('client_id'),
        client_secret: config.get('client_secret'),
        code,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (res.data.error) {
      return {
        errorMsg: res.data.error_description,
        status: 401,
      };
    }

    return res.data.access_token;
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      errorMsg: 'Server error',
    };
  }
};

const validateUser = async (token) => {
  try {
    const res = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });

    if (!res.data.login) {
      return {
        errorMsg: 'Authentication failed. Token not valid.',
        status: 401,
      };
    }

    return res.data;
  } catch (err) {
    console.log(err);
    return {
      status: 500,
      errorMsg: 'Server error 2',
    };
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server running on port ${PORT}`));

// app
// server makes a request to github to get code
// github redirects to client with code
// server exchange code for token
// server signs in the user
// server also make requests to get repositories for authenticated users only
