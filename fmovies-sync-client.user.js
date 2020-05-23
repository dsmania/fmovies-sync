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
    var participants = 0;

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
    socket.on('info', (participantCount) => {
        participants = participantCount;
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

    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://use.fontawesome.com/releases/v5.13.0/css/all.css';
    link.crossorigin = 'anonymous';
    document.getElementsByTagName('head')[0].appendChild(link);

    var syncButton = document.createElement('DIV');
    syncButton.style = 'width: 44px; height: 44px; cursor: pointer; align-items: center; display: flex; justify-content: center; background-color: #0000';
    var syncButtonText = document.createElement('DIV');
    syncButtonText.style = 'width: 20px; height: 16px; color: #fffc; background-color: #0000; border: 2px solid #fffc; text-align: center; line-height: 11px; font-family: \'Font Awesome 5 Free\'; font-size: 9px; font-weight: 900; mix-blend-mode: normal;';
    syncButtonText.innerHTML = '';
    syncButton.appendChild(syncButtonText);
    var syncButtonTooltip = document.createElement('DIV');
    syncButtonTooltip.style = 'position: absolute; bottom: 68px; transition: 100ms cubic-bezier(0, .25, .25, 1) 500ms; transform: translate(0, 50%); visibility: hidden;';
    var syncButtonTooltipText = document.createElement('DIV');
    syncButtonTooltipText.innerHTML = 'Synchronize';
    syncButtonTooltipText.style = 'color: #000; background-color: #fff; font-size: 9px; border-radius: 1px; padding: 4px 10px;';
    syncButtonTooltip.appendChild(syncButtonTooltipText);
    var syncButtonTooltipPointer = document.createElement('DIV');
    syncButtonTooltipPointer.style = 'display: block; box-sizing: border-box; position: absolute; top: 100%; left: 50%; width: 10px; height: 9px; border-radius: 1px; transform: translate(-50%, -50%) rotate(45deg); z-index: -1; background-color: #fff;';
    syncButtonTooltip.appendChild(syncButtonTooltipPointer);
    syncButton.appendChild(syncButtonTooltip);
    syncButton.onmouseover = (e) => {
        if (synced) {
            // TODO
            syncButtonText.style.color = '#000';
            syncButtonText.style.borderColor = '#fff';
            syncButtonText.style.backgroundColor = '#fff';
            syncButtonText.style.mixBlendMode = 'lighten';
        } else {
            syncButtonText.style.color = '#fff';
            syncButtonText.style.borderColor = '#fff';
            syncButtonText.style.backgroundColor = '#0000';
            syncButtonText.style.mixBlendMode = 'normal';
        }
        syncButtonTooltip.style.transform = 'none';
        syncButtonTooltip.style.visibility = 'visible';
        syncButtonTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 500ms';
    };
    syncButton.onmouseout = (e) => {
        if (synced) {
            // TODO
            syncButtonText.style.color = '#000c';
            syncButtonText.style.borderColor = '#fff0';
            syncButtonText.style.backgroundColor = '#fffc';
            syncButtonText.style.mixBlendMode = 'lighten';
        } else {
            syncButtonText.style.color = '#fffc';
            syncButtonText.style.borderColor = '#fffc';
            syncButtonText.style.backgroundColor = '#0000';
            syncButtonText.style.mixBlendMode = 'normal';
        }
        syncButtonTooltip.style.transform = 'translate(0, 50%)';
        syncButtonTooltip.style.visibility = 'hidden';
        syncButtonTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 0ms';
    };
    syncButton.onclick = (e) => {
        if (synced) {
            syncButtonText.style.color = '#fff';
            syncButtonText.style.borderColor = '#fff';
            syncButtonText.style.backgroundColor = '#0000';
            syncButtonText.style.mixBlendMode = 'normal';
            syncButtonTooltipText.innerHTML = 'Synchronize';
            unsync();
        } else {
            // TODO Copy from onmouseover
            syncButtonText.style.color = '#000';
            syncButtonText.style.borderColor = '#fff';
            syncButtonText.style.backgroundColor = '#fff';
            syncButtonText.style.mixBlendMode = 'lighten';
            syncButtonTooltipText.innerHTML = 'Synchronized (' + participants + ')';
            sync();
        }
    };

    var stretchCombo = document.createElement('DIV');
    stretchCombo.style = 'height: 44px; align-items: center; display: flex; justify-content: center; color: fffc;';
    var stretchComboSelect = document.createElement('SELECT');
    stretchComboSelect.style = 'width: 20px; height: 16px; margin: 12px; cursor: pointer; font-family: \'Font Awesome 5 Free\'; font-size: 11px; font-weight: 900; text-align-last: center; background-color: #fff; color: #000; border: 0px none; -webkit-appearance: none; -moz-appearance: none; appearance: none; outline: none !important;';
    var stretchComboSelectOption = document.createElement('OPTION');
    stretchComboSelectOption.value = 'uniform';
    stretchComboSelectOption.title = 'Fit';
    stretchComboSelectOption.innerHTML = '';
    stretchComboSelect.appendChild(stretchComboSelectOption);
    stretchComboSelectOption = document.createElement('OPTION');
    stretchComboSelectOption.value = 'fill';
    stretchComboSelectOption.title = 'Fill';
    stretchComboSelectOption.innerHTML = '';
    stretchComboSelect.appendChild(stretchComboSelectOption);
    stretchComboSelectOption = document.createElement('OPTION');
    stretchComboSelectOption.value = 'exactfit';
    stretchComboSelectOption.title = 'Stretch';
    stretchComboSelectOption.innerHTML = '';
    stretchComboSelect.appendChild(stretchComboSelectOption);
    stretchComboSelectOption = document.createElement('OPTION');
    stretchComboSelectOption.value = 'none';
    stretchComboSelectOption.title = 'Center';
    stretchComboSelectOption.innerHTML = '';
    stretchComboSelect.appendChild(stretchComboSelectOption);
    stretchComboSelect.selectedIndex = [ 'uniform', 'fill', 'exactfit', 'none' ].indexOf(player.getStretching());
    stretchComboSelect.onchange = (e) => {
        player.setConfig({ stretching: stretchComboSelect.value });
    };
    stretchCombo.appendChild(stretchComboSelect);
    var stretchComboTooltip = document.createElement('DIV');
    stretchComboTooltip.style = 'position: absolute; bottom: 68px; transition: 100ms cubic-bezier(0, .25, .25, 1) 500ms; transform: translate(0, 50%); visibility: hidden;';
    var stretchComboTooltipText = document.createElement('DIV');
    stretchComboTooltipText.innerHTML = 'Image adjust';
    stretchComboTooltipText.style = 'color: #000; background-color: #fff; font-size: 9px; border-radius: 1px; padding: 4px 10px;';
    stretchComboTooltip.appendChild(stretchComboTooltipText);
    var stretchComboTooltipPointer = document.createElement('DIV');
    stretchComboTooltipPointer.style = 'display: block; box-sizing: border-box; position: absolute; top: 100%; left: 50%; width: 10px; height: 9px; border-radius: 1px; transform: translate(-50%, -50%) rotate(45deg); z-index: -1; background-color: #fff;';
    stretchComboTooltip.appendChild(stretchComboTooltipPointer);
    stretchCombo.appendChild(stretchComboTooltip);
    stretchCombo.onmouseover = (e) => {
        stretchCombo.style.color = '#fff';
        stretchComboTooltip.style.transform = 'none';
        stretchComboTooltip.style.visibility = 'visible';
        stretchComboTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 500ms';
    };
    stretchCombo.onmouseout = (e) => {
        stretchCombo.style.color = '#fffc';
        stretchComboTooltip.style.transform = 'translate(0, 50%)';
        stretchComboTooltip.style.visibility = 'hidden';
        stretchComboTooltip.style.transition = '100ms cubic-bezier(0, .25, .25, 1) 0ms';
    };

    var buttonContainer = document.getElementsByClassName('jw-button-container')[0];
    function layoutUi() {
        var ccButton = buttonContainer.getElementsByClassName('jw-icon-cc')[0];
        buttonContainer.insertBefore(syncButton, ccButton);
        buttonContainer.insertBefore(stretchCombo, syncButton);

        function fixButtonsSize() {
            if (ccButton.clientHeight < 60) {
                syncButton.style.width = '44px';
                syncButton.style.height = '44px';
                syncButtonText.style.width = '20px';
                syncButtonText.style.height = '16px';
                syncButtonText.style.borderWidth = '2px';
                syncButtonText.style.lineHeight = '11px';
                syncButtonText.style.fontSize = '9px';
                syncButtonTooltip.style.bottom = '68px';
                syncButtonTooltipText.style.fontSize = '9px';
                syncButtonTooltipText.style.padding = '4px 10px';
                syncButtonTooltipPointer.style.width = '10px';
                syncButtonTooltipPointer.style.height = '9px';

                stretchCombo.style.height = '44px;';
                stretchComboSelect.style.width = '20px';
                stretchComboSelect.style.height = '16px';
                stretchComboSelect.style.margin = '12px';
                stretchComboSelect.style.fontSize = '11px';
                stretchComboTooltip.style.bottom = '68px';
                stretchComboTooltipText.style.fontSize = '9px';
                stretchComboTooltipText.style.padding = '4px 10px';
                stretchComboTooltipPointer.style.width = '10px';
                stretchComboTooltipPointer.style.height = '9px';
            } else {
                syncButton.style.width = '60px';
                syncButton.style.height = '60px';
                syncButtonText.style.width = '25px';
                syncButtonText.style.height = '20px';
                syncButtonText.style.borderWidth = '3px';
                syncButtonText.style.lineHeight = '13px';
                syncButtonText.style.fontSize = '12px';
                syncButtonTooltip.style.bottom = '83px';
                syncButtonTooltipText.style.fontSize = '16px';
                syncButtonTooltipText.style.padding = '7px 10px';
                syncButtonTooltipPointer.style.width = '11px';
                syncButtonTooltipPointer.style.height = '10px';

                stretchCombo.style.height = '60px;';
                stretchComboSelect.style.width = '25px';
                stretchComboSelect.style.height = '20px';
                stretchComboSelect.style.margin = '20px';
                stretchComboSelect.style.fontSize = '13px';
                stretchComboTooltip.style.bottom = '83px';
                stretchComboTooltipText.style.fontSize = '16px';
                stretchComboTooltipText.style.padding = '7px 10px';
                stretchComboTooltipPointer.style.width = '11px';
                stretchComboTooltipPointer.style.height = '10px';
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
