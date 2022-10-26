// Webpack warns that including assets in this way will slow down builds, but that's fine for now
declare module '*.svg' {
    const content: any;
    export default content;
}

declare module '*.html' {
    const content: any;
    export default content;
}

declare module '*.css' {
    const content: any;
    export default content;
}
