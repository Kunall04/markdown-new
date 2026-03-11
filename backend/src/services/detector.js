const JS_FRAMEWORK=[
    '__NEXT_DATA__',
    '__next',            //Next.js root div
    'react-root',       //React
    'data-reactroot',   //React
    'ng-app',           //Angular
    '__nuxt',           //Nuxt.js
    '__vue',            //Vue
    'data-n-head',      //Nuxt
]

//emptty SPA shells
const EMPTY_ROOT_RE = /<div\s+id=["'](root|app|__next)["']\s*>\s*<\/div>/i;

//detect vite script
const MODULE_SCRIPT_RE = /<script\s[^>]*type=["']module["'][^>]*>/i;

export function detectPageType(html) {
    //cnt script
    const scriptTags=(html.match(/<script[\s >]/gi) || []).length;

    const htmlwithoutScripts=html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const contentlength=htmlwithoutScripts.length;

    const isjsFramework=JS_FRAMEWORK.some(marker => html.includes(marker));
    const hasEmptyRoot=EMPTY_ROOT_RE.test(html);
    const hasModuleScript=MODULE_SCRIPT_RE.test(html);

    const isThinContent=contentlength<1000;

    //empty SPA
    if(hasEmptyRoot && (hasModuleScript || isjsFramework)) {
        return {
            type: 'JS_HEAVY',
            reason: 'Empty SPA root container — needs browser rendering',
        };
    }

    if(scriptTags>10 && isjsFramework) {
        return {
            type: 'JS_HEAVY',
            reason: `${scriptTags} script tags + JS framework detected`,
        };
    }

    if(isThinContent && isjsFramework) {
        return {
            type: 'JS_HEAVY',
            reason: 'Thin content with JS framework — needs browser rendering',
        };
    }

    if(isThinContent && hasModuleScript) {
        return {
            type: 'JS_HEAVY',
            reason: 'Thin content with module script — likely SPA',
        };
    }

    if (scriptTags > 5 || isThinContent) {
        return {
            type: 'COMPLEX',
            reason: `${scriptTags} script tags — using Readability`,
        };
    }

    return {
        type: 'SIMPLE',
        reason: `${scriptTags} script tags — clean static HTML`,
    };
}
