import Home from './Home/Home.js';
import Account from './Account/Account.js';
import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/account" element={<Account />} />
        </Routes>         
    </Router>
  );
}

export default App;