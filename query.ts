import sqlite3 from 'better-sqlite3';
import { verifyPassword } from './helper'
import { randomBytes } from 'crypto';

const db = new sqlite3("./db/db.db")

export async function removeFromCart(itemId: number, amount: number) {
    console.log(itemId);
    console.log(amount);

    const stmt = db.prepare(`SELECT amount FROM Cart WHERE item_id = ?;`);
    let row: any = stmt.get(itemId);

    if (row.amount >= amount) {
        const query = db.prepare(`UPDATE Cart SET amount=? WHERE item_id = ?`)
        let newAmount = row.amount - amount
        query.run([newAmount, itemId])
        return true
    }
    return false
}

export async function addToCart(itemId: number, amount: number) {
    let inStock = await getInventoryById(itemId)

    let inCart = await getCartById(itemId)

    const totalInCart = amount + inCart;

    if (inStock >= totalInCart) {
        const query = inCart == 0 ? `INSERT INTO Cart (amount, item_id) VALUES(?,?)` : `UPDATE Cart SET amount = amount + ? WHERE item_id = ?`;
        const insertstmt = db.prepare(query)
        insertstmt.run([amount, itemId])

        return true
    }
    return false
}

export async function checkout(): Promise<boolean> {
    const totalValue = await getCartValue()

    if (totalValue <= 120) {
        const query = `DELETE FROM Cart;`
        db.prepare(query).run()

        return true
    }
    return false
}

async function getCartValue() {
    const stmt = db.prepare(`SELECT b.cost, c.item_id, c.amount from Cart c JOIN Books b ON b.id = c.item_id;`)
    let rows: any[] = stmt.all()
    let sum = 0
    rows.forEach((item: { cost: number, amount: number }) => {
        sum += item.cost * item.amount
    })

    return sum
}

export async function login(username: string, password: string): Promise<[boolean, string]> {
    if (username == undefined || password == undefined) {
        return [false, ""]
    }


    const stmt = db.prepare(`SELECT * FROM Users WHERE username = ?;`)
    let row: any = stmt.get(username);

    if (row == undefined) {
        return [false, ""]
    }

    const result = await verifyPassword(row.password, password)

    if (result && Boolean(row.admin)) {
        const token = await addTokenToId(row.id)

        return [true, token]
    } else if (result) {
        return [true, ""]
    }

    return [false, ""]
}

export async function addToInventory(id: number, amount: number) {
    const book = await getBookById(id)
    // console.log(book);

    if (Boolean(book.limited)) {
        console.log("i am here ;)");
        
        return false
    }
    const query = db.prepare(`UPDATE Books SET inventory=? WHERE id = ?`)
    const stockAmount = amount * 10
    query.run([stockAmount, id])
    return true
}

export async function checkInventory() {
    const stmt = db.prepare(`SELECT * FROM Books`)
    let rows: any[] = stmt.all()

    return rows
}

async function getInventoryById(itemId: number): Promise<number> {
    const stmt = db.prepare(`SELECT inventory FROM Books WHERE id = ?;`)
    let row: any = stmt.get(itemId);

    return row ? row.inventory : 0
}
async function getCartById(itemId: number): Promise<number> {
    const stmtCart = db.prepare(`SELECT amount FROM Cart WHERE id = ?;`)
    let row: any = stmtCart.get(itemId);

    return row ? row.amount : 0
}

async function getBookById(itemId: number): Promise<{ id: number, title: string, cost: number, inventory: number, limited: number }> {
    const stmtCart = db.prepare(`SELECT * FROM Books WHERE id = ?;`)
    let row: any = stmtCart.get(itemId);

    return row
}

async function addTokenToId(userId: number): Promise<string> {
    const token = randomBytes(20).toString('hex')
    const query = `UPDATE Users SET token = ? WHERE id = ?`;
    db.prepare(query).run([token, userId])
    return token
}
export async function checkToken(username: string, token: string | string[] | undefined): Promise<boolean> {
    const stmt = db.prepare(`SELECT token FROM Users WHERE username = ?;`)
    let row: any = stmt.get(username);

    if (row == undefined) {
        return false
    }

    return row.token == token ? true : false
}