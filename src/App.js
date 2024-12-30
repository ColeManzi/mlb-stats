import Home from './Home/Home.js';
import Account from './Account/Account.js';
import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TeamInfo from './Home/TeamInfo/TeamInfo';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/account" element={<Account />} />
            <Route path="/team/:teamId/:teamName" element={<TeamInfo />} />
        </Routes>         
    </Router>
  );
}

export default App;