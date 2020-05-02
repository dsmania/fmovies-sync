// ==UserScript==
// @name         FMovies Sync
// @namespace    http://dsmania.github.io/
// @version      0.1.0
// @description  Synchronizes playback in FMovies
// @author       Yago Méndez Vidal
// @include      https://mcloud*.to/embed/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var id = window.location.href.replace(/https?:\/\/mcloud\d?\.to\/embed\/(\w{6})\?.*/g, '$1');
    var synced = false;
    var syncing = false;

    const socket = io('https://fmovies-sync.herokuapp.com:9000');

    socket.on('sync', (command, position, dateTime) => {
        if (!synced) {
            return;
        }

        var offset;
        if (command == 'play') {
            syncing = true;
            offset = position + (new Date().getTime() - dateTime) / 1000;
            if (Math.abs(player.getPosition() - offset) > 1) {
                player.seek(offset);
            }
            if (player.getState() != 'playing') {
                player.play();
            }
            syncing = false;
        } else if (command != 'pause') {
            syncing = true;
            offset = position + (new Date().getTime() - dateTime) / 1000;
            if (Math.abs(player.getPosition() - offset) > 1) {
                player.seek(offset);
            }
            if (player.getState() != 'paused') {
                player.pause();
            }
            syncing = false;
        } else if (command != 'stop') {
            syncing = true;
            if (player.getState() != 'idle') {
                player.stop();
            }
            syncing = false;
        } else if (command != 'seek') {
            syncing = true;
            offset = position + (new Date().getTime() - dateTime) / 1000;
            if (Math.abs(player.getPosition() - offset) > 1) {
                player.seek(offset);
            }
            syncing = false;
        }
    });

    const player = jwplayer();
    player.on('play', function(e) {
        if (!synced || syncing) {
            return;
        }
        socket.emit('sync', 'play', player.getPosition(), new Date().getTime());
    });
    player.on('pause', function(e) {
        if (!synced || syncing) {
            return;
        }
        socket.emit('sync', 'pause', player.getPosition(), new Date().getTime());
    });
    player.on('idle', function(e) {
        if (!synced || syncing) {
            return;
        }
        socket.emit('sync', 'stop', 0, new Date().getTime());
    });
    player.on('seek', function(e) {
        if (!synced || syncing) {
            return;
        }
        const { position, offset } = e;
        socket.emit('sync', 'seek', offset, new Date().getTime());
    });

    function sync() {
        socket.emit('join', id);
        synced = true;
    }
    function unsync() {
        synced = false;
        socket.emit('leave', id);
    }

    var syncButton = document.createElement('DIV');
    syncButton.style = 'width: 44px; height: 44px; cursor: pointer; align-items: center; display: flex; justify-content: center; color: #fff; opacity: 80%;';
    var syncButtonText = document.createElement('DIV');
    syncButtonText.style = 'width: 20px; height: 16px; border: 2px solid #fff; text-align: center; line-height: 11px; font-size: 13px;';
    syncButtonText.innerHTML = '⇆';
    syncButton.appendChild(syncButtonText);
    var syncButtonTooltip = document.createElement('DIV');
    syncButtonTooltip.style = 'position: absolute; bottom: 68px; transition: 100ms cubic-bezier(0, .25, .25, 1) 500ms; transform: translate(0, 50%); visibility: hidden;';
    var syncButtonTooltipText = document.createElement('DIV');
    syncButtonTooltipText.innerHTML = 'Synchronize';
    syncButtonTooltipText.style = 'color: #000; background-color: #fff; font-size: 9px; border-radius: 1px; padding: 4px 10px; opacity: 100%;';
    syncButtonTooltip.appendChild(syncButtonTooltipText);
    var syncButtonTooltipPointer = document.createElement('DIV');
    syncButtonTooltipPointer.style = 'display: block; box-sizing: border-box;position: absolute; top: 100%; left: 50%; width: 10px; height: 9px; border-radius: 1px; transform: translate(-50%, -50%) rotate(45deg); z-index: -1; background-color: #fff;';
    syncButtonTooltip.appendChild(syncButtonTooltipPointer);
    syncButton.appendChild(syncButtonTooltip);
    var buttonContainer = document.getElementsByClassName('jw-button-container')[0];
    if (buttonContainer != null) {
        buttonContainer.insertBefore(syncButton, buttonContainer.getElementsByClassName('jw-icon-cc')[0]);
    } else {
        var observer = new MutationObserver(function() {
            buttonContainer = document.getElementsByClassName('jw-button-container')[0];
            if (buttonContainer != null) {
                buttonContainer.insertBefore(syncButton, buttonContainer.getElementsByClassName('jw-icon-cc')[0]);
                this.disconnect();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    syncButton.onmouseover = function() {
        syncButton.style.opacity = '100%';
        syncButtonTooltip.style.transform = 'none';
        syncButtonTooltip.style.visibility = 'visible';
        syncButtonTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 500ms';
    };
    syncButton.onmouseout = function() {
        syncButton.style.opacity = '80%';
        syncButtonTooltip.style.transform = 'translate(0, 50%)';
        syncButtonTooltip.style.visibility = 'hidden';
        syncButtonTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 0ms';
    };
    syncButton.onclick = function() {
        if (synced) {
            syncButtonText.style.color = '#fff';
            syncButtonText.style.background = '#0000';
            unsync();
        } else {
            syncButtonText.style.color = '#000';
            syncButtonText.style.background = '#fff';
            sync();
        }
    };

})();
