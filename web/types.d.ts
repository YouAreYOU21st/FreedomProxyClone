import 'vite/client';
import Helper from "./helper";

declare global {
    interface Window {
        helper: Helper;
    }
}
