import * as SQLite from 'expo-sqlite';

export const initDb = async () => {
    const db = await SQLite.openDatabaseAsync('bbus');

    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS bus (id VARCHAR(512) PRIMARY KEY NOT NULL, busPlateNumber VARCHAR(512), routeId VARCHAR(512), data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS route (id VARCHAR(512) PRIMARY KEY NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS access_card (id VARCHAR(512) PRIMARY KEY NOT NULL, organizationId VARCHAR(512), cardId VARCHAR(512), data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS journey (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
    `);

    return db;
}

export const getBusByNumber = async (db: SQLite.SQLiteDatabase, busNumber: string) => {
    const bus = await db.getFirstAsync('SELECT * FROM bus WHERE busPlateNumber = ?', busNumber);
    return bus
}

export const getBuses = async (db: SQLite.SQLiteDatabase) => {
    const buses = await db.getAllAsync('SELECT * FROM bus WHERE 1');
    return buses
}

export const updateBuses = async (db: SQLite.SQLiteDatabase, buses: any) => {
    buses.forEach(async (bus: any) => {
        await db.runAsync('INSERT OR REPLACE INTO bus (id, busPlateNumber, routeId, data) VALUES (?, ?, ?, ?)', bus.id, bus.busPlateNumber, bus.routeId, JSON.stringify(bus));
    });
}

export const getRoutes = async (db: SQLite.SQLiteDatabase) => {
    const buses = await db.getAllAsync('SELECT * FROM route WHERE 1');
    return buses
}

export const updateRoutes = async (db: SQLite.SQLiteDatabase, routes: any) => {
    routes.forEach(async (route: any) => {
        await db.runAsync('INSERT OR REPLACE INTO route (id, data) VALUES (?, ?)', route.id, JSON.stringify(route));
    });
}

export const getCardById = async (db: SQLite.SQLiteDatabase, cardId: string) => {
    const accessCard = await db.getFirstAsync('SELECT * FROM access_card WHERE cardId = ?', cardId);
    return accessCard
}

export const getAccessCards = async (db: SQLite.SQLiteDatabase) => {
    const accessCards = await db.getAllAsync('SELECT * FROM access_card WHERE 1');
    return accessCards
}

export const updateAccessCards = async (db: SQLite.SQLiteDatabase, accessCards: any) => {
    accessCards.forEach(async (card: any) => {
        await db.runAsync('INSERT OR REPLACE INTO access_card (id, organizationId, cardId, data) VALUES (?, ?, ?, ?)', card.id, card.organizationId, card.cardId, JSON.stringify(card));
    });
}

export const postponeJourney = async (db: SQLite.SQLiteDatabase, journey: any) => {
    await db.runAsync('INSERT OR REPLACE INTO journey (id, data) VALUES (NULL, ?)', JSON.stringify(journey));
}