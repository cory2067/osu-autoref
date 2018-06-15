import React from 'react';
const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const Banchojs = require('bancho.js');
const nodesu = require('nodesu');
const path = require('path');
const fs = require('fs');

const match = { //split out into some config file or something
    teams: [{name: 'leftovers', members: ['Cychloryn']}, {name: 'flubber conquest', members: []}]
};

let beatmaps = [{code: "DT1", id: 1262832, mod: 'DT'}, {code: "FM2", id: 1378285, mod: 'freemod'}, {code: "NM1", id: 1385398, mod: 'nomod'}];
let channel, lobby, client, api;

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
            chat: "",
            map: ""
        }

        const dataPath = path.join(remote.app.getPath('userData'), 'autoref.json');
        if (!fs.existsSync(dataPath)) {
            this.launchLogin();
        } else {
            this.initBancho();
        }

        this.initBancho = this.initBancho.bind(this);
        this.print = this.print.bind(this);
    }

    launchLogin() {
        const modalPath = path.join('file://', __dirname, 'login.html')
        let win = new remote.BrowserWindow({ width: 400, height: 320 })
        win.on('close', function () {
            win = null;
            this.initBancho();
        })
        win.loadURL(modalPath)
        win.show()
    }

    print(msg) {
        this.setState({
            chat: this.state.chat + (msg.user.ircUsername || INFO) + ": " + msg.message + "\n"
        });
    }

    initBancho() {
        client = new Banchojs.BanchoClient(require("../config.json"));
        api = new nodesu.Client(require('../config.json').apiKey);

        beatmaps.forEach(async (b) => {
            let info = (await api.beatmaps.getByBeatmapId(b.id))[0];
            b.name = b.code + ': ' + info.artist + ' - ' + info.title + ' [' + info.version + ']';
        });

        client.connect().then(async () => {
            console.log("We're online!");
            try {
        	    channel = await client.createLobby("O!RT: " + match.teams[0].name + " vs " + match.teams[1].name);
            } catch(err) {
                alert("Could not create lobby.");
            }
        	lobby = channel.lobby;
        	const password = Math.random().toString(36).substring(8);
        	await Promise.all([lobby.setPassword(password), lobby.setMap(1262832)]);
        	console.log("Lobby created! Name: "+lobby.name+", password: "+password);
        	console.log("Multiplayer link: https://osu.ppy.sh/mp/"+lobby.id);

            const allPlayers = match.teams[0].members.concat(match.teams[1].members);
            lobby.setSettings(Banchojs.BanchoLobbyTeamModes.TeamVs, Banchojs.BanchoLobbyWinConditions.ScoreV2);

            allPlayers.forEach((p) => {
                lobby.invitePlayer(p).catch((error) => {
                    console.error(error);
                });
             });

             lobby.on("playerJoined", (obj) => {
                 console.log("A player has joined!");
                 if(obj.player.user.isClient())
                     lobby.setHost("#"+obj.player.user.id);
             });
             lobby.on("allPlayersReady", (obj) => {
                 lobby.startMatch(10);
             });
             lobby.on("matchFinished", () => {
                 /*lobby.setMap(beatmaps[index].id);
                 lobby.setMods(beatmaps[index].mod, false);*/

                 channel.sendMessage("k somebody pick a new map");
                 this.map = "";
             });
            channel.on("message", (msg) => {
                this.print(msg);

                if (!this.map) {
                    let r = beatmaps.filter((map) => {
                        return map.name && map.name.toLowerCase().includes(msg.message.toLowerCase());
                    });

                    if (r.length == 1) {
                        channel.sendMessage("Selecting " + r[0].name);
                        lobby.setMap(r[0].id);
                        lobby.setMods(r[0].mod, false);
                        this.map = r[0].name;
                    }
                }
            });
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
            <button onClick={this.disconnect}>Quit</button> <br />
            <span>Next map: {this.state.map || 'None selected'} </span>
        </div>);
    }
}
