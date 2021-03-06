# osu!autoref

Semi-automated referee bot for osu! by [Cychloryn](https://osu.ppy.sh/users/6921736).

Tested on Linux and Windows.
Uses bancho.js by ThePoon.

## Features
- Creates match automatically
- Extra mp commands
  - Invite all players with `>invite`
  - Set beatmap using name, e.g. `>map hitorigoto`
  - Set beatmap using code, e.g. `>map DT1`
- Automatic scorekeeping
- Asks teams for picks/listens for picks automatically
- Auto start matches when players are ready
- Every match starts with Hitorigoto  
 
## Configuration
Before running osu!autoref, you'll need to fill out some configuration.

### config.json
Create a file `config.json`. You can copy the template file `config.example.json`. You will need to add your username, [IRC password](https://osu.ppy.sh/p/irc), and osu! [API key](https://osu.ppy.sh/p/api).

### pool.json
Load the mappool into this file. The format should be self-explanatory from the example pool. It requires only the map code (NM2, HR3, DT1, etc) and the ID of the map. The bot will infer the mods based on the map code, but you can (optionally) explicitly provide the mod via the "mod" field.

### match.json
Contains the users for your match. The first team will be blue, and the second will be red. I usually add myself to one of the teams, in case I want to join in-game. This file also contains match metadata like the name of the tournament, and the "best-of" for the match.

## Running
Requires: node.js (I use node v10)
```
npm install
npm start
```

## Usage
Upon running this bot, a match will be created, and the password will be logged to the terminal. You can send messages to the chatroom via the terminal window, but this is kinda janky, so I'd recommenda also having an IRC client open/being in-game.

First, you can use this special command to invite all players from both teams to the match:
```
>invite
```

In the beginning, the bot will not attempt any automatic actions. This will let you deal with rolls/warmups manually.

When you're ready to begin the match, set the team who picks first, and enable automatic mode. When "auto" is enabled, the bot will listen for the picking team's choice, and set the current map accordingly. It will also enable auto-scorekeeping.
```
>picking red
>auto on
```

If you need to override which map is chosen, you can use the "map" command:
```
>map nm1
>map everything will freeze
```

When all players are ready, the bot will start the match. After the match, the bot will say the winner of the match, and give the current score. If you need to override the current score, do so with the following command (e.g. blue 4 -- 3 red)
```
>score 4 3
```

At the end of the match, close the lobby with:
```
>close
```
This command is recommended over `!mp close`, because it also disconnects the bot from Bancho and cleanly exits the program.

## Using 'load-match' tool
I included a tiny script that I use for managing multiple matches. Create a directory "matches" and fill it with match files (following the format of the default match.json).

For example, your file structure will look something like this:
```
osu-autoref/
  matches/
    G4.json
    G5.json
    G6.json 
  index.js
  config.json
  package.json
  load-match
```

Launch the bot for match G4 by running:
```
./load-match G4
```
