export function extend({ parent, child }) {
    const proxy = new Proxy({}, {
        get(target, prop) {
            return child[prop] || parent[prop];
        },
        set(target, prop, value) {
            child[prop] = value;
            return true;
        },
        has(target, prop) {
            return prop in child || prop in parent;
        },
        ownKeys() {
            const parentKeys = Object.getOwnPropertyNames(parent);
            const childKeys = Object.getOwnPropertyNames(child);
            return [...new Set([...parentKeys, ...childKeys]).values()];
        },
        getOwnPropertyDescriptor(target, prop) {
            return {
                enumerable: !prop.toString().startsWith('_'),
                configurable: true,
            };
        },
    });
    return proxy;
}
