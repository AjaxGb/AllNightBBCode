// ==UserScript==
// @name         All Night BBCode
// @version      0.3
// @description  Fix broken BBCode on the All Night Laundry comic
// @author       AjaxGb
// @match        http*://www.all-night-laundry.com/post/*
// @icon         http://www.all-night-laundry.com/static/favicon.ico
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle('.ui-widget-content .quote { border-color: rgb(210, 210, 210); }');

    const origMSPAFontSizePx = 13;

    function getElementDisplayName(el) {
        let display = el.tagName;
        if (el.id) display += '#'+el.id;
        if (el.className) display += '.'+[...el.classList].join('.');
        return display;
    }

    function walkNodes(walker, {addToNode, addToName}) {
        for (let node = walker.currentNode; node;) {
            let newAddTo = null;
            switch (node.nodeType) {
                case Node.ELEMENT_NODE:
                {
                    if (walker.firstChild()) {
                        console.group(getElementDisplayName(node), node);
                        try {
                            walkNodes(walker, {});
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
                    const tagMatch = node.data.match(/\[size=(\d+)\]|\[quote=([^;\]]+);\d+\]|\[\/(size|quote)\]/);
                    if (tagMatch) {
                        const [tagText, sizePxText, quoteName, endTag] = tagMatch;
                        const tagTextNode = node.splitText(tagMatch.index);
                        const nextTextNode = tagTextNode.splitText(tagText.length);
                        //  node  tagTextNode nextTextNode
                        // "blah"   "[tag]"   "blah"

                        if (endTag) {
                            if (addToName !== endTag) {
                                throw new Error(`Closed [${endTag}] tag when no such tag available`);
                            }
                            tagTextNode.replaceWith(nextTextNode);
                            if (addToNode) {
                                addToNode.append(node);
                            }
                            return;
                        } else {
                            let walkArgs;

                            if (tagText.startsWith('[size=')) {
                                const sizePx = parseInt(sizePxText);
                                const span = document.createElement('span');
                                const currFontSize = tagTextNode.parentElement.computedStyleMap().get('font-size');
                                if (currFontSize.unit !== 'px') {
                                    throw new Error('computedStyleMap() font-size was not px: '+currFontSize.unit);
                                }
                                span.style.fontSize = `${Math.round(currFontSize.value * sizePx / origMSPAFontSizePx)}px`;
                                tagTextNode.replaceWith(span);

                                walkArgs = {addToNode: span, addToName: 'size'};

                            } else if (tagText.startsWith('[quote=')) {
                                const quoteBlock = document.createElement('div');
                                quoteBlock.className = 'quote';
                                const quoteTitle = document.createElement('span');
                                quoteTitle.className = 'quote_author';
                                const quoteStrong = document.createElement('strong');
                                quoteStrong.append(quoteName);
                                quoteTitle.append(quoteStrong);
                                quoteBlock.append(quoteTitle);
                                quoteBlock.append(document.createElement('br'));
                                tagTextNode.replaceWith(quoteBlock);

                                walkArgs = {addToNode: quoteBlock, addToName: 'quote'};
                            }

                            walker.currentNode = nextTextNode;
                            console.group(tagText);
                            try {
                                walkNodes(walker, walkArgs);
                            } finally {
                                console.groupEnd();
                            }
                            walker.currentNode = node;
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

    const whatToWalk = NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT | NodeFilter.SHOW_COMMENT;
    function fixBBCode(element) {
        const walker = document.createTreeWalker(element, whatToWalk);
        if (walker.firstChild()) {
            console.groupCollapsed('All Night BBCode debug tree', element);
            try {
                walkNodes(walker, {});
            } catch (err) {
                alert('All Night BBCode error! ' + err);
                throw err;
            } finally {
                console.groupEnd();
            }
        }
    }
    window.allNightBBCode_fixBBCode = fixBBCode;

    fixBBCode(document.getElementById('main_content'));
    fixBBCode(document.getElementById('notes'));
})();
