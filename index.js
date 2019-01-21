const bancho = require('bancho.js');
const chalk = require('chalk');
const nodesu = require('nodesu');
const fs = require('fs');

// Remember to fill config.json with your credentials
const config = require('./config.json');
const pool = require('./pool.json');
const match = require('./match.json');

const client = new bancho.BanchoClient(config);
const api = new nodesu.Client(config.apiKey);

let channel, lobby;

// populate mappool with map info
function initPool(pool) {
  return Promise.all(pool.map(async (b) => {
		const info = (await api.beatmaps.getByBeatmapId(b.id))[0];
		b.name = b.code + ': ' + info.artist + ' - ' + info.title + ' [' + info.version + ']';
		console.log(chalk.dim(`Loaded ${info.title}`));
  }));
}

// Creates a new multi lobby
async function init() {
	console.log(chalk.bold.cyan('Starting osu!autoref'));
	await initPool(pool);
	console.log(chalk.bold.green('Loaded map pool!'));
	console.log(chalk.cyan('Attempting to connect...'));
	
	try {
		await client.connect();
		console.log(chalk.bold.green("Connected to Bancho!"));
		channel = await client.createLobby(`${match.tournament}: ${match.teams[0].name} vs ${match.teams[1].name}`);
	} catch (err) {
		console.log(err);
		console.log(chalk.bold.red("Failed to create lobby"));
		process.exit(1);
	}

	lobby = channel.lobby;

	const password = Math.random().toString(36).substring(8);
	await lobby.setPassword(password);
 	await lobby.setMap(1262832); //hitorigoto dayo

	console.log(chalk.bold.green("Lobby created!"));
	console.log(chalk.bold.cyan(`Name: ${lobby.name}, password: ${password}`));
	console.log(chalk.bold.cyan(`Multiplayer link: https://osu.ppy.sh/mp/${lobby.id}`));

	lobby.setSettings(bancho.BanchoLobbyTeamModes.TeamVs, bancho.BanchoLobbyWinConditions.ScoreV2);

	createListeners();
}

// Respond to events occurring in lobby
function createListeners() {
	lobby.on("playerJoined", (obj) => {
		const name = obj.player.user.username;
		console.log(chalk.yellow(`Player ${name} has joined!`));

		// Attempt to auto-assign team
		if (match.teams[0].members.includes(name)) {
		  lobby.changeTeam(obj.player, "Blue");
    } else if (match.teams[1].members.include(name)) {
		  lobby.changeTeam(obj.player, "Red");
    } else {
			console.log(chalk.red("Warning! Couldn't figure out team"));
		}

    if (obj.player.user.isClient()) {
			lobby.setHost("#" + obj.player.user.id);
		}
	 });

	lobby.on("allPlayersReady", (obj) => {
		lobby.startMatch(10);
	});

	channel.on("message", (msg) => {
		console.log(chalk.dim(msg));
	});
}

async function close() {
	console.log(chalk.cyan("Closing..."));
	await lobby.closeLobby();
	await client.disconnect();
}

init()
  .then(() => {

		return close();
  })
  .then(() => {
		console.log(chalk.bold.green("Closed osu!autoref"));
  });
