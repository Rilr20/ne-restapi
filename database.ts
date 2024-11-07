import sqlite3 from 'better-sqlite3';

const db = new sqlite3("./db/db.db")

export async function initialise(): Promise<boolean> {
    try {
        // Create CartToUser table
        // await db.run(`
        //     CREATE TABLE IF NOT EXISTS "CartToUser" (
        //         "id" INTEGER,
        //         "user_id" INTEGER,
        //         "cart_id" INTEGER,
        //         PRIMARY KEY("id" AUTOINCREMENT),
        //         FOREIGN KEY("user_id") REFERENCES "Users"("id")
        //     )
        //     `);

        // Create Users table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS "Users" (
                "id" INTEGER,
                "username" TEXT,
                "password" TEXT,
                "admin" INTEGER,
                "token" TEXT,
                PRIMARY KEY("id" AUTOINCREMENT)
            )
            `);

        // Create Cart table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS "Cart" (
                "id" INTEGER,
                "item_id" INTEGER,
                "amount" INTEGER,
                PRIMARY KEY("id")
            )
            `);

        // Create Books table
        await db.exec(`
            CREATE TABLE IF NOT EXISTS "Books" (
                "id" INTEGER,
                "title" TEXT,
                "cost" INTEGER,
                "inventory" INTEGER,
                "limited" INTEGER,
                PRIMARY KEY("id" AUTOINCREMENT)
            )
            `);



        const insertUsers = db.prepare('INSERT INTO Users (username, password, admin, token) VALUES (@username, @password,@admin,@token);')

        const userData = db.transaction((users) => {
            for (const user of users) insertUsers.run(user)
        })

        userData([{
            "username": "Uncle_Bob_1337",
            "password": "$2a$10$WFmBGMzwfrQv9//UnFOI/OGAmZIE9t0nmY1Nx8QQKgP4YIhYVa53i",
            "admin": 1,
            "token": "0dc29b0680d0709d19bf833d502c2849650e5437"
        }])

        const insertBooks = db.prepare('INSERT INTO Books (title, cost, inventory, limited) VALUES (@title, @cost, @inventory, @limited)')

        const booksData = db.transaction((books) => {
            for (const book of books) insertBooks.run(book)
        })

        booksData([
            { title: "Fellowship of the book", cost: 5, inventory: 40, limited: 0 },
            { title: "Books and the chamber of books", cost: 10, inventory: 10, limited: 0 },
            { title: "The Return of the Book", cost: 15, inventory: 9, limited: 0 },
            { title: "Fellowship of the book", cost: 75, inventory: 9, limited: 1 }
        ])

        const insertCart = db.prepare('INSERT INTO Cart (item_id, amount) VALUES (@item_id, @amount)')

        const cartData = db.transaction((items) => {
            for (const item of items) insertCart.run(item)
        })

        cartData([{ item_id: 1, amount: 2 }])

        console.log("Tables Initialized");

        return true
    } catch (err) {
        console.error(err);
        return false
    }
}

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

async function getCartValue() {
    const stmt = db.prepare(`SELECT b.cost, c.item_id, c.amount from Cart c JOIN Books b ON b.id = c.item_id;`)
    let row =  stmt.get()
    console.log(row);
    
    return 0
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