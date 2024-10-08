/// <reference path="../shared/navigationApi.d.ts" />
/// <reference path="./types.d.ts" />

import {BareClient, createBareClient} from "@tomphttp/bare-client";
import $ from 'cash-dom';
import * as async from 'modern-async';
import App from "./components/Root";
import CookiePopupBlockerResponder from "./extensionResponders/cookiePopupBlocker";
import to from "await-to-js";
import {listenForWebViewMessages} from "./communication";
import Product from "../shared/product";
import Utils from "../shared/utils";
import {render} from "preact";
import Polyfill from "./polyfill";

document.title = Product.productName;

const serverUrl = import.meta.env.VITE_ENDPOINT ?? 'http://localhost:8080';

Polyfill.loadPolyfills();

$(async () => {
    const extensionResponders = [new CookiePopupBlockerResponder()];

    if (Utils.isChromium && window.navigation) {
        let err, bareClient: BareClient | undefined;
        [err, bareClient] = await to(createBareClient(`${serverUrl}/bare/`));
        if (err)
            console.error("❌ Failed to connect to initialise Bare Client", err);
        else {
            // @ts-ignore
            window.fetch = (input, init) => {
                try {
                    // @ts-ignore
                    return bareClient?.fetch(input, init);
                } catch (err) {
                    console.error("❌ Failed to fetch", err);
                    throw err;
                }
            }
        }
    }

    listenForWebViewMessages(async message => {
        const iframe = <HTMLIFrameElement>document.getElementById('webview');
        const type = message.type;

        const sendResponse = (response: any) => iframe.contentWindow?.postMessage(JSON.stringify(response), '*');
        await async.asyncForEach(extensionResponders, extensionResponder => {
            if (type?.startsWith(extensionResponder.messagePrefix))
                extensionResponder.onMessage(message, sendResponse);
        });
    });

    render(App(), document.getElementById('app')!);
    console.log("✅ Initialised Preact UI");
});
