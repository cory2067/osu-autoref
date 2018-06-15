import React from 'react';
const fs = require('fs');
const path = require('path');
const remote = require('electron').remote

export default class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            api: '',
            pw: '',
        };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.setState({[event.target.name]: event.target.value});
    }

    handleSubmit(event) {
        console.log(this.state);
        const dataPath = path.join(remote.app.getPath('userData'), 'autoref.json');
        const data = {
        	"host": "irc.ppy.sh",
        	"port": 6667,
        	"username": this.state.name,
        	"password": this.state.pw,
        	"apiKey": this.state.api,
        	"userId": 0,
        	"limiterTimespan": 6000,
        	"limiterPrivate": 4,
        	"limiterPublic": 3
        };

        fs.writeFileSync(dataPath, JSON.stringify(data));

        var window = remote.getCurrentWindow();
        window.close();
    }

    render() {
        return (<div>
            <form onSubmit={this.handleSubmit}>
                <label>
                    Name:
                    <input type="text" name="name" value={this.state.name} onChange={this.handleChange}/>
                </label>
                <br/>
                <label>
                    API Key:
                    <input type="text" name="api" value={this.state.api} onChange={this.handleChange}/>
                </label>
                <br/>
                <label>
                    IRC Password:
                    <input type="text" name="pw" value={this.state.pw} onChange={this.handleChange}/>
                </label>
                <br/>
                <input type="submit" value="Submit"/>
            </form>
        </div>);
    }
}
