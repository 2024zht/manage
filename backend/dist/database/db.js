"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAll = exports.getOne = exports.runQuery = exports.db = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = process.env.DATABASE_PATH || path_1.default.join(__dirname, '../../database.sqlite');
exports.db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    }
    else {
        console.log('Connected to SQLite database');
    }
});
const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        exports.db.run(sql, params, (err) => {
            if (err)
                reject(err);
            else
                resolve();
        });
    });
};
exports.runQuery = runQuery;
const getOne = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        exports.db.get(sql, params, (err, row) => {
            if (err)
                reject(err);
            else
                resolve(row);
        });
    });
};
exports.getOne = getOne;
const getAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        exports.db.all(sql, params, (err, rows) => {
            if (err)
                reject(err);
            else
                resolve(rows);
        });
    });
};
exports.getAll = getAll;
