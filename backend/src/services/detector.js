const JS_FRAMEWORK=[
    '__NEXT_DATA__',
    'react-root',       //React
    'data-reactroot',   //React
    'ng-app',           //Angular
    '__nuxt',           //Nuxt.js
    '__vue',            //Vue
    'data-n-head',      //Nuxt
]

export function detectPageType(html) {
    const scriptTags=(html.match(/<script>/gi) || []).length;

    const htmlwithoutScripts=html.replace(/<script[\s\S]*?<\/script>/gi, '');
    const contentlength=htmlwithoutScripts.length;

    const isjsFramework=JS_FRAMEWORK.some(marker => html.includes(marker));

    const isThinContent=contentlength<1000;

    if(script>10 && isjsFramework) {
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
}