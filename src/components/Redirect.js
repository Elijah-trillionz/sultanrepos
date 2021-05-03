import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, Redirect } from 'react-router-dom';

export const RedirectUser = () => {
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState('');
  // github redirects to this page with a code and other params
  // the code will be redirected back to the server from here
  // get queries
  const useQuery = () => {
    return new URLSearchParams(useLocation().search);
  };
  const codeFromGithub = useQuery().get('code');
  const stateFromGithub = useQuery().get('state');

  const getDataFromCookie = (data) => {
    const allCookies = document.cookie.split(';');
    const state = allCookies.filter((cookie) => {
      return cookie.indexOf(data) !== -1;
    });

    return state.length >= 1 && state[0].trim().split('=')[1];
  };

  useEffect(() => {
    const state = getDataFromCookie('state');
    const exchangeCodeForToken = async () => {
      if (state !== stateFromGithub) {
        return setError('Signin has been compromised. Kindly relogin');
      }
      try {
        const res = await axios.get(
          `http://localhost:5000/api/auth/${codeFromGithub}`
        );
        if (res.data.errorMsg) {
          return setError(res.data.errorMsg);
        }

        const date = new Date(); // to expire after 5 years
        date.setTime(date.getTime() + 5 * 365 * 24 * 60 * 60 * 1000);
        document.cookie = `token=${
          res.data.token
        }; expires=${date.toUTCString()}`;
        setRedirect(true);
      } catch (err) {
        return setError('There has been a server error');
      }
    };
    exchangeCodeForToken();
  }, [codeFromGithub, stateFromGithub]);

  // check for token, check if user is already signed in
  useEffect(() => {
    const checkForToken = async () => {
      const token = getDataFromCookie('token');
      if (!token) {
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
      <div className='page-container'>
        <p>{error ? error : 'Redirecting you to dashboard'}</p>
      </div>
    </>
  );
};
