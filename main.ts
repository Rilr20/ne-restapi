import express from 'express';
import bodyParser from 'body-parser';
import * as fs from 'fs'
import { randomBytes } from 'crypto';
import { checkValidQuery, checkValidQueryNegative, cartValue, cleanCart, updateInventory, checkIfInventoryIsZero, findUserToken,  findUsersPassword, verifyPassword, } from './helper'


const router = express.Router()

const port = process.env.port || 1337;
const app = express();

app.get("/", (req, res) => {
    console.log("Hello World!")
    res.status(200).json({ message: "Hello World!" })
})

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json())

app.use((req, res, next) => {
    console.info(`Got a request on: ${req.path} (${req.method})`)
    next();
})

app.listen(port, () => {
    console.log(`server is listening to port ${port}`)

})



/* CUSTOMER ROUTES */
/* Remove book from cart */
app.post("/remove", (req, res) => {
    const id = req.body.id
    let amount = req.body.amount
    amount = Number(amount)

    if (Number.isNaN(amount) || amount <= 0) {

        res.status(400).json({ "message": "Amount is not a number or 0 and less" })
    } else {
        const isValid = checkValidQueryNegative(id, amount)
        if (isValid) {
            let foundId = false
            const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
            data.cart.forEach((item: { amount: number, id: number }) => {
                if (item.id === id) {
                    item.amount -= amount
                    foundId = true
                }
            });
            if (!foundId) {
                data.cart.push({ id: id, amount: amount })
            }


            fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
            const totalValue = cartValue()
            // data.cart = 
            res.status(201).json({ message: `Cart removed ${amount} of book id ${id} New cart value is: ${totalValue}` })
        }
        res.status(200).json({ message: "Invalid id or amount is larger than cart amount" })

    }
})
/* Add book to cart */
app.post("/add", (req, res) => {
    const id = req.body.id
    let amount = req.body.amount
    amount = Number(amount)

    if (Number.isNaN(amount) || amount <= 0) {

        res.status(400).json({ "message": "Amount is not a number or 0 and less" })
    } else {

        const isValid = checkValidQuery(id, amount)
        /* Check if id exists */
        /* Check if amount is there */
        if (isValid) {

            // add to cart
            // save to json
            let foundId = false
            const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
            data.cart.forEach((item: { id: number; amount: number; }) => {
                if (item.id === id) {
                    item.amount += amount
                    foundId = true
                }
            });
            if (!foundId) {
                data.cart.push({ id: id, amount: amount })
            }


            fs.writeFileSync('data.json', JSON.stringify(data, null, 4));

            // data.cart = 
            res.status(201).json({ message: `Cart updated with: ${id}, ${amount}` })
        } else {
            res.status(400).json({ message: "Invalid id or amount is larger than inventory" })
        }
    }
})
/* Check Cart */
app.get("/cart", (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const value = cartValue()
    res.status(200).json({ cart: data.cart, value: `$${value}` })
})

/* Check out cart */
app.post("/checkout", (req, res) => {

    const value = cartValue()
    if (value >= 120) {

        res.status(400).json({ message: "Cart value is too large, Reduce to below $120" })
    } else {

        /* Update Inventory */
        updateInventory()
        /* Remove Everything from Cart */
        cleanCart()

        res.status(200).json({ "message": `Checked out final price was $${value}` })
    }
})

/* ADMIN ROUTES */
/* Login */
app.post("/admin/login", async (req, res) => {
    const username = req.body.username
    const password = req.body.password
    const allowed = await verifyPassword(username, password)
    if (allowed) {
        let token = randomBytes(20).toString('hex')

        const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
        const user = data.users.find((user: { name: string; }) => user.name === username);

        /**write to json file */
        user.token = token
        fs.writeFileSync('data.json', JSON.stringify(data, null, 4));


        res.status(200).json({ token: token })
    } else {
        res.status(400).json({ message: "invalid credidentials" })
    }
})

/* Restock book */
app.post("/admin/add", async (req, res) => {
    const username = req.body.username
    const token = req.headers.token

    const id = req.body.id
    const amount = req.body.amount

    if (amount <= 0) {
        res.status(400).json({ message: "Amount is zero or less" })

    } else {


        const userToken = await findUserToken(username)

        if (token !== "" && token == userToken) {
            const bookAmount = amount * 10

            const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
            const book = data.books.find((book: { id: string; }) => book.id === id);
            if (book) {

                if (book.limited == true) {
                    res.status(400).json({ message: "Book is of a limited print no more can be added" })
                } else {

                    book.inventory = book.inventory + bookAmount
                    fs.writeFileSync('data.json', JSON.stringify(data, null, 4));
                    res.status(201).json({ message: `success! book '${id}' stock updated with ${bookAmount} books`, book: book })
                }
            } else {
                res.status(400).json({ message: "Book not found" })

            }

        } else {
            res.status(400).json({ message: "invalid token" })
        }
    }
})

/* Check Inventory */
app.post("/admin/check", async (req, res) => {
    const username = req.body.username
    const token = req.headers.token


    const userToken = await findUserToken(username)

    if (token !== "" && token == userToken) {
        const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
        const filteredBooks = data.books.map((book: { id: string, inventory: number, }) => ({ id: book.id, inventory: book.inventory }))



        const books = checkIfInventoryIsZero()

        if (books.length > 0) {
            res.status(200).json({ books: `These books are not in stock ids: ${books}!`, data: filteredBooks, })

        } else {

            res.status(200).json({ data: filteredBooks })
        }
    } else {

        res.status(400).json({ message: "invalid token" })
    }
})
