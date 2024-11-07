import * as sqlite3 from 'sqlite3'

export async function initialise() {
    const db = new sqlite3.Database("./db/db.db")
    try {
        // Create CartToUser table
        await db.run(`
            CREATE TABLE IF NOT EXISTS "CartToUser" (
                "id" INTEGER,
                "user_id" INTEGER,
                "cart_id" INTEGER,
                PRIMARY KEY("id" AUTOINCREMENT),
                FOREIGN KEY("user_id") REFERENCES "Users"("id")
            )
            `);

        // Create Users table
        await db.run(`
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
        await db.run(`
            CREATE TABLE IF NOT EXISTS "Cart" (
                "id" INTEGER,
                "item_id" INTEGER,
                "amount" INTEGER,
                PRIMARY KEY("id")
            )
            `);

        // Create Books table
        await db.run(`
            CREATE TABLE IF NOT EXISTS "Books" (
                "id" INTEGER,
                "title" TEXT,
                "cost" INTEGER,
                "inventory" INTEGER,
                "limited" INTEGER,
                PRIMARY KEY("id" AUTOINCREMENT)
            )
            `);

        const userData = [{
            "name": "Uncle_Bob_1337",
            "password": "$2a$10$WFmBGMzwfrQv9//UnFOI/OGAmZIE9t0nmY1Nx8QQKgP4YIhYVa53i",
            "admin": 1,
            "token": "0dc29b0680d0709d19bf833d502c2849650e5437"
        }]

        await db.run('INSERT INTO Users (username, password, admin, token) VALUES (?,?,?,?);', userData.map((user) => [user.name, user.password, user.admin, user.token]))

        const booksData = [
            { title: "Fellowship of the book", cost: 5, inventory: 40, limited: 0 },
            { title: "Books and the chamber of books", cost: 10, inventory: 10, limited: 0 },
            { title: "The Return of the Book", cost: 15, inventory: 9, limited: 0 },
            { title: "Fellowship of the book", cost: 75, inventory: 9, limited: 1 }
        ];

        await db.run('INSERT INTO Books (title, cost, inventory, limited) VALUES (?, ?, ?, ?)',
            booksData.map(b => [b.title, b.cost, b.inventory, b.limited]));

        console.log("Tables Initialized");
        

    } catch (err) {
        console.error(err);
        
    }
}
