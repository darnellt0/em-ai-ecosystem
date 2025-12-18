"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAgentOutput = validateAgentOutput;
exports.validateActionPack = validateActionPack;
function validateAgentOutput(obj) {
    const reasons = [];
    if (!obj || typeof obj !== 'object') {
        reasons.push('Output not an object');
        return { valid: false, reasons };
    }
    if (!['OK', 'SKIPPED', 'FAILED'].includes(obj.status)) {
        reasons.push('Invalid status');
    }
    return { valid: reasons.length === 0, reasons };
}
function validateActionPack(pack) {
    const reasons = [];
    if (!pack || typeof pack !== 'object') {
        reasons.push('ActionPack not object');
    }
    return { valid: reasons.length === 0, reasons };
}
//# sourceMappingURL=validation.js.map