import express from 'express';
import bodyParser from 'body-parser';
import * as fs from 'fs'
import { checkValidQuery, checkValidQueryNegative, cartValue, cleanCart, updateInventory, checkIfInventoryIsZero, findUserToken, findUsersPassword, verifyPassword, } from './helper'
import { initialise } from './database'
import { removeFromCart, addToCart, checkout, login } from './query'



const router = express.Router()
const port = process.env.port || 1337;
const app = express();

app.get("/init", async (req, res) => {
    const status = await initialise()
    console.log(status);

    if (status) {
        res.status(200).json({ message: "success" })
    } else {
        res.status(400).json({ message: "something went wrong" })
    }
})

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
app.post("/remove", async (req, res) => {
    const itemId = req.body.id
    let amount = req.body.amount
    amount = Number(amount)

    if (!Number.isNaN(amount) && amount > 0) {
        let success = await removeFromCart(itemId, amount)

        success ? res.status(201).json({ message: `Cart removed ${amount} of book id ${itemId}` }) : res.status(400).json({ message: `Request is not valid` })
    } else {
        res.status(400).json({ message: "Invalid id or amount is larger than cart amount" })
    }
})
/* Add book to cart */
app.post("/add", async (req, res) => {
    const itemId = req.body.id
    let amount = req.body.amount
    amount = Number(amount)

    if (!Number.isNaN(amount) && amount > 0) {
        let success = await addToCart(itemId, amount)

        success ? res.status(201).json({ message: `Cart added ${amount} of book id ${itemId}` }) : res.status(400).json({ message: `Request is not valid` })
    } else {
        res.status(400).json({ "message": "Amount is not a number or 0 and less" })
    }
})
/* Check Cart */
app.get("/cart", (req, res) => {
    const data = JSON.parse(fs.readFileSync('data.json', 'utf-8'));
    const value = cartValue()
    res.status(200).json({ cart: data.cart, value: `$${value}` })
})

/* Check out cart */
app.post("/checkout", async (req, res) => {
    const success = await checkout()

    success ? res.status(200).json({ "message": `Cart was Checked out` }) : res.status(400).json({ message: "Cart value is too large, Reduce to below $120" })
})

/* ADMIN ROUTES */
/* Login */
app.post("/login", async (req, res) => {
    const username = req.body.username
    const password = req.body.password

    const response = await login(username, password)
    if (response[0]) {
            res.status(200).json({ token: response[1] })

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
