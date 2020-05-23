// ==UserScript==
// @name         FMovies Sync
// @namespace    http://dsmania.github.io/
// @version      0.1.2
// @description  Synchronizes playback in FMovies
// @author       Yago Méndez Vidal
// @include      https://mcloud*.to/embed/*
// @grant        none
// @require      https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const bufferingTime = 2000;

    var id = window.location.href.replace(/https?:\/\/mcloud\d?\.to\/embed\/(\w{6})\?.*/g, '$1');
    var synced = false;
    var syncing = false;
    var lastUpdate = 0;
    var timeout;
    var timeAdjust = 0;
    var numberOfParticipants = 0;

    const socket = io('https://fmovies-sync.herokuapp.com/');

    socket.on('adjust', (serverTime) => {
        timeAdjust = new Date().getTime() - serverTime;
    });
    socket.on('sync', (command, position, dateTime) => {
        dateTime += timeAdjust;
        if (!synced || dateTime < lastUpdate) {
            return;
        }

        window.clearTimeout(timeout);
        var newPosition;

        if (command == 'play') {
            syncing = true;
            newPosition = position + (new Date().getTime() - dateTime) / 1000;
            if (newPosition > player.getDuration()) {
                player.stop();
                syncing = false;
            } else if (Math.abs(newPosition - player.getPosition()) > 1) {
                player.seek(newPosition + bufferingTime / 1000);
                timeout = window.setTimeout(() => {
                    player.play();
                    syncing = false;
                }, bufferingTime);
            } else {
                player.play();
                syncing = false;
            }
        } else if (command == 'pause') {
            syncing = true;
            newPosition = position + (new Date().getTime() - dateTime) / 1000;
            if (newPosition > player.getDuration()) {
                player.stop();
                syncing = false;
            } else if (Math.abs(newPosition - player.getPosition()) > 1) {
                player.pause();
                player.seek(newPosition);
                syncing = false;
            } else {
                player.pause();
                syncing = false;
            }
        } else if (command == 'stop') {
            syncing = true;
            player.stop();
            syncing = false;
        } else if (command == 'seek') {
            syncing = true;
            newPosition = position + (new Date().getTime() - dateTime) / 1000;
            if (newPosition > player.getDuration()) {
                player.stop();
                syncing = false;
            } else if (Math.abs(newPosition - player.getPosition()) > 1) {
                    player.seek(newPosition);
                    syncing = false;
            } else {
                syncing = false;
            }
        }
        lastUpdate = dateTime;
    });
    socket.on('info', (participants) => {
        numberOfParticipants = participants;
        if (synced) {
            syncButtonTooltipText.innerHTML = 'Synchronized (' + numberOfParticipants + ')';
        }
    });

    const player = jwplayer();
    player.on('play', (e) => {
        if (!synced || syncing) {
            return;
        }
        socket.emit('sync', 'play', player.getPosition(), new Date().getTime() - timeAdjust);
    });
    player.on('pause', (e) => {
        if (!synced || syncing) {
            return;
        }
        socket.emit('sync', 'pause', player.getPosition(), new Date().getTime() - timeAdjust);
    });
    player.on('idle', (e) => {
        if (!synced || syncing) {
            return;
        }
        socket.emit('sync', 'stop', 0, new Date().getTime() - timeAdjust);
    });
    player.on('seek', (e) => {
        if (!synced || syncing) {
            return;
        }
        const { position, offset } = e;
        socket.emit('sync', 'seek', offset, new Date().getTime() - timeAdjust);
    });

    function sync() {
        socket.emit('join', id);
        synced = true;
    }
    function unsync() {
        synced = false;
        socket.emit('leave', id);
    }

    var syncButton = document.createElement('div');
    syncButton.style = 'width: 44px; height: 44px; cursor: pointer; align-items: center; display: flex; justify-content: center; background-color: #0000; opacity: 80%;';
    var syncButtonIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    syncButtonIcon.setAttribute('viewBox', '0 0 25 20');
    syncButtonIcon.setAttribute('width', '25');
    syncButtonIcon.setAttribute('height', '20');
    var syncButtonIconBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    syncButtonIconBackground.setAttribute('x', '1.5');
    syncButtonIconBackground.setAttribute('y', '1.5');
    syncButtonIconBackground.setAttribute('width', '22');
    syncButtonIconBackground.setAttribute('height', '17');
    syncButtonIconBackground.setAttribute('fill', '#fff0');
    syncButtonIconBackground.setAttribute('stroke', '#fff');
    syncButtonIconBackground.setAttribute('stroke-width', '3');
    syncButtonIcon.appendChild(syncButtonIconBackground);
    var syncButtonIconGlyph = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    syncButtonIconGlyph.innerHTML = '⇆';
    syncButtonIconGlyph.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
    syncButtonIconGlyph.setAttribute('font-size', '15');
    syncButtonIconGlyph.setAttribute('x', '6');
    syncButtonIconGlyph.setAttribute('y', '14');
    syncButtonIconGlyph.setAttribute('fill', '#fff');
    syncButtonIcon.appendChild(syncButtonIconGlyph);
    var syncButtonIconMask = document.createElementNS('http://www.w3.org/2000/svg', 'mask');
    syncButtonIconMask.setAttribute('id', 'glyphMask');
    var syncButtonIconMaskBackground = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    syncButtonIconMaskBackground.setAttribute('x', '1.5');
    syncButtonIconMaskBackground.setAttribute('y', '1.5');
    syncButtonIconMaskBackground.setAttribute('width', '22');
    syncButtonIconMaskBackground.setAttribute('height', '17');
    syncButtonIconMaskBackground.setAttribute('fill', '#fff');
    syncButtonIconMaskBackground.setAttribute('stroke', '#fff');
    syncButtonIconMaskBackground.setAttribute('stroke-width', '3');
    syncButtonIconMask.appendChild(syncButtonIconMaskBackground);
    var syncButtonIconMaskGlyph = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    syncButtonIconMaskGlyph.innerHTML = '⇆';
    syncButtonIconMaskGlyph.setAttribute('font-family', 'Arial, Helvetica, sans-serif');
    syncButtonIconMaskGlyph.setAttribute('font-size', '15');
    syncButtonIconMaskGlyph.setAttribute('x', '6');
    syncButtonIconMaskGlyph.setAttribute('y', '14');
    syncButtonIconMaskGlyph.setAttribute('fill', '#000');
    syncButtonIconMask.appendChild(syncButtonIconMaskGlyph);
    syncButtonIcon.appendChild(syncButtonIconMask);
    syncButton.appendChild(syncButtonIcon);
    var syncButtonTooltip = document.createElement('div');
    syncButtonTooltip.style = 'position: absolute; bottom: 68px; transition: 100ms cubic-bezier(0, .25, .25, 1) 500ms; transform: translate(0, 50%); visibility: hidden;';
    var syncButtonTooltipText = document.createElement('div');
    syncButtonTooltipText.innerHTML = 'Synchronize';
    syncButtonTooltipText.style = 'color: #000; background-color: #fff; font-size: 9px; border-radius: 1px; padding: 4px 10px;';
    syncButtonTooltip.appendChild(syncButtonTooltipText);
    var syncButtonTooltipPointer = document.createElement('div');
    syncButtonTooltipPointer.style = 'display: block; box-sizing: border-box; position: absolute; top: 100%; left: 50%; width: 10px; height: 9px; border-radius: 1px; transform: translate(-50%, -50%) rotate(45deg); z-index: -1; background-color: #fff;';
    syncButtonTooltip.appendChild(syncButtonTooltipPointer);
    syncButton.appendChild(syncButtonTooltip);
    syncButton.onmouseover = (e) => {
        syncButton.style.opacity = '100%';
        syncButtonTooltip.style.transform = 'none';
        syncButtonTooltip.style.visibility = 'visible';
        syncButtonTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 500ms';
    };
    syncButton.onmouseout = (e) => {
        syncButton.style.opacity = '80%';
        syncButtonTooltip.style.transform = 'translate(0, 50%)';
        syncButtonTooltip.style.visibility = 'hidden';
        syncButtonTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 0ms';
    };
    syncButton.onclick = (e) => {
        if (synced) {
            syncButtonIconGlyph.setAttribute('visibility', 'visible');
            syncButtonIconBackground.setAttribute('fill', '#fff0');
            syncButtonIconBackground.setAttribute('mask', null);
            syncButtonTooltipText.innerHTML = 'Synchronize';
            unsync();
        } else {
            syncButtonIconGlyph.setAttribute('visibility', 'hidden');
            syncButtonIconBackground.setAttribute('fill', '#fff');
            syncButtonIconBackground.setAttribute('mask', 'url(#glyphMask)');
            syncButtonTooltipText.innerHTML = 'Synchronized (' + numberOfParticipants + ')';
            sync();
        }
    };

    var buttonContainer = document.getElementsByClassName('jw-button-container')[0];
    function layoutUi() {
        var ccButton = buttonContainer.getElementsByClassName('jw-icon-cc')[0];
        buttonContainer.insertBefore(syncButton, ccButton);

        function fixButtonsSize() {
            if (ccButton.clientHeight < 60) {
                syncButton.style.width = '44px';
                syncButton.style.height = '44px';
                syncButtonIcon.setAttribute('width', '20px');
                syncButtonIcon.setAttribute('height', '16px');
                syncButtonTooltip.style.bottom = '68px';
                syncButtonTooltipText.style.fontSize = '9px';
                syncButtonTooltipText.style.padding = '4px 10px';
                syncButtonTooltipPointer.style.width = '10px';
                syncButtonTooltipPointer.style.height = '9px';
            } else {
                syncButton.style.width = '60px';
                syncButton.style.height = '60px';
                syncButtonIcon.setAttribute('width', '25px');
                syncButtonIcon.setAttribute('height', '20px');
                syncButtonTooltip.style.bottom = '83px';
                syncButtonTooltipText.style.fontSize = '16px';
                syncButtonTooltipText.style.padding = '7px 10px';
                syncButtonTooltipPointer.style.width = '11px';
                syncButtonTooltipPointer.style.height = '10px';
            }
        };
        fixButtonsSize();
        player.on('resize', fixButtonsSize);
    };
    if (buttonContainer != null) {
        layoutUi();
    } else {
        var observer = new MutationObserver((mutations, observer) => {
            buttonContainer = document.getElementsByClassName('jw-button-container')[0];
            if (buttonContainer != null) {
                observer.disconnect();
                layoutUi();
            }
        });
        observer.observe(document, { childList: true, subtree: true });
    }

    /* Movie fixes */
    if (id == 'd549xj') { // Sunshine
        player.setConfig({ aspectratio: '2.39:1', width: '100%', stretching: 'exactfit' });
        player.on('fullscreen', (e) => {
            var video = document.getElementsByClassName('jw-video')[0];
            if (video != null) {
                if (e.fullscreen) {
                    setTimeout(() => {
                        video.style.height = 'calc(100vw/2.39)';
                    }, 500);
                } else {
                    video.style.height = null;
                }
            }
        });
    }

})();
