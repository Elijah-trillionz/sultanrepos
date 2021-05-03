import './App.css';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { SignUpPage } from './components/SignUpPage';
import { NotFound } from './components/NotFound';
import { RedirectUser } from './components/Redirect';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <Router>
      <Switch>
        <Route exact path='/' component={SignUpPage} />
        <Route exact path='/redirect' component={RedirectUser} />
        <Route exact path='/dashboard' component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

export default App;
