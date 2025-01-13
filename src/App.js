import Home from './Home/Home.js';
import Account from './Account/Account.js';
import './App.css';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import TeamInfo from './Home/TeamInfo/TeamInfo';
import PlayerInfo from './Home/TeamInfo/PlayerInfo/PlayerInfo';
import MLBSelector from './SelectFavorites/MLBSelector.js';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Home/>} />
            <Route path="/account" element={<Account />} />
            <Route path="/team/:teamId/:teamName" element={<TeamInfo />} />
            <Route path="/team/:teamId/:teamName/:playerId/:playerName" element={<PlayerInfo />} />
            <Route path="/selectFavorites" element={<MLBSelector />} />
        </Routes>         
    </Router>
  );
}

export default App;