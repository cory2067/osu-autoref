import React from 'react';
const Banchojs = require('bancho.js');
const client = new Banchojs.BanchoClient(require("../config.json"));
const Nodesu = require('nodesu');
const api = new Nodesu.Client(require('../config.json').apiKey);

const match = { //split out into some config file or something
    refs: ['Cychloryn'],
    teams: [{name: 'meme team', members: ['Cychloryn']}, {name: 'flubber conquest', members: []}]
};

let beatmaps = [{code: "DT1", id: 1262832, mod: 'DT'}, {code: "FM2", id: 1378285, mod: 'freemod'}, {code: "NM1", id: 1385398, mod: 'nomod'}];
let channel;
let lobby;

function Chat(props) {
    return (<div>
        <textarea rows="20" cols="40" readOnly value={props.value}> </textarea>
        <br />
        <input type="text" onKeyPress={props.handleKey}></input>
    </div>);
}

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            chat: ""
        }

        client.connect().then(async () => {
            console.log("We're online!");
        	channel = await client.createLobby("O!RT: " + match.teams[0].name + " vs " + match.teams[1].name);
        	lobby = channel.lobby;
        	const password = Math.random().toString(36).substring(8);
        	await Promise.all([lobby.setPassword(password), lobby.setMap(1262832)]);
        	console.log("Lobby created! Name: "+lobby.name+", password: "+password);
        	console.log("Multiplayer link: https://osu.ppy.sh/mp/"+lobby.id);

            channel.on("message", (msg) => {
                this.setState({
                    chat: this.state.chat + msg.user.ircUsername + ": " + msg.message + "\n"
                });
            })
        });
    }
    handleKey(e) {
        if (e.key === 'Enter') {
            channel.sendMessage(e.target.value);
            e.target.value = "";
        }
    }
    async disconnect() {
        console.log('closing')
        await lobby.closeLobby();
        await client.disconnect();
        console.log('done!~')
    }
    render() {
        return (<div>
            <h2>Welcome to React!</h2>
            <Chat value={this.state.chat} handleKey={this.handleKey}/>
            <button onClick={this.disconnect}>Quit</button>
        </div>);
    }
}
