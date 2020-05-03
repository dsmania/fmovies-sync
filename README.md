# FMovies Sync

Sync playback in FMovies.

## Description

This is a simple application that adds a synchronizing functionality to the player in FMovies, allowing the participants to watche de movie at the same time.

Under the hood, this adds a button to the player using a Tampermonkey script; this script connects to a node running in Heroku using Socket.IO and broadcasts any command for each movie to all the participants.

This was developed as a need to watch movies at the same time by a group of friends during the lockdown for COVID-19 in 2020. If you're one of the lucky participants, you can check the page for [Ciclo de Cine de Mierda remote revival](https://www.facebook.com/groups/2547474055473448/).

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) on your browser, for instance [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/) or [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo).
2. Add the [FMovies Sync client](https://github.com/dsmania/fmovies-sync/raw/master/fmovies-sync-client.user.js) script.

Note that this will most probably also run with [Greasemonkey](https://www.greasespot.net/) or [Violentmonkey](https://violentmonkey.github.io/), it's just not been tested.

## Usage

1. Go to [Fmovies](https://fmovies.to/).
2. Select a show.
3. Click the sync button [⇆] in the player.
4. Any playback control is now synchronized with all other participants.

## Resources

- [Tampermonkey](https://www.tampermonkey.net/)
- [Node.js](https://nodejs.org/)
- [Socket.io](https://socket.io/)
- [Heroku](https://www.heroku.com/)
