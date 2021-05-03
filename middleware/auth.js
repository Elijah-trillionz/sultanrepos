const { default: axios } = require('axios');
// middleware
async function authenticateUser(req, res, next) {
  const { token } = req.body;

  try {
    if (!token) {
      return res.status(401).json({
        errorMsg: 'No token. Authorization denied.',
      });
    }
    const user = await validateUser(token);
    if (user.errorMsg) {
      return res.status(401).json({
        errorMsg: 'Authentication failed. Please retry',
      });
    }

    if (!user.login) {
      return res.status(401).json({
        errorMsg: 'Authentication failed. Token not valid.',
      });
    }

    const {
      login: username,
      email,
      avatar_url,
      id,
      repos_url,
      gists_url,
      html_url,
    } = user;

    req.user = {
      username,
      email,
      avatar_url,
      id,
      repos_url,
      gists_url,
      html_url,
    };

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({
      errorMsg: 'Authentication error',
    });
  }
}

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

module.exports = authenticateUser;
