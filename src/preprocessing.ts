import {CheerioAPI} from "cheerio";
import isRelativeUrl from "is-relative-url";
import * as _ from 'lodash-es';
import Network from "./network";

export function htmlAbsolutifyUrls(baseUrl: string, $: CheerioAPI) {
    const selector = [
        'a[href]',
        'img[src]',
        'img[srcset]',
        'script[src]',
        'link[href]',
        'source[src]',
        'track[src]',
        'img[src]',
        'frame[src]',
        'iframe[src]'
    ].join(',');

    $(selector).each((i, el) => {
        const $el = $(el);
        const tagName = _.toLower($el.prop('tagName'));
        const href = $el.attr('href');
        const src = $el.attr('src');
        const srcset = $el.attr('srcset');
        const content = $el.attr('content');

        const resolveUrl = (url: string, attr: 'src' | 'href' | 'srcset' | 'content') => {
            if (attr === 'srcset') {
                const urls = url.split(',').map(url => url.trim().split(' ')[0]);
                const absoluteUrls = urls.map(thisUrl => `${Network.currentAddress}/mask?url=${_.toString(new URL(thisUrl, baseUrl))}`);
                const absoluteSrcset = absoluteUrls.join(', ');
                $el.attr(attr, absoluteSrcset);
                return;
            }

            if (isRelativeUrl(url) && url !== '#') {
                if (tagName === 'a' && attr === 'href') {
                    $el.attr(attr, 'javascript:void(0);');
                    return;
                }

                const absoluteUrl = `${Network.currentAddress}/mask?url=${new URL(url, baseUrl).toString()}`;
                $el.attr(attr, absoluteUrl);
            }
        }

        if (!_.isNil(href))
            resolveUrl(href, 'href');

        if (!_.isNil(src))
            resolveUrl(src, 'src');

        if (!_.isNil(srcset))
            resolveUrl(srcset, 'srcset');

        if (!_.isNil(content))
            resolveUrl(content, 'content');
    });
}

export function cssAbsolutifyUrls(baseUrl: string, $: CheerioAPI) {
    $('link[rel="stylesheet"]').each((i, el) => {
        const $el = $(el);
        const href = $el.attr('href');
        if (!_.isNil(href)) {
            const absoluteUrl = `${Network.currentAddress}/mask?url=${new URL(href, baseUrl).toString()}`;
            $el.attr('href', absoluteUrl);
        }
    });

    $('style').each((i, el) => {
        const $el = $(el);
        const css = $el.html();
        if (!_.isNil(css)) {
            const absoluteCss = css.replace(/url\((.*?)\)/g, (match, url) => {
                if (isRelativeUrl(url)) {
                    const absoluteUrl = `${Network.currentAddress}/mask?url=${new URL(url, baseUrl).toString()}`;
                    return `url(${absoluteUrl})`;
                }
                return match;
            });
            $el.html(absoluteCss);
        }
    });
}
