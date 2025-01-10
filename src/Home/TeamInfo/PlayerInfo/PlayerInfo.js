import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './PlayerInfo.css';

const TeamInfo = () => {
    const { teamId, teamName, playerId, playerName } = useParams();
    const navigate = useNavigate();
    const [imageUrl, setImageUrl] = useState('');


    useEffect(() => {
        if (playerId){
            const player_current_headshot_url = `https://securea.mlb.com/mlb/images/players/head_shot/${playerId}.jpg`;
            setImageUrl(player_current_headshot_url);
        }
    }, [playerId])

    return (
        <div className="background">
            <div className="background-player-name-and-headshot-container">
                <div className="background-player-headshot">
                    <img
                        className="player-headshot"
                        src={imageUrl}
                        alt="Player Headshot"
                    />
                </div>
                <div className="background-player-name">
                    <h3> {`${playerName}`} </h3>
                </div>
            </div>
            <div className="background-player-container">
                <div className="background-player-info">
                    <p>Player Info Here</p>
                </div>
            </div>
            <div className='stat-preview-container'>
                <p>Stats here</p>

            </div>
        </div>
    );
};

export default TeamInfo;