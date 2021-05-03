import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Redirect } from 'react-router';

export const SignUpPage = () => {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState('');
  const [client_id, setClient_id] = useState('');
  const [redirect, setRedirect] = useState(false);

  const getDataFromCookie = (data) => {
    const allCookies = document.cookie.split(';');
    const state = allCookies.filter((cookie) => {
      return cookie.indexOf(data) !== -1;
    });

    return state.length >= 1 && state[0].trim().split('=')[1];
  };

  useEffect(() => {
    const getSecretsFromServer = async () => {
      setLoading(true);
      try {
        const res = await axios.get('http://localhost:5000/api/secrets');
        setState(res.data.state);
        const date = new Date();
        date.setTime(date.getTime() + 10 * 60 * 1000); // to expire in ten minutes
        document.cookie = `state=${
          res.data.state
        }; expires=${date.toUTCString()};`;
        setClient_id(res.data.client_id);
      } catch (err) {
        console.log(err);
        setLoading(false);
      }
      setLoading(false);
    };

    getSecretsFromServer();
  }, []);

  const sendRequestToGithub = () => {
    if (state && client_id) {
      window.location.href = `https://github.com/login/oauth/authorize/?client_id=${client_id}&state=${state}`;
    } else {
      setTimeout(sendRequestToGithub, 1000);
    }
  };

  // check for token, check if user is already signed in
  useEffect(() => {
    const checkForToken = async () => {
      const token = getDataFromCookie('token');
      if (!token) {
        // remain positioned
        return setRedirect(false);
      }

      const res = await axios.post('http://localhost:5000/api/dashboard', {
        token,
      });

      if (res.data.user.username) {
        return setRedirect(true);
      }
    };

    checkForToken();
  }, []);

  return (
    <>
      {redirect && <Redirect to='/dashboard' />}
      <div className='signup page-container'>
        {loading ? (
          <p>loading...</p>
        ) : (
          <p onClick={sendRequestToGithub}>
            <i className='fab fa-github'></i>
            <span>Sign Up with GitHub</span>
          </p>
        )}
      </div>
    </>
  );
};
