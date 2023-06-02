import BareClient, {BareFetchInit, createBareClient} from "@tomphttp/bare-client";
import $ from 'cash-dom';
import * as async from 'modern-async';
import {createRoot} from "react-dom/client";
import App from "./components/Root";
import CookiePopupBlockerResponder from "./extensionResponders/cookiePopupBlocker";
import to from "await-to-js";
import {listenForWebViewMessages} from "./communication";
import Product from "../shared/product";

document.title = Product.productName;

const serverUrl = 'http://localhost:8080';
$(async () => {
    const extensionResponders = [new CookiePopupBlockerResponder()];

    let err, bareClient: BareClient
    [err, bareClient] = await to(createBareClient(`${serverUrl}/bare/`));
    if (err)
        console.error("❌ Failed to connect to initialise Bare Client", err);
    else {
        // @ts-ignore
        window.fetch = (input, init) => {
            try {
                return bareClient.fetch(input, init as BareFetchInit);
            } catch (err) {
                console.error("❌ Failed to fetch", err);
                throw err;
            }
        }
    }

    listenForWebViewMessages(async message => {
        const iframe = <HTMLIFrameElement>document.getElementById('webview');
        const type = message.type;

        const sendResponse = (response: any) => iframe.contentWindow.postMessage(JSON.stringify(response), '*');
        await async.forEach(extensionResponders, extensionResponder => {
            if (type.startsWith(extensionResponder.messagePrefix))
                extensionResponder.onMessage(message, sendResponse);
        });
    });

    const root = createRoot($('#app').get(0));
    root.render(App());
    console.log("✅ Initialised React UI");
});
