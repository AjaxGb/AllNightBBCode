// ==UserScript==
// @name         All Night BBCode
// @version      0.1
// @description  Fix broken BBCode on the All Night Laundry comic
// @author       AjaxGb
// @match        http*://www.all-night-laundry.com/post/*
// @icon         http://www.all-night-laundry.com/static/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const origMSPAFontSizePx = 13;

    const content = document.getElementById('content');
    content.innerHTML = content.innerHTML.replace(
        /\[size=(\d+)\](.*?)\[\/size\]/g,
        (_, size, text) => `<span style="font-size:${size / origMSPAFontSizePx * 100}%">${text}</span>`);
})();
