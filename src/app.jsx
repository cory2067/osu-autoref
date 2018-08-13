import React from 'react';
const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const Banchojs = require('bancho.js');
const nodesu = require('nodesu');
const path = require('path');
const fs = require('fs');

const match = { //todo: split out into some config file or something
    teams: [
        {name: 'Mouse Paradise', members: ['Lefafel', '[Lucky]', 'Cychloryn'], score: 0},
        {name: 'osu! pros', members: ['Flaiimz', '-Rosen'], score: 0}
    ]
};

let beatmaps = [ // SF pool
    {code: "NM1", id: 1093352, mod: 'nomod'},
    {code: "NM2", id: 1440742, mod: 'nomod'},
    {code: "NM3", id: 1598151, mod: 'nomod'},
    {code: "NM4", id: 1371758, mod: 'nomod'},
    {code: "NM5", id: 1600024, mod: 'nomod'},
    {code: "NM6", id: 80102, mod: 'nomod'},
    {code: "HD1", id: 1248887, mod: 'HD'},
    {code: "HD2", id: 1626314, mod: 'HD'},
    {code: "HD3", id: 126470, mod: 'HD'},
    {code: "HR1", id: 792950, mod: 'HR'},
    {code: "HR2", id: 1343218, mod: 'HR'},
    {code: "HR3", id: 1266318, mod: 'HR'},
    {code: "DT1", id: 258665, mod: 'DT'},
    {code: "DT2", id: 1589441, mod: 'DT'},
    {code: "DT3", id: 1240468, mod: 'DT'},
    {code: "FM1", id: 693035, mod: 'freemod'},
    {code: "FM2", id: 116279, mod: 'freemod'},
    {code: "FM3", id: 34162, mod: 'freemod'},
    {code: "TB", id: 1115984, mod: 'freemod'},
    {code: "RD", id: 1529804, mod: 'freemod'}
];
let channel, lobby, client, api;

function Chat(props) {
    return (<div>
        <input type="text" onKeyPress={props.handleKey}></input>
        <br />
        <textarea rows="20" cols="40" readOnly value={props.value}> </textarea>
        <br/>
    </div>);
}

class Player extends React.Component {
    constructor(props) {
        super(props);
        this.invite = this.invite.bind(this);
    }

    invite() {
        this.props.handleInvite(this.props.name);
    }

    render() {
        return (<div>
            <span>{this.props.team}: {this.props.name}</span>
            <button onClick={this.invite}>Invite</button>
        </div>);
    }
}

export default class App extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            chat: "",
            map: "",
            auto: false,      // auto map selection
            autoscore: false  // auto keep track of score
        }

        const dataPath = path.join(remote.app.getPath('userData'), 'autoref.json');
        if (!fs.existsSync(dataPath)) {
            this.launchLogin();
        } else {
            this.initBancho();
        }

        this.initBancho = this.initBancho.bind(this);
        this.print = this.print.bind(this);
        this.handleMapChange = this.handleMapChange.bind(this);
        this.toggleAuto = this.toggleAuto.bind(this);
        this.toggleAutoScore = this.toggleAutoScore.bind(this);
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
            chat: (msg.user.ircUsername || INFO) + ": " + msg.message + "\n" + this.state.chat
        });
    }

    toggleAuto() {
        this.setState({
            auto: !this.state.auto
        });
    }

    toggleAutoScore() {
        this.setState({
            autoscore: !this.state.autoscore
        });
    }

    initBancho() {
        client = new Banchojs.BanchoClient(require("../config.json"));
        api = new nodesu.Client(require('../config.json').apiKey);
        beatmaps.forEach(async (b) => {
            let info = (await api.beatmaps.getByBeatmapId(b.id))[0];
            b.name = b.code + ': ' + info.artist + ' - ' + info.title + ' [' + info.version + ']';
            this.forceUpdate();
        });

        client.connect().then(async () => {
            console.log("We're online!");
            try {
        	    channel = await client.createLobby("O!RT: " + match.teams[0].name + " vs " + match.teams[1].name);
            } catch(err) {
                alert("Could not create lobby.");
                console.log(err);
            }
        	lobby = channel.lobby;
        	const password = Math.random().toString(36).substring(8);
        	await Promise.all([lobby.setPassword(password), lobby.setMap(1262832)]);
        	console.log("Lobby created! Name: "+lobby.name+", password: "+password);
        	console.log("Multiplayer link: https://osu.ppy.sh/mp/"+lobby.id);

            const allPlayers = match.teams[0].members.concat(match.teams[1].members);
            lobby.setSettings(Banchojs.BanchoLobbyTeamModes.TeamVs, Banchojs.BanchoLobbyWinConditions.ScoreV2);

            //allPlayers.forEach((p) => {
            //    lobby.invitePlayer(p).catch((error) => {
            //        console.error(error);
            //    });
            // });

             lobby.on("playerJoined", (obj) => {
                 console.log("A player has joined!");
                 if (match.teams[0].members.includes(obj.player.user.username)) {
                     lobby.changeTeam(obj.player, "Blue");
                 } else {
                     lobby.changeTeam(obj.player, "Red");
                 }

                 if(obj.player.user.isClient())
                     lobby.setHost("#"+obj.player.user.id);
             });
             lobby.on("allPlayersReady", (obj) => {
                 lobby.startMatch(10);
             });
             lobby.on("matchFinished", (scores) => {
                 console.log(scores);
                 let s = {"Blue": 0, "Red": 0};
                 scores.forEach((score) => {
                    s[score.player.team] += score.pass * score.score;
                 });
                 if (this.state.autoscore) {
                     let diff = s["Blue"] - s["Red"];
                     if (diff > 0) {
                         channel.sendMessage(match.teams[0].name + " wins by " + diff);
                         match.teams[0].score++;
                     } else {
                         channel.sendMessage(match.teams[1].name + " wins by " + (-diff));
                         match.teams[1].score++;
                     }
                     channel.sendMessage(match.teams[0].name + " " + match.teams[0].score + " -- " + match.teams[1].score + " " + match.teams[1].name);
                 }

                 //lobby.setMap(beatmaps[index].id);
                 //lobby.setMods(beatmaps[index].mod, false);

                 //channel.sendMessage("k somebody pick a new map");
                 this.setState({map: ""});
             });
            channel.on("message", (msg) => {
                this.print(msg);

                let isid = !isNaN(msg.message.slice(-1));
                if (this.state.auto && (msg.message.length > 4 || (msg.message.length > 2 && isid))) {
                    let r = beatmaps.filter((map) => {
                        return map.name && map.name.toLowerCase().includes(msg.message.toLowerCase());
                    });

                    if (r.length == 1) {
                        channel.sendMessage("Selecting " + r[0].name);
                        lobby.setMap(r[0].id);
                        lobby.setMods(r[0].mod, false);
                        this.setState({map: r[0].id});
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
    handleInvite(p) {
        lobby.invitePlayer(p).catch((error) => {
            console.error(error);
        });
    }
    handleMapChange(e) {
        this.setState({map: e.target.value});
        let r = beatmaps.filter((m) => {return m.id == e.target.value});
        console.log(r)
        channel.sendMessage("Selecting " + r[0].name);
        lobby.setMap(r[0].id);
        lobby.setMods(r[0].mod, false);
    }
    async disconnect() {
        console.log('closing')
        await lobby.closeLobby();
        await client.disconnect();
        console.log('done!~')
    }
    render() {
        var players_1 = match.teams[0].members.map((player) => {
            return <Player key={player} name={player} team={match.teams[0].name} handleInvite={this.handleInvite}/>;
        });
        var players_2 = match.teams[1].members.map((player) => {
            return <Player key={player} name={player} team={match.teams[1].name} handleInvite={this.handleInvite}/>;
        });
        var mapOptions = beatmaps.map((m) => {
            return <option key={m.id} value={m.id}>{m.name}</option>;
        });
        return (<div>
            <h2>Welcome to React!</h2>
            <Chat value={this.state.chat} handleKey={this.handleKey}/>
            <button onClick={this.disconnect}>Quit</button> <br />
            {players_1}
            {players_2}
            <select value={this.state.map} onChange={this.handleMapChange}>
                {mapOptions}
            </select>
            <br />
            <button onClick={this.toggleAuto}>Auto map select: {this.state.auto ? "On" : "Off"}</button>
            <br />
            <button onClick={this.toggleAutoScore}>Auto score: {this.state.autoscore ? "On" : "Off"}</button>
        </div>);
    }
}
