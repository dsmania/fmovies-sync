// ==UserScript==
// @name         FMovies Sync
// @namespace    http://dsmania.github.io/
// @version      0.1.0
// @description  Synchronizes playback in FMovies
// @author       Yago Méndez Vidal
// @match        https://mcloud.to/embed/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    var id = window.location.href.replace(/https?:\/\/mcloud\.to\/embed\/(\w{6})\?.*/g, '$1');
    var synced = false;
    var syncing = false;
    var seekTo = null;

    var socket = io();

    var player = jwplayer();
    player.on('play', function(e) {
        if (syncing) {
            return;
        }

        const { oldstate, viewable, playReason } = e;
        if (player.getState() != 'playing') {
            player.play();
        }
    });
    player.on('pause', function(e) {
        if (syncing) {
            return;
        }

        const { oldstate, viewable, pauseReason } = e;
        if (player.getState() != 'paused') {
            player.pause();
        }
    });
    player.on('idle', function(e) {
        if (syncing) {
            return;
        }

        const { oldstate } = e;
        if (player.getState() != 'idle') {
            player.stop();
        }
    });
    player.on('seek', function(e) {
        if (syncing) {
            return;
        }

        const { position, offset } = e;
        seekTo = offset;
    });
    player.on('seeked', function() {
        if (syncing) {
            return;
        }

        if (seekTo != null && player.getPosition().toFixed(0) != seekTo.toFixed(0)) {
            seekTo = null;
            player.seek(seekTo);
        }
    });

    function sync() {
        // Get server state
        // if server value -> write local value
        // else -> write server value
        // install listeners

        synced = true;
    }

    function unsync() {
        synced = false;
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
