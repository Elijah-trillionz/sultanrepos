import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Redirect, Link } from 'react-router-dom';

export const Dashboard = () => {
  const [searchInput, setSearchInput] = useState('');
  const [redirect, setRedirect] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [privLoading, setPrivLoading] = useState(false);
  const [error, setError] = useState({});
  const [repoDetails, setRepoDetails] = useState([]);
  const [myRepoDetails, setMyRepoDetails] = useState([]);

  const getDataFromCookie = (data) => {
    const allCookies = document.cookie.split(';');
    const state = allCookies.filter((cookie) => {
      return cookie.indexOf(data) !== -1;
    });

    return state.length >= 1 && state[0].trim().split('=')[1];
  };

  // check for token, check if user is already signed in
  useEffect(() => {
    setLoading(true);
    const checkForToken = async () => {
      const token = getDataFromCookie('token');
      if (!token) {
        // if no token, redirect to login
        return setRedirect(true);
      }

      // if token, validate the token
      try {
        const res = await axios.post('http://localhost:5000/api/dashboard', {
          token,
        });

        if (!res.data.user.username) {
          return setRedirect(true);
        }

        setCurrentUser(res.data.user);
      } catch (err) {
        return setRedirect(true);
        // this error will not to be logged to the user
      }
      setLoading(false);
    };

    checkForToken();
  }, []);

  const loadSourceAPI = async () => {
    setLoading(true);
    try {
      const res = await axios.get(currentUser.repos_url);

      if (res.data.length <= 0) {
        return setError({
          msg: "You don't have any repository yet",
          src: 'modal',
        });
      }

      setMyRepoDetails(res.data);
    } catch (err) {
      console.log(err);
      setError({
        msg: 'Failed to load repositories',
        src: 'modal',
      });
    }
    setLoading(false);
  };

  const openModal = () => {
    loadSourceAPI();
    document.querySelector('.modal').classList.add('open');
    document.querySelector('.body-container').classList.add('active');
  };
  const closeModal = () => {
    document.querySelector('.modal').classList.remove('open');
    document.querySelector('.body-container').classList.remove('active');
  };

  const myRepoElementList = myRepoDetails.map((repo) => {
    const {
      id,
      name,
      license,
      language,
      stargazers_count,
      svn_url,
      owner,
    } = repo;

    return (
      <li key={id}>
        <a href={svn_url} target='_blank' rel='noreferrer'>
          {name}
        </a>
        <span className='star'>
          {stargazers_count} <i className='fas fa-star'></i>
        </span>
        <span className='language'>{language}</span>
        <span className='license'>{license ? license.name : 'No license'}</span>
        <span className='owner'>{owner.login}</span>
      </li>
    );
  });

  const repoElementList = repoDetails.map((repo) => {
    const {
      id,
      name,
      license,
      language,
      stargazers_count,
      svn_url,
      owner,
    } = repo;

    return (
      <li key={id}>
        <a href={svn_url} target='_blank' rel='noreferrer'>
          {name}
        </a>
        <span className='star'>
          {stargazers_count} <i className='fas fa-star'></i>
        </span>
        <span className='language'>{language}</span>
        <span className='license'>{license ? license.name : 'No license'}</span>
        <span className='owner'>{owner.login}</span>
      </li>
    );
  });

  // searching for user's or org's repositories
  const searchForRepositories = async () => {
    if (!searchInput) {
      return setError({
        msg: 'Search input cannot be empty',
        src: 'main',
      });
    }

    setPrivLoading(true);
    try {
      // first check for organisation
      const res = await axios.get(
        `https://api.github.com/orgs/${searchInput}/repos?per_page=100&sort=full_name`
      );
      if (res.data.length <= 0) {
        return setError({
          msg: 'There is no repository for this org',
          src: 'main',
        });
      }
      setRepoDetails(res.data);
    } catch (err) {
      // if it returns not found, we want to check for users
      if (err.response.status === 404) {
        return searchForUserRepositories(searchInput);
      }

      setError({
        msg: 'Failed to load repositories',
        src: 'main',
      });
    }
    setPrivLoading(false);
  };

  const searchForUserRepositories = async (searchInput) => {
    setPrivLoading(true);
    try {
      // first check for organisation
      const res = await axios.get(
        `https://api.github.com/users/${searchInput}/repos?per_page=100&sort=full_name`
      );
      if (res.data.length <= 0) {
        return setError({
          msg: 'There is no repository for this user',
          src: 'main',
        });
      }
      setRepoDetails(res.data);
    } catch (err) {
      setError({
        msg: 'This user does not exist (make sure you input username)',
        src: 'main',
      });
    }
    setPrivLoading(false);
  };

  const deleteToken = () => {
    const token = getDataFromCookie('token');
    const date = new Date(1970, 0, 0);
    document.cookie = `token=${token}; expires=${date.toUTCString()}`;
  };

  return (
    <>
      {redirect && <Redirect to='/' />}
      <div className='dashboard-container'>
        <div className='header'>
          <div className='title'>
            <h3>SultanRepos</h3>
          </div>
          <div className='user-logo'>
            {loading ? (
              <p>loading...</p>
            ) : (
              <img src={currentUser.avatar_url} alt='User avatar' />
            )}
          </div>
        </div>
        <div className='main-container'>
          <div className='main-content'>
            <div className='search-bar'>
              <input
                type='search'
                name='search'
                placeholder='Search User or Org'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button onClick={searchForRepositories}>
                <i className='fas fa-search'></i>
              </button>
            </div>
            <div className='repo-list'>
              <h2>Repositories</h2>
              <ul>
                {error.src === 'main' ? (
                  <p className='error'>{error.msg}</p>
                ) : privLoading ? (
                  <p>loading...</p>
                ) : (
                  repoElementList
                )}
              </ul>
            </div>
          </div>
          <div className='sidebar'>
            {loading ? (
              <p>loading...</p>
            ) : (
              <div>
                <p className='username'>{currentUser.username}</p>
                <ul>
                  <li>
                    <a href={currentUser.html_url}>Your Profile</a>
                  </li>
                  <li>
                    <p onClick={() => openModal()}>Your Repositories</p>
                  </li>
                  <li>
                    <p onClick={deleteToken}>
                      <Link to='/'>Logout</Link>
                    </p>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className='modal'>
          <div className='title'>
            <h2>Your repositories</h2>
          </div>
          <hr />
          <div className='modal-body repo-list'>
            {loading ? (
              <p>loading</p>
            ) : error.src === 'modal' ? (
              <p className='error'>{error.msg}</p>
            ) : (
              <ul>{myRepoElementList}</ul>
            )}
          </div>
        </div>
        <div className='body-container' onClick={closeModal}></div>
      </div>
    </>
  );
};
