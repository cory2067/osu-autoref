# osu!autoref

Semi-automated referee interface for osu!  
Tested only on Linux. May totally explode on Windows/Mac, but theoretically compatible.
I'm sorry for using Electron, there's no reason this program needs to be this heavy.  
Uses bancho.js by ThePoon.

## Features
- GUI
    - Built-in chat (todo: make chat face the other direction
    - Player invite button
    - Map dropdown selector
- Automation
    - Automatically select maps from chat input (todo: validate user who picks)
    - Automatically keep track of score
- Every match starts with Hitorigoto

## Running
Requires: node.js (I use v6)  
May or may not need to install `electron-forge` yourself  
`npm install`  
`npm start`

## Configuration
Upon opening autoref for the first time, you should be prompted to enter some login info.  
Don't put your real osu! password into this sketchy script.  
- Use your IRC password: https://osu.ppy.sh/p/irc  
- And you'll need an API key: https://osu.ppy.sh/p/api  
