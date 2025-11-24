import { makeAuthenticatedRequest } from '@/lib/request';
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

export const getBusesCount = async (db: SQLite.SQLiteDatabase) => {
    const busesCount: any = await db.getAllAsync('SELECT COUNT(*) as num FROM bus WHERE 1');
    return busesCount[0]["num"]
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

export const getJourneys = async (db: SQLite.SQLiteDatabase) => {
    const journeys = await db.getAllAsync('SELECT * FROM journey WHERE 1');
    return journeys
}

export const deleteJourney = async (db: SQLite.SQLiteDatabase, id: number) => {
    await db.getAllAsync('DELETE FROM journey WHERE id = ?', id);
}

export const getNewBuses = async (db: SQLite.SQLiteDatabase, sessionId: string) => {
    let buses = await makeAuthenticatedRequest('buses?userId='+sessionId);
    if (buses?.error) {
        console.log(buses.error);
        return;
    }
    updateBuses(db, buses);
    return buses;
}

export const getNewRoutes = async(db: SQLite.SQLiteDatabase, sessionId: string) => {
    let routes = await makeAuthenticatedRequest('routes?userId='+sessionId);
    if (routes?.error) {
        console.log(routes.error);
        return;
    }
    updateRoutes(db, routes);
    return routes;
}

export const getNewAccessCards = async (db: SQLite.SQLiteDatabase, sessionId: string) => {
    const cards = await makeAuthenticatedRequest('access-cards?userId='+sessionId);
    if (cards?.error) {
        console.log(cards.error);
        return;
    }
    updateAccessCards(db, cards);
    return cards;
}