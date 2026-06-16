"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
var client_1 = require("@prisma/client");
var prisma = null;
function getPrisma() {
    if (!process.env.DATABASE_URL)
        return null;
    if (!prisma)
        prisma = new client_1.PrismaClient();
    return prisma;
}
