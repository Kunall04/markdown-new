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

// const simple = '<html><body><h1>Hello</h1><p>Simple page</p></body></html>';
// const complex = '<html>' + Array(7).fill('<script>x</script>').join('') + '<body><p>Article</p></body></html>';
// const jsHeavy = Array(12).fill('<script>x</script>').join('') + '<div id="__NEXT_DATA__"></div>';

// console.log(detectPageType(simple));   // SIMPLE
// console.log(detectPageType(complex));  // COMPLEX
// console.log(detectPageType(jsHeavy)); // JS_HEAVY