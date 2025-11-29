import { makeAuthenticatedRequest } from '@/lib/request';
import * as SQLite from 'expo-sqlite';
let db: SQLite.SQLiteDatabase | null = null;

export const initDb = async () => {
    if (db == null) {
        db = await SQLite.openDatabaseAsync('bbus');
    }

    await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS bus (id VARCHAR(512) PRIMARY KEY NOT NULL, busPlateNumber VARCHAR(512), routeId VARCHAR(512), data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS route (id VARCHAR(512) PRIMARY KEY NOT NULL, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS access_card (id VARCHAR(512) PRIMARY KEY NOT NULL, organizationId VARCHAR(512), cardId VARCHAR(512), data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS journey (id INTEGER PRIMARY KEY, data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS log (id INTEGER PRIMARY KEY, message VARCHAR(512), data TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);

    return db;
}

export const getBusByNumber = async (db: SQLite.SQLiteDatabase, busNumber: string) => {
    const bus = await db.getFirstAsync('SELECT * FROM bus WHERE busPlateNumber = ?', busNumber);
    return bus
}

export const getBusesCount = async (db: SQLite.SQLiteDatabase) => {
    const busesCount: any = await db.getAllAsync('SELECT COUNT(*) as num FROM bus WHERE 1');
    return busesCount[0]["num"]
}

export const updateBuses = async (db: SQLite.SQLiteDatabase, buses: any) => {
    await db.runAsync('DELETE FROM bus');
    for (let i in buses) {
        let bus = buses[i];
        await db.runAsync('INSERT INTO bus (id, busPlateNumber, routeId, data) VALUES (?, ?, ?, ?)', bus.id, bus.busPlateNumber, bus.routeId, JSON.stringify(bus));
    }
}

export const getRoutes = async (db: SQLite.SQLiteDatabase) => {
    const buses = await db.getAllAsync('SELECT * FROM route WHERE 1');
    return buses
}

export const updateRoutes = async (db: SQLite.SQLiteDatabase, routes: any) => {
    await db.runAsync('DELETE FROM route');
    routes.forEach(async (route: any) => {
        await db.runAsync('INSERT INTO route (id, data) VALUES (?, ?)', route.id, JSON.stringify(route));
    });
}

export const getCardById = async (db: SQLite.SQLiteDatabase, cardId: string, organizationId: string) => {
    const accessCard = await db.getFirstAsync('SELECT * FROM access_card WHERE cardId = ? AND organizationId = ? ', cardId, organizationId);
    return accessCard
}

export const getAccessCards = async (db: SQLite.SQLiteDatabase) => {
    const accessCards = await db.getAllAsync('SELECT * FROM access_card WHERE 1');
    return accessCards
}

export const updateAccessCards = async (db: SQLite.SQLiteDatabase, accessCards: any) => {
    await db.runAsync('DELETE FROM access_card');
    accessCards.forEach(async (card: any) => {
        await db.runAsync('INSERT INTO access_card (id, organizationId, cardId, data) VALUES (?, ?, ?, ?)', card.id, card.organizationId, card.cardId, JSON.stringify(card));
    });
}

export const postponeJourney = async (db: SQLite.SQLiteDatabase, journey: any) => {
    await db.runAsync('INSERT INTO journey (id, data) VALUES (NULL, ?)', JSON.stringify(journey));
}

export const getJourneys = async (db: SQLite.SQLiteDatabase) => {
    return await db.getAllAsync('SELECT * FROM journey WHERE 1')
}

export const deleteJourney = async (db: SQLite.SQLiteDatabase, id: number) => {
    await db.getAllAsync('DELETE FROM journey WHERE id = ?', id);
}

export const getNewBuses = async (db: SQLite.SQLiteDatabase, sessionId: string | undefined) => {
    let buses = await makeAuthenticatedRequest('buses?userId='+sessionId);
    if (buses?.error) {
        console.log(buses.error);
        return;
    }
    await updateBuses(db, buses);
}

export const getNewRoutes = async(db: SQLite.SQLiteDatabase, sessionId: string | undefined) => {
    let routes = await makeAuthenticatedRequest('routes?userId='+sessionId);
    if (routes?.error) {
        console.log(routes.error);
        return;
    }
    updateRoutes(db, routes);
    return routes;
}

export const getNewAccessCards = async (db: SQLite.SQLiteDatabase, sessionId: string | undefined) => {
    const cards = await makeAuthenticatedRequest('access-cards?userId='+sessionId);
    if (cards?.error) {
        console.log(cards.error);
        return;
    }
    updateAccessCards(db, cards);
    return cards;
}

export const addLog = async (db: SQLite.SQLiteDatabase, message: string, data: any) => {
    await db.runAsync('INSERT INTO log (id, message, data) VALUES (NULL, ?, ?)', message, JSON.stringify(data));
    await db.runAsync(`DELETE FROM log WHERE id NOT IN ( SELECT id FROM log ORDER BY created_at DESC LIMIT 1000 )`);
}

export const getLog = async (db: SQLite.SQLiteDatabase) => {
    return await db.getAllAsync('SELECT * FROM log WHERE 1 ORDER BY created_at DESC LIMIT 0, 1000');
}

export const clearLog = async (db: SQLite.SQLiteDatabase) => {
    await db.runAsync('DELETE FROM log');
}