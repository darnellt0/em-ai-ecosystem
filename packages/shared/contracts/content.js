"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeSlug = safeSlug;
exports.createPackId = createPackId;
function safeSlug(str) {
    return (str || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50);
}
function createPackId(topic, createdAt = new Date()) {
    const date = createdAt.toISOString().split('T')[0];
    const slug = safeSlug(topic || 'content-pack');
    return `${date}-${slug}-${Math.random().toString(36).slice(2, 8)}`;
}
//# sourceMappingURL=content.js.map