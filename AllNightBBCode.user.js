// ==UserScript==
// @name         All Night BBCode
// @version      0.2
// @description  Fix broken BBCode on the All Night Laundry comic
// @author       AjaxGb
// @match        http*://www.all-night-laundry.com/post/*
// @icon         http://www.all-night-laundry.com/static/favicon.ico
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const origMSPAFontSizePx = 13;

    function getElementDisplayName(el) {
        let display = el.tagName;
        if (el.id) display += '#'+el.id;
        if (el.className) display += '.'+[...el.classList].join('.');
        return display;
    }

    function walkNodes(walker, {addToNode = null, addToName = null} = {}) {
        for (let node = walker.currentNode; node;) {
            let newAddTo = null;
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                {
                    if (walker.firstChild()) {
                        console.group(getElementDisplayName(node), node);
                        try {
                            walkNodes(walker);
                        } finally {
                            console.groupEnd();
                        }
                        walker.parentNode();
                    } else {
                        console.log(getElementDisplayName(node), node);
                    }
                    break;
                }
                case Node.TEXT_NODE:
                {
                    console.log('TEXT:', node);
                    const tagMatch = node.data.match(/\[size=(\d+)\]|\[\/size\]/);
                    if (tagMatch) {
                        const [tagText, sizePxText] = tagMatch;
                        const tagTextNode = node.splitText(tagMatch.index);
                        const nextTextNode = tagTextNode.splitText(tagText.length);
                        //  node  tagTextNode nextTextNode
                        // "blah"   "[tag]"   "blah"

                        if (tagText.startsWith('[size=')) {
                            const sizePx = parseInt(sizePxText);
                            const span = document.createElement('span');
                            const currFontSize = tagTextNode.parentElement.computedStyleMap().get('font-size');
                            if (currFontSize.unit !== 'px') {
                                throw new Error('computedStyleMap() font-size was not px: '+currFontSize.unit);
                            }
                            span.style.fontSize = `${Math.round(currFontSize.value * sizePx / origMSPAFontSizePx)}px`;
                            tagTextNode.replaceWith(span);

                            walker.currentNode = nextTextNode;
                            console.group(tagText);
                            try {
                                walkNodes(walker, {mspaFontSizePx: sizePx, addToNode: span, addToName: 'size'});
                            } finally {
                                console.groupEnd();
                            }
                            walker.currentNode = node;

                            const oldNode = node;
                            node = walker.nextSibling();
                            if (addToNode) {
                                addToNode.append(oldNode);
                            }

                        } else if (tagText === '[/size]') {
                            if (addToName !== 'size') {
                                throw new Error('Closed [size] tag when no such tag available');
                            }
                            tagTextNode.replaceWith(nextTextNode);
                            if (addToNode) {
                                addToNode.append(node);
                            }
                            return;
                        }
                    }
                    break;
                }
            }
            const oldNode = node;
            node = walker.nextSibling();
            if (addToNode) {
                addToNode.append(oldNode);
            }
        }
        if (addToNode) {
            throw new Error(`Unclosed [${addToName}] tag`);
        }
    }
    window.allNightBBCodeWalkNodes = walkNodes;

    const content = document.getElementById('main_content');
    const whatToWalk = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT;
    const walker = document.createTreeWalker(content, whatToWalk);
    
    if (walker.firstChild()) {
        console.groupCollapsed('All Night BBCode debug tree');
        try {
            walkNodes(walker);
        } finally {
            console.groupEnd();
        }
    }
})();
